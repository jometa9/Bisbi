export type RecordingState = 'idle' | 'recording' | 'transcribing';

export type UiLanguage = 'en' | 'es' | 'zh' | 'hi' | 'ar';
export type UiLanguageSetting = UiLanguage | 'system';

export interface AppSettings {
  hotkey: string;
  handsFreeMode: boolean;
  uiLanguage: UiLanguageSetting;
  microphoneId: string | null;
  muteSystemAudioWhileRecording: boolean;
  openAtLogin: boolean;
  mode: 'offline' | 'cloud';
}

export interface TranscriptionResult {
  id: string;
  text: string;
  language: string | null;
  durationMs: number;
  createdAt: number;
}
