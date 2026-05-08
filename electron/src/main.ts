import { BrowserWindow, app, nativeImage, Menu, screen } from 'electron';
import path from 'path';
import fs from 'fs';

import { BUILD_CONFIG } from './buildConfig';
import { resolveDevFrontendPort } from './devPort';
import { appendLogLineWithRetention, trimLogFileToRetention } from './logRetention';
import { registerBackend } from './backend';
import { hardenWindow } from './windowHardening';
import {
  PROTOCOL,
  findProtocolUrl,
  handleDeepLink,
  setMainWindowGetter,
} from './backend/deepLink';

const appRoot = path.resolve(__dirname, '..', '..');
const PRODUCT_NAME = BUILD_CONFIG.PRODUCT_NAME;

const SHOW_DEVTOOLS = true;

function getMainLogPath(): string {
  try {
    const dir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, 'main.log');
  } catch {
    return '';
  }
}

function logMain(message: string, isError = false): void {
  const line = `[${new Date().toISOString()}] ${message}`;
  if (app.isPackaged) {
    try { appendLogLineWithRetention(getMainLogPath(), line); } catch {}
  }
  if (isError) console.error(message);
  else console.log(message);
}

const DEFAULT_WINDOW = { width: 800, height: 700 };

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

function getWindowStatePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function isPointOnAnyDisplay(x: number, y: number): boolean {
  try {
    for (const d of screen.getAllDisplays()) {
      const b = d.bounds;
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function loadWindowState(): WindowState {
  try {
    const p = getWindowStatePath();
    if (!fs.existsSync(p)) return { ...DEFAULT_WINDOW };
    const data = JSON.parse(fs.readFileSync(p, 'utf8')) as Partial<WindowState>;
    const w = typeof data.width === 'number' && data.width >= 600 ? data.width : DEFAULT_WINDOW.width;
    const h = typeof data.height === 'number' && data.height >= 400 ? data.height : DEFAULT_WINDOW.height;
    let x = typeof data.x === 'number' ? data.x : undefined;
    let y = typeof data.y === 'number' ? data.y : undefined;
    if (x != null && y != null && !isPointOnAnyDisplay(x, y)) { x = undefined; y = undefined; }
    return { width: w, height: h, x, y };
  } catch {
    return { ...DEFAULT_WINDOW };
  }
}

function saveWindowState(win: BrowserWindow): void {
  if (!win || win.isDestroyed()) return;
  try {
    const [width, height] = win.getSize();
    const [x, y] = win.getPosition();
    fs.writeFileSync(getWindowStatePath(), JSON.stringify({ width, height, x, y }), 'utf8');
  } catch {}
}

function getFrontendServerUrl(): string | undefined {
  if (app.isPackaged) return undefined;
  return `http://localhost:${resolveDevFrontendPort()}`;
}

function getWindowIconPath(): string {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  const candidates = [
    path.join(appRoot, 'build-resources', iconName),
    path.join(appRoot, 'public', iconName),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return '';
}

let settingsWindow: BrowserWindow | null = null;
let saveStateTimer: ReturnType<typeof setTimeout> | null = null;
let isQuitting = false;

app.setName(PRODUCT_NAME);
if (!app.isPackaged) {
  app.setPath('userData', path.join(app.getPath('appData'), PRODUCT_NAME));
}

setMainWindowGetter(() => settingsWindow);

// Capture a deep link if the OS launched the app via the bisbi:// protocol
// directly (Windows / Linux pass it as a process argument).
{
  const initial = findProtocolUrl(process.argv);
  if (initial) handleDeepLink(initial);
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  // Register the bisbi:// protocol so the OS sends us back here when the
  // landing page redirects after Google sign-in. On Windows in dev we have
  // to point the OS at electron.exe + the app entry, so the relaunched
  // instance can re-attach to this one via the single-instance lock.
  if (process.platform === 'win32' && !app.isPackaged) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [appRoot]);
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }

  app.on('second-instance', (_event, commandLine) => {
    const url = findProtocolUrl(commandLine);
    if (url) {
      // Defer slightly so the relaunched instance has time to bring the
      // existing window to the front before we push the deep link payload.
      setTimeout(() => handleDeepLink(url), 200);
    } else {
      openSettingsWindow();
    }
  });

  // macOS delivers protocol URLs through this event instead of argv.
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (!settingsWindow || settingsWindow.isDestroyed()) {
      openSettingsWindow();
    }
    handleDeepLink(url);
  });

  app.whenReady().then(async () => {
    if (app.isPackaged) {
      const mainLogPath = getMainLogPath();
      trimLogFileToRetention(mainLogPath, true);
      setInterval(() => trimLogFileToRetention(mainLogPath, true), 60 * 60 * 1000);
      logMain(`[main] Bisbi started — logs in: ${mainLogPath}`);
    }

    Menu.setApplicationMenu(null);

    if (process.platform === 'darwin' && app.dock) {
      const dockIconPath = path.join(appRoot, 'build-resources', 'icon.png');
      if (fs.existsSync(dockIconPath)) {
        app.dock.setIcon(nativeImage.createFromPath(dockIconPath));
      }
    }

    logMain('[main] Bisbi ready, registering backend…');

    try {
      await registerBackend({
        onOpenSettings: openSettingsWindow,
        onQuit: () => { isQuitting = true; app.quit(); },
      });
      logMain('[main] backend ready');
    } catch (err) {
      logMain(`[main] backend registration failed: ${(err as Error)?.message ?? err}`, true);
    }

    // In dev we always open the settings window so the developer sees
    // something. In packaged builds we only open it on first run; after that
    // the tray icon is the entry point.
    const isFirstRun = !fs.existsSync(getWindowStatePath());
    const shouldOpenWindow = isFirstRun || !app.isPackaged;
    if (shouldOpenWindow) {
      logMain('[main] opening settings window');
      openSettingsWindow();
    } else {
      logMain('[main] running in tray; click the tray icon to open settings');
    }

    // Keep the dock icon visible whenever the app is running, even when no
    // window is open. It only disappears when the user fully quits Bisbi.
    if (process.platform === 'darwin' && app.dock) {
      app.dock.show();
    }

    app.on('activate', () => openSettingsWindow());
  });
}

function openSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.show();
    settingsWindow.focus();
    if (process.platform === 'darwin' && app.dock) app.dock.show();
    return;
  }

  const state = loadWindowState();
  const iconPath = getWindowIconPath();
  const preloadPath = path.join(__dirname, 'preload.js');

  settingsWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    minWidth: 800,
    minHeight: 700,
    ...(state.x != null && state.y != null && { x: state.x, y: state.y }),
    title: PRODUCT_NAME,
    show: false,
    fullscreenable: false,
    maximizable: false,
    backgroundColor: '#FFFFFF',
    ...(iconPath && { icon: nativeImage.createFromPath(iconPath) }),
    ...(process.platform === 'darwin' && {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 12, y: 12 },
    }),
    ...(process.platform !== 'darwin' && {
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#00000000',
        symbolColor: '#1a1a1a',
        height: 32,
      },
    }),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      devTools: !app.isPackaged || SHOW_DEVTOOLS,
    },
  });

  hardenWindow(settingsWindow);

  if (process.platform === 'darwin' && app.dock) app.dock.show();

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show();
    settingsWindow?.focus();
    if (SHOW_DEVTOOLS) {
      settingsWindow?.webContents.openDevTools({ mode: 'detach' });
    }
  });

  const frontendUrl = getFrontendServerUrl();
  if (frontendUrl) {
    settingsWindow.loadURL(frontendUrl).catch((err) =>
      logMain(`[main] loadURL failed: ${err?.message ?? err}`, true)
    );
  } else {
    const distPath = path.join(app.getAppPath(), 'dist', 'index.html');
    settingsWindow.loadFile(distPath).catch((err) =>
      logMain(`[main] loadFile failed: ${err?.message ?? err}`, true)
    );
  }

  const scheduleSave = () => {
    if (saveStateTimer) clearTimeout(saveStateTimer);
    saveStateTimer = setTimeout(() => {
      saveStateTimer = null;
      if (settingsWindow && !settingsWindow.isDestroyed()) saveWindowState(settingsWindow);
    }, 500);
  };
  settingsWindow.on('resize', scheduleSave);
  settingsWindow.on('move', scheduleSave);

  // Closing the settings window doesn't quit Bisbi — the app keeps running
  // in the tray, and the dock icon stays visible until the user fully quits.
  settingsWindow.on('close', (e) => {
    if (settingsWindow && !settingsWindow.isDestroyed()) saveWindowState(settingsWindow);
    if (isQuitting) return;
    e.preventDefault();
    settingsWindow?.hide();
  });
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

app.on('window-all-closed', () => {
  // Don't quit — Bisbi lives in the tray. Only `before-quit` (triggered by
  // the tray's "Salir" or Cmd+Q) actually shuts the app down.
});

app.on('before-quit', () => {
  isQuitting = true;
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    saveWindowState(settingsWindow);
  }
});
