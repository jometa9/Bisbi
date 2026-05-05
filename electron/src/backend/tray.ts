import { Tray, Menu, nativeImage, nativeTheme, app } from 'electron';
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

type IconColor = 'black' | 'white';

function pickIconColor(): IconColor {
  // On macOS we always use the black variant and let the OS render it as a
  // template image — that way the icon picks up the actual menubar tint
  // (which depends on the wallpaper, not the system Light/Dark setting).
  if (process.platform === 'darwin') return 'black';
  return nativeTheme.shouldUseDarkColors ? 'white' : 'black';
}

function trayIconPath(state: RecordingState): string {
  const devRoot = path.resolve(__dirname, '..', '..', '..');
  const prodRoot = process.resourcesPath ?? devRoot;
  const slot = state === 'recording' ? 'rec' : 'idle';
  const color = pickIconColor();
  const filename = `owl_${slot}_${color}.png`;
  const candidates = [
    path.join(prodRoot, filename),
    path.join(devRoot, 'build-resources', filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}

function buildIcon(state: RecordingState): Electron.NativeImage {
  const p = trayIconPath(state);
  if (!p) {
    return nativeImage.createEmpty();
  }
  const resized = nativeImage.createFromPath(p).resize({ width: 18, height: 18 });
  if (process.platform === 'darwin') {
    // Must set the template flag AFTER resize — resize() returns a new
    // NativeImage and does not carry the flag over.
    resized.setTemplateImage(true);
  }
  return resized;
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
    tray = new Tray(buildIcon('idle'));
  } catch (err) {
    console.error('[tray] failed to create tray:', err);
    return;
  }
  tray.setToolTip(tBackend(currentLang, 'tray.tooltipIdle'));

  if (process.platform !== 'darwin') {
    tray.on('click', () => opts.onOpenSettings());
  }

  nativeTheme.on('updated', () => {
    if (!tray) return;
    tray.setImage(buildIcon(lastState));
  });

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
  tray.setImage(buildIcon(state));
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
