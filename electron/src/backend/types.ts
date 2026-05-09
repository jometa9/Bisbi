export type RecordingState = 'idle' | 'recording' | 'transcribing';

export type UiLanguage = 'en' | 'es' | 'zh' | 'hi' | 'ar';
export type UiLanguageSetting = UiLanguage | 'system';

export interface AppSettings {
  hotkey: string;
  handsFreeMode: boolean;
  language: string;
  uiLanguage: UiLanguageSetting;
  saveHistory: boolean;
  vocabulary: string;
  microphoneId: string | null;
  muteSystemAudioWhileRecording: boolean;
  openAtLogin: boolean;
  precision: 'fast' | 'accurate';
}

export interface TranscriptionResult {
  id: string;
  text: string;
  language: string | null;
  durationMs: number;
  createdAt: number;
}
