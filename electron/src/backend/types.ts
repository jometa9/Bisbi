export type RecordingState = 'idle' | 'recording' | 'transcribing';

export type UiLanguage = 'en' | 'es' | 'zh' | 'hi' | 'ar';
export type UiLanguageSetting = UiLanguage | 'system';

export type Precision = 'fast' | 'accurate';

export interface AppSettings {
  hotkey: string;
  handsFreeMode: boolean;
  language: string;
  uiLanguage: UiLanguageSetting;
  saveHistory: boolean;
  precision: Precision;
  vocabulary: string;
  microphoneId: string | null;
  muteSystemAudioWhileRecording: boolean;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  language: string | null;
  durationMs: number;
  createdAt: number;
}
