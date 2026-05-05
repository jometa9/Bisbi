export type RecordingState = 'idle' | 'recording' | 'transcribing';

export type UiLanguage = 'en' | 'es' | 'zh' | 'hi' | 'ar';
export type UiLanguageSetting = UiLanguage | 'system';

export type Precision = 'fast' | 'balanced' | 'high';

export interface AppSettings {
  hotkey: string;
  language: string;
  uiLanguage: UiLanguageSetting;
  pasteMode: 'paste' | 'clipboard';
  saveHistory: boolean;
  precision: Precision;
}

export interface TranscriptionRow {
  id: string;
  createdAt: number;
  text: string;
  language: string | null;
  durationMs: number | null;
  model: string | null;
}

export interface UpdateStatus {
  kind: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error';
  version?: string;
  percent?: number;
  message?: string;
}

export interface ResourceCheck {
  ok: boolean;
  binaryPath: string;
  modelPath: string;
  missing: string[];
}

declare global {
  interface Window {
    bisbi: {
      getAppVersion: () => Promise<string>;
      getPlatform: () => Promise<NodeJS.Platform>;
      getSystemLocale: () => Promise<string>;
      openSettings: () => Promise<void>;
      getSettings: () => Promise<AppSettings>;
      updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
      resetSettings: () => Promise<AppSettings>;
      onSettingsChange: (cb: (s: AppSettings) => void) => () => void;
      getRecordingState: () => Promise<RecordingState>;
      submitAudio: (
        pcm: ArrayBuffer,
        sampleRate: number,
        channels: number
      ) => Promise<{ id: string; text: string; language: string | null; durationMs: number; createdAt: number }>;
      cancelRecording: () => Promise<void>;
      onRecordingStart: (cb: () => void) => () => void;
      onRecordingStop: (cb: () => void) => () => void;
      onRecordingState: (cb: (s: RecordingState) => void) => () => void;
      listHistory: (limit?: number) => Promise<TranscriptionRow[]>;
      deleteHistory: (id: string) => Promise<void>;
      clearHistory: () => Promise<void>;
      onHistoryChange: (cb: () => void) => () => void;
      checkResources: () => Promise<ResourceCheck>;
      updater: {
        getState: () => Promise<UpdateStatus>;
        check: () => Promise<void>;
        install: () => Promise<void>;
        onStateChange: (cb: (s: UpdateStatus) => void) => () => void;
      };
      onNavigate: (cb: (payload: { to: string }) => void) => () => void;
    };
  }
}
