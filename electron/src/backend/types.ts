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

export interface TranscriptionResult {
  id: string;
  text: string;
  language: string | null;
  durationMs: number;
  createdAt: number;
}
