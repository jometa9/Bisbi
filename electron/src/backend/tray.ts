import { Tray, Menu, nativeImage, nativeTheme } from 'electron';
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
    resized.setTemplateImage(true);
  }
  return resized;
}

export interface TrayOptions {
  uiLanguage: UiLanguage;
  onOpenSettings: () => void;
  onShowHistory: () => void;
  onQuit: () => void;
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
