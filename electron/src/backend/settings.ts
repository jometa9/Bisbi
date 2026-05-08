import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { BUILD_CONFIG } from '../buildConfig';
import type { AppSettings } from './types';

const SETTINGS_FILE = 'settings.json';

const DEFAULT_SETTINGS: AppSettings = {
  hotkey: BUILD_CONFIG.DEFAULT_HOTKEY,
  handsFreeMode: BUILD_CONFIG.DEFAULT_HANDS_FREE,
  language: 'auto',
  uiLanguage: 'system',
  saveHistory: true,
  precision: 'fast',
  vocabulary: '',
  microphoneId: null,
  muteSystemAudioWhileRecording: false,
};

function settingsPath(): string {
  const dir = app.getPath('userData');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, SETTINGS_FILE);
}

let cached: AppSettings | null = null;

export function getSettings(): AppSettings {
  if (cached) return cached;
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    cached = { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    cached = { ...DEFAULT_SETTINGS };
  }
  let migrated = false;
  if (cached.hotkey === 'Fn') {
    cached = { ...cached, hotkey: BUILD_CONFIG.DEFAULT_HOTKEY };
    migrated = true;
  }
  // Older builds shipped 'balanced' / 'high' / 'max' precisions; collapse any
  // value other than 'fast' onto 'accurate' so existing users keep getting a
  // quality-leaning transcription.
  if (cached.precision !== 'fast' && cached.precision !== 'accurate') {
    cached = { ...cached, precision: 'accurate' };
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
  cached = { ...DEFAULT_SETTINGS };
  fs.writeFileSync(settingsPath(), JSON.stringify(cached, null, 2), 'utf8');
  return cached;
}
