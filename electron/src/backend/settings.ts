import { app, safeStorage } from 'electron';
import fs from 'fs';
import path from 'path';
import { BUILD_CONFIG } from '../buildConfig';
import {
  OPENAI_TRANSCRIPTION_MODELS,
  type AppSettings,
  type OpenAITranscriptionModel,
} from './types';

const SETTINGS_FILE = 'settings.json';
const ENCRYPTED_PREFIX = 'enc:';

function buildDefaults(): AppSettings {
  return {
    hotkey: BUILD_CONFIG.DEFAULT_HOTKEY,
    handsFreeMode: BUILD_CONFIG.DEFAULT_HANDS_FREE,
    uiLanguage: 'system',
    microphoneId: null,
    muteSystemAudioWhileRecording: false,
    openAtLogin: true,
    mode: 'offline',
    openaiApiKey: null,
    openaiModel: 'gpt-4o-mini-transcribe',
  };
}

function settingsPath(): string {
  const dir = app.getPath('userData');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, SETTINGS_FILE);
}

function encryptApiKey(key: string): string {
  if (!safeStorage.isEncryptionAvailable()) return key;
  try {
    const buf = safeStorage.encryptString(key);
    return `${ENCRYPTED_PREFIX}${buf.toString('base64')}`;
  } catch {
    return key;
  }
}

function decryptApiKey(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith(ENCRYPTED_PREFIX)) return raw;
  if (!safeStorage.isEncryptionAvailable()) return null;
  try {
    return safeStorage.decryptString(Buffer.from(raw.slice(ENCRYPTED_PREFIX.length), 'base64'));
  } catch {
    return null;
  }
}

function normalizeModel(value: unknown): OpenAITranscriptionModel {
  if (typeof value === 'string' && (OPENAI_TRANSCRIPTION_MODELS as readonly string[]).includes(value)) {
    return value as OpenAITranscriptionModel;
  }
  return 'gpt-4o-mini-transcribe';
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
    const apiKey = decryptApiKey(
      typeof parsed.openaiApiKey === 'string' ? parsed.openaiApiKey : null
    );
    cached = {
      ...defaults,
      ...parsed,
      openaiApiKey: apiKey,
      openaiModel: normalizeModel(parsed.openaiModel),
    };
  } catch {
    cached = defaults;
  }
  if (cached.hotkey === 'Fn') {
    cached = { ...cached, hotkey: BUILD_CONFIG.DEFAULT_HOTKEY };
    migrated = true;
  }
  if (migrated) {
    persist(cached);
  }
  return cached;
}

function persist(value: AppSettings): void {
  const serializable: AppSettings = {
    ...value,
    openaiApiKey: value.openaiApiKey ? encryptApiKey(value.openaiApiKey) : null,
  };
  fs.writeFileSync(settingsPath(), JSON.stringify(serializable, null, 2), 'utf8');
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const next: AppSettings = {
    ...current,
    ...patch,
    openaiModel: patch.openaiModel ? normalizeModel(patch.openaiModel) : current.openaiModel,
    openaiApiKey:
      patch.openaiApiKey === undefined
        ? current.openaiApiKey
        : typeof patch.openaiApiKey === 'string' && patch.openaiApiKey.trim().length > 0
        ? patch.openaiApiKey.trim()
        : null,
  };
  cached = next;
  persist(next);
  return next;
}

export function resetSettings(): AppSettings {
  cached = buildDefaults();
  persist(cached);
  return cached;
}
