import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { resolveDevFrontendPort } from '../devPort';
import { hardenWindow } from '../windowHardening';
import type { RecordingState } from './types';

let win: BrowserWindow | null = null;

const WIDTH = 130;
const HEIGHT = 22;
const MARGIN_BOTTOM = 15;

let followTimer: NodeJS.Timeout | null = null;
let lastDisplayId: number | null = null;
let fadeTimer: NodeJS.Timeout | null = null;
const FADE_MS = 180;

function frontendUrl(route: string): string {
  if (app.isPackaged) {
    const file = path.join(app.getAppPath(), 'dist', 'index.html');
    return `file://${file}#${route}`;
  }
  return `http://localhost:${resolveDevFrontendPort()}/#${route}`;
}

function getActiveDisplay(): Electron.Display {
  try {
    const point = screen.getCursorScreenPoint();
    return screen.getDisplayNearestPoint(point);
  } catch {
    return screen.getPrimaryDisplay();
  }
}

// Always position relative to the display's physical bounds (not workArea),
// so the bar sits at the screen bottom regardless of dock visibility, full-
// screen apps, or which space is active. Combined with the 'screen-saver'
// window level + NSPanel type, the bar floats above the dock when present.
// This is the same approach Wispr Flow uses ("locked to bottom-center").
function placeBottomCenter(w: BrowserWindow): void {
  const display = getActiveDisplay();
  const { x, y, width, height } = display.bounds;
  const changed = display.id !== lastDisplayId;
  lastDisplayId = display.id;
  w.setBounds({
    x: x + Math.round((width - WIDTH) / 2),
    y: y + height - HEIGHT - MARGIN_BOTTOM,
    width: WIDTH,
    height: HEIGHT,
  });
  if (changed) {
    try { w.setAlwaysOnTop(true, 'screen-saver'); } catch {}
    try { w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); } catch {}
    try { w.showInactive(); } catch {}
  }
}

function startFollowingActiveDisplay(): void {
  if (followTimer) return;
  followTimer = setInterval(() => {
    if (!win || win.isDestroyed()) return;
    const display = getActiveDisplay();
    if (display.id !== lastDisplayId) placeBottomCenter(win);
    else if (!win.isVisible()) {
      try { win.showInactive(); } catch {}
    }
  }, 200);
}

function stopFollowingActiveDisplay(): void {
  if (!followTimer) return;
  clearInterval(followTimer);
  followTimer = null;
}

function cancelFade(): void {
  if (!fadeTimer) return;
  clearInterval(fadeTimer);
  fadeTimer = null;
}

function fade(target: number, onDone?: () => void): void {
  cancelFade();
  if (!win || win.isDestroyed()) return;
  const from = win.getOpacity();
  if (from === target) { onDone?.(); return; }
  const start = Date.now();
  fadeTimer = setInterval(() => {
    if (!win || win.isDestroyed()) { cancelFade(); return; }
    const t = Math.min(1, (Date.now() - start) / FADE_MS);
    const v = from + (target - from) * t;
    try { win.setOpacity(v); } catch {}
    if (t >= 1) {
      cancelFade();
      onDone?.();
    }
  }, 16);
}

export function showRecordingWindow(state: RecordingState): void {
  if (!win || win.isDestroyed()) {
    win = new BrowserWindow({
      width: WIDTH,
      height: HEIGHT,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      hasShadow: false,
      focusable: false,
      show: false,
      ...(process.platform === 'darwin' && { type: 'panel' as const }),
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    if (process.platform === 'darwin') {
      try { win.setHiddenInMissionControl(true); } catch {}
    }
    win.loadURL(frontendUrl('/recording')).catch(() => {});
    win.on('closed', () => {
      win = null;
    });
  }
  placeBottomCenter(win);
  if (!win.isVisible()) {
    try { win.setOpacity(0); } catch {}
    win.showInactive();
  }
  fade(1);
  startFollowingActiveDisplay();
  setState(state);
}

export function setState(state: RecordingState): void {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('recording:state', state);
}

export function setLevel(level: number): void {
  if (!win || win.isDestroyed()) return;
  if (!win.isVisible()) return;
  win.webContents.send('recording:level', level);
}

export function hideRecordingWindow(): void {
  stopFollowingActiveDisplay();
  if (!win || win.isDestroyed()) return;
  // Don't actually hide() — keep the window alive at opacity 0 so the next
  // show is a pure opacity fade with no native macOS show animation.
  fade(0);
}
