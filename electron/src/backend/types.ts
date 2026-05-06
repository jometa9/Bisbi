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
  // When true, whisper-cli is invoked with --suppress-nst so non-speech
  // tokens like "[Música]", "[Risas]" or "(suspiro)" are stripped from the
  // transcript. Defaults to true because most users dictate text and don't
  // want these annotations leaking into the output.
  suppressNonSpeech: boolean;
  // Free-form text passed to whisper-cli as `--prompt`. Used as initial
  // context so the model is more likely to recognise proper names, brand
  // terms, technical jargon, etc. Empty string ⇒ no prompt is forwarded.
  vocabulary: string;
  microphoneId: string | null;
  // When true, mute the system output for the duration of the recording and
  // restore the previous mute state on stop. Off by default.
  muteSystemAudioWhileRecording: boolean;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  language: string | null;
  durationMs: number;
  createdAt: number;
}
