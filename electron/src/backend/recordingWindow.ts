import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { BUILD_CONFIG } from '../buildConfig';
import type { RecordingState } from './types';

let win: BrowserWindow | null = null;

const WIDTH = 220;
const HEIGHT = 60;
const MARGIN_BOTTOM = 80;

function frontendUrl(route: string): string {
  if (app.isPackaged) {
    const file = path.join(app.getAppPath(), 'dist', 'index.html');
    return `file://${file}#${route}`;
  }
  return `http://localhost:${BUILD_CONFIG.FRONTEND_PORT}/#${route}`;
}

function placeBottomCenter(w: BrowserWindow): void {
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;
  w.setBounds({
    x: x + Math.round((width - WIDTH) / 2),
    y: y + height - HEIGHT - MARGIN_BOTTOM,
    width: WIDTH,
    height: HEIGHT,
  });
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
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.loadURL(frontendUrl('/recording')).catch(() => {});
    win.on('closed', () => {
      win = null;
    });
  }
  placeBottomCenter(win);
  if (!win.isVisible()) win.showInactive();
  setState(state);
}

export function setState(state: RecordingState): void {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('recording:state', state);
}

export function hideRecordingWindow(): void {
  if (!win || win.isDestroyed()) return;
  win.hide();
}
