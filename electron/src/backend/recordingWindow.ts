import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { resolveDevFrontendPort } from '../devPort';
import { hardenWindow } from '../windowHardening';
import type { RecordingState } from './types';

let win: BrowserWindow | null = null;

const WIDTH = 100;
const HEIGHT = 22;
const MARGIN_BOTTOM = 15;

let followTimer: NodeJS.Timeout | null = null;
let lastDisplayId: number | null = null;
let fadeTimer: NodeJS.Timeout | null = null;
const FADE_MS = 180;
// Tracks the intended visibility of the pill. The window is warmed up at
// app start (created hidden) and OS events like display changes or
// sleep/wake can otherwise sneak it onto the screen via showInactive().
let shouldBeVisible = false;

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

function placeBottomCenter(w: BrowserWindow): void {
  const display = getActiveDisplay();
  // workArea excluye taskbar (Windows), dock + menu bar (macOS) y paneles
  // (Linux), así que el pill queda siempre justo encima de esas zonas
  // reservadas sin pelear z-order con ellas.
  const { x, y, width, height } = display.workArea;
  const changed = display.id !== lastDisplayId;
  lastDisplayId = display.id;
  w.setBounds({
    x: x + Math.round((width - WIDTH) / 2),
    y: y + height - HEIGHT - MARGIN_BOTTOM,
    width: WIDTH,
    height: HEIGHT,
  });
  // Only re-show on a display change while the pill is supposed to be on
  // screen. Otherwise OS-driven display events (sleep/wake, monitor
  // hot-plug) would reveal the warmed-up window with stale state.
  if (changed && shouldBeVisible) reassertWindowFlags(w);
}

function reassertWindowFlags(w: BrowserWindow): void {
  try { w.setAlwaysOnTop(true, 'screen-saver'); } catch {}
  try { w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); } catch {}
  try { w.showInactive(); } catch {}
}

function startFollowingActiveDisplay(): void {
  if (followTimer) return;
  followTimer = setInterval(() => {
    if (!win || win.isDestroyed()) return;
    const display = getActiveDisplay();
    if (display.id !== lastDisplayId) {
      placeBottomCenter(win);
      return;
    }
    if (!win.isVisible() || win.getOpacity() === 0) {
      reassertWindowFlags(win);
    }
  }, 200);
}

function stopFollowingActiveDisplay(): void {
  if (!followTimer) return;
  clearInterval(followTimer);
  followTimer = null;
}

let screenListenersBound = false;
function bindScreenListeners(): void {
  if (screenListenersBound) return;
  screenListenersBound = true;
  const reposition = (): void => {
    if (!win || win.isDestroyed()) return;
    lastDisplayId = null;
    // Skip the OS-driven reposition while the pill is hidden — placing
    // bounds and reasserting flags would otherwise sneak the warmed-up
    // window onto the screen with whatever state the renderer last had.
    if (!shouldBeVisible) return;
    placeBottomCenter(win);
  };
  screen.on('display-metrics-changed', reposition);
  screen.on('display-added', reposition);
  screen.on('display-removed', reposition);
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

function ensureWindow(): void {
  if (win && !win.isDestroyed()) return;
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
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      devTools: !app.isPackaged,
    },
  });
  hardenWindow(win);
  // Start fully transparent so that if anything (OS events, focus
  // changes, etc.) ever forces the window visible before we explicitly
  // call showRecordingWindow, nothing is shown on screen.
  try { win.setOpacity(0); } catch {}
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  if (process.platform === 'darwin') {
    try { win.setHiddenInMissionControl(true); } catch {}
  }
  win.loadURL(frontendUrl('/recording')).catch(() => {});
  win.on('closed', () => {
    win = null;
    lastDisplayId = null;
    shouldBeVisible = false;
  });
  bindScreenListeners();
}

export function warmUpRecordingWindow(): void {
  ensureWindow();
}

export function showRecordingWindow(state: RecordingState): void {
  ensureWindow();
  // Push the state to the renderer before making the window visible so
  // it never paints with the stale default state from a previous show.
  setState(state);
  shouldBeVisible = true;
  placeBottomCenter(win!);
  reassertWindowFlags(win!);
  if (!win!.isVisible()) {
    try { win!.setOpacity(0); } catch {}
    win!.showInactive();
  }
  fade(1);
  startFollowingActiveDisplay();
}

export function setState(state: RecordingState): void {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('recording:pillState', state);
}

export function setLevel(level: number): void {
  if (!win || win.isDestroyed()) return;
  if (!win.isVisible()) return;
  win.webContents.send('recording:level', level);
}

export function hideRecordingWindow(): void {
  shouldBeVisible = false;
  stopFollowingActiveDisplay();
  if (!win || win.isDestroyed()) return;
  fade(0);
}
