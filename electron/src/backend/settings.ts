import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { BUILD_CONFIG } from '../buildConfig';
import type { AppSettings } from './types';

const SETTINGS_FILE = 'settings.json';

function buildDefaults(): AppSettings {
  return {
    hotkey: BUILD_CONFIG.DEFAULT_HOTKEY,
    handsFreeMode: BUILD_CONFIG.DEFAULT_HANDS_FREE,
    uiLanguage: 'system',
    microphoneId: null,
    muteSystemAudioWhileRecording: false,
    openAtLogin: true,
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
  let migrated = false;
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppSettings> & Record<string, unknown>;
    // Drop legacy fields removed in older versions so they don't linger in the
    // saved settings file.
    for (const stale of ['precision', 'language', 'saveHistory'] as const) {
      if (stale in parsed) {
        delete parsed[stale];
        migrated = true;
      }
    }
    cached = { ...defaults, ...parsed };
  } catch {
    cached = defaults;
  }
  if (cached.hotkey === 'Fn') {
    cached = { ...cached, hotkey: BUILD_CONFIG.DEFAULT_HOTKEY };
    migrated = true;
  }
  if (migrated) {
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
