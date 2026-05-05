export type RecordingState = 'idle' | 'recording' | 'transcribing';

export type UiLanguage = 'en' | 'es' | 'zh' | 'hi' | 'ar';
export type UiLanguageSetting = UiLanguage | 'system';

export type Precision = 'fast' | 'balanced' | 'high';

export interface AppSettings {
  hotkey: string;
  handsFreeMode: boolean;
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
  audioDurationMs: number | null;
  wordCount: number | null;
}

export interface StatsTotals {
  totalTranscriptions: number;
  totalAudioMs: number;
  totalWords: number;
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

export type Plan = 'free' | 'pro';

export interface UserInfo {
  userId: string;
  email: string;
  name: string;
  plan: Plan;
  avatarUrl?: string | null;
}

export interface AuthSession {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
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
      ) => Promise<void>;
      cancelRecording: () => Promise<void>;
      onRecordingStart: (cb: () => void) => () => void;
      onRecordingStop: (cb: () => void) => () => void;
      onRecordingState: (cb: (s: RecordingState) => void) => () => void;
      onPillState: (cb: (s: RecordingState) => void) => () => void;
      sendRecordingLevel: (level: number) => void;
      onRecordingLevel: (cb: (level: number) => void) => () => void;
      listHistory: (limit?: number) => Promise<TranscriptionRow[]>;
      deleteHistory: (id: string) => Promise<void>;
      clearHistory: () => Promise<void>;
      onHistoryChange: (cb: () => void) => () => void;
      getStatsTotals: () => Promise<StatsTotals>;
      onStatsTotalsChange: (cb: (s: StatsTotals) => void) => () => void;
      checkResources: () => Promise<ResourceCheck>;
      updater: {
        getState: () => Promise<UpdateStatus>;
        check: () => Promise<void>;
        install: () => Promise<void>;
        onStateChange: (cb: (s: UpdateStatus) => void) => () => void;
      };
      onNavigate: (cb: (payload: { to: string }) => void) => () => void;
      auth: {
        getSession: () => Promise<AuthSession>;
        loginWithToken: (token: string) => Promise<AuthSession>;
        logout: () => Promise<AuthSession>;
        onChange: (cb: (s: AuthSession) => void) => () => void;
      };
      deepLink: {
        getPending: () => Promise<string | null>;
        clearPending: (url?: string) => Promise<void>;
        onLink: (cb: (payload: { url: string }) => void) => () => void;
      };
      openExternal: (url: string) => Promise<void>;
    };
  }
}
