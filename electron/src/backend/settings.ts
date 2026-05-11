import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { BUILD_CONFIG } from '../buildConfig';
import type { AppSettings } from './types';

const SETTINGS_FILE = 'settings.json';

function deriveDefaultLanguage(): string {
  try {
    const locale = app.getLocale() || '';
    const primary = locale.toLowerCase().replace('_', '-').split('-')[0] ?? '';
    if (primary.length >= 2 && primary.length <= 3) return primary;
    return 'auto';
  } catch {
    return 'auto';
  }
}

function buildDefaults(): AppSettings {
  return {
    hotkey: BUILD_CONFIG.DEFAULT_HOTKEY,
    handsFreeMode: BUILD_CONFIG.DEFAULT_HANDS_FREE,
    language: deriveDefaultLanguage(),
    uiLanguage: 'system',
    saveHistory: true,
    vocabulary: '',
    microphoneId: null,
    muteSystemAudioWhileRecording: false,
    openAtLogin: true,
    precision: BUILD_CONFIG.DEFAULT_PRECISION,
    mode: 'cloud',
  };
}

function settingsPath(): string {
  const dir = app.getPath('userData');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, SETTINGS_FILE);
}

let cached: AppSettings | null = null;

export function getSettings(): AppSettings {
  if (cached) return cached;
  const defaults = buildDefaults();
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    cached = { ...defaults, ...parsed };
  } catch {
    cached = defaults;
  }
  if (cached.hotkey === 'Fn') {
    cached = { ...cached, hotkey: BUILD_CONFIG.DEFAULT_HOTKEY };
    fs.writeFileSync(settingsPath(), JSON.stringify(cached, null, 2), 'utf8');
  }
  return cached;
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const next: AppSettings = { ...current, ...patch };
  cached = next;
  fs.writeFileSync(settingsPath(), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

export function resetSettings(): AppSettings {
  cached = buildDefaults();
  fs.writeFileSync(settingsPath(), JSON.stringify(cached, null, 2), 'utf8');
  return cached;
}
