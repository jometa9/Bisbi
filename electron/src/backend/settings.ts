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
  pasteMode: 'paste',
  saveHistory: true,
  precision: 'balanced',
  suppressNonSpeech: true,
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
  // Migrate legacy "Fn" hotkey: it's no longer supported, fall back to default.
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
  cached = { ...DEFAULT_SETTINGS };
  fs.writeFileSync(settingsPath(), JSON.stringify(cached, null, 2), 'utf8');
  return cached;
}
