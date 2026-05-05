import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import fs from 'fs';
import type { RecordingState, UiLanguage } from './types';
import { tBackend } from './i18n';

let tray: Tray | null = null;
let onOpenSettings: (() => void) | null = null;
let onShowHistory: (() => void) | null = null;
let lastState: RecordingState = 'idle';
let currentOpts: TrayOptions | null = null;
let currentLang: UiLanguage = 'en';

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
  uiLanguage: UiLanguage;
  onOpenSettings: () => void;
  onShowHistory: () => void;
  onQuit: () => void;
  onCheckForUpdates: () => void;
}

export function initTray(opts: TrayOptions): void {
  if (tray) return;
  onOpenSettings = opts.onOpenSettings;
  onShowHistory = opts.onShowHistory;
  currentOpts = opts;
  currentLang = opts.uiLanguage;

  try {
    tray = new Tray(buildIcon());
  } catch (err) {
    console.error('[tray] failed to create tray:', err);
    return;
  }
  tray.setToolTip(tBackend(currentLang, 'tray.tooltipIdle'));

  // Always show a visible label on macOS so the user can find the tray entry
  // even before we have a proper icon asset in build-resources/.
  if (process.platform === 'darwin') {
    tray.setTitle('Bisbi');
  }

  if (process.platform !== 'darwin') {
    tray.on('click', () => opts.onOpenSettings());
  }

  rebuildMenu();
}

export function setRecordingState(state: RecordingState): void {
  if (!tray) return;
  lastState = state;
  const tooltipKey =
    state === 'recording'
      ? 'tray.tooltipRecording'
      : state === 'transcribing'
      ? 'tray.tooltipTranscribing'
      : 'tray.tooltipIdle';
  tray.setToolTip(tBackend(currentLang, tooltipKey));
  if (process.platform === 'darwin') {
    const title =
      state === 'recording' ? '● REC' : state === 'transcribing' ? '… ' : 'Bisbi';
    tray.setTitle(title);
  }
}

export function getRecordingState(): RecordingState {
  return lastState;
}

export function rebuildTrayLabels(lang: UiLanguage): void {
  currentLang = lang;
  if (!tray) return;
  // Refresh tooltip for the current state and rebuild the context menu.
  setRecordingState(lastState);
  rebuildMenu();
}

function rebuildMenu(): void {
  if (!tray || !currentOpts) return;
  const opts = currentOpts;
  const menu = Menu.buildFromTemplate([
    {
      label: 'Bisbi',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: tBackend(currentLang, 'tray.openSettings'),
      click: () => onOpenSettings?.(),
    },
    {
      label: tBackend(currentLang, 'tray.history'),
      click: () => onShowHistory?.(),
    },
    { type: 'separator' },
    {
      label: tBackend(currentLang, 'tray.checkUpdates'),
      click: () => opts.onCheckForUpdates(),
    },
    { type: 'separator' },
    {
      label: tBackend(currentLang, 'tray.version', { v: app.getVersion() }),
      enabled: false,
    },
    {
      label: tBackend(currentLang, 'tray.quit'),
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
