import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import fs from 'fs';
import type { RecordingState } from './types';

let tray: Tray | null = null;
let onOpenSettings: (() => void) | null = null;
let onShowHistory: (() => void) | null = null;
let lastState: RecordingState = 'idle';

function trayIconPath(): string {
  // Tray icon is a small monochrome PNG. Falls back to the main app icon if
  // the tray-specific asset is missing during early dev.
  const candidates = [
    path.resolve(__dirname, '..', '..', '..', 'build-resources', 'trayTemplate.png'),
    path.resolve(__dirname, '..', '..', '..', 'build-resources', 'icon.png'),
    path.resolve(__dirname, '..', '..', '..', 'public', 'icon.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}

function buildIcon(): Electron.NativeImage {
  const p = trayIconPath();
  if (!p) {
    // Empty image; macOS will still show a tray slot with the title text.
    return nativeImage.createEmpty();
  }
  const img = nativeImage.createFromPath(p);
  if (process.platform === 'darwin') {
    // Template images render correctly in dark/light mode on macOS.
    img.setTemplateImage(true);
  }
  return img.resize({ width: 18, height: 18 });
}

export interface TrayOptions {
  onOpenSettings: () => void;
  onShowHistory: () => void;
  onQuit: () => void;
  onCheckForUpdates: () => void;
}

export function initTray(opts: TrayOptions): void {
  if (tray) return;
  onOpenSettings = opts.onOpenSettings;
  onShowHistory = opts.onShowHistory;

  try {
    tray = new Tray(buildIcon());
  } catch (err) {
    console.error('[tray] failed to create tray:', err);
    return;
  }
  tray.setToolTip('Bisbi — listo para dictar');

  // Always show a visible label on macOS so the user can find the tray entry
  // even before we have a proper icon asset in build-resources/.
  if (process.platform === 'darwin') {
    tray.setTitle('Bisbi');
  }

  if (process.platform !== 'darwin') {
    tray.on('click', () => opts.onOpenSettings());
  }

  rebuildMenu(opts);
}

export function setRecordingState(state: RecordingState): void {
  if (!tray) return;
  lastState = state;
  const tooltip =
    state === 'recording'
      ? 'Bisbi — grabando…'
      : state === 'transcribing'
      ? 'Bisbi — transcribiendo…'
      : 'Bisbi — listo para dictar';
  tray.setToolTip(tooltip);
  if (process.platform === 'darwin') {
    const title =
      state === 'recording' ? '● REC' : state === 'transcribing' ? '… ' : 'Bisbi';
    tray.setTitle(title);
  }
}

export function getRecordingState(): RecordingState {
  return lastState;
}

function rebuildMenu(opts: TrayOptions): void {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    {
      label: 'Bisbi',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Abrir ajustes',
      click: () => onOpenSettings?.(),
    },
    {
      label: 'Historial',
      click: () => onShowHistory?.(),
    },
    { type: 'separator' },
    {
      label: 'Buscar actualizaciones',
      click: () => opts.onCheckForUpdates(),
    },
    { type: 'separator' },
    {
      label: `Versión ${app.getVersion()}`,
      enabled: false,
    },
    {
      label: 'Salir',
      click: () => opts.onQuit(),
    },
  ]);
  tray.setContextMenu(menu);
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
