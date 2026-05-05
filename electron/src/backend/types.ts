export type RecordingState = 'idle' | 'recording' | 'transcribing';

export type UiLanguage = 'en' | 'es' | 'zh' | 'hi' | 'ar';
export type UiLanguageSetting = UiLanguage | 'system';

export type Precision = 'fast' | 'balanced' | 'high';

export interface AppSettings {
  hotkey: string;
  // When true, the hotkey toggles recording on tap (press once to start,
  // press again to stop). When false (default), the hotkey is push-to-talk:
  // recording lives only while the key is held. A quick double-tap in
  // push-to-talk mode promotes the current session to a locked recording
  // without flipping this setting.
  handsFreeMode: boolean;
  language: string;
  uiLanguage: UiLanguageSetting;
  pasteMode: 'paste' | 'clipboard';
  saveHistory: boolean;
  precision: Precision;
  microphoneId: string | null;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  language: string | null;
  durationMs: number;
  createdAt: number;
}
