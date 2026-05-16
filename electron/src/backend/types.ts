export type RecordingState = 'idle' | 'recording' | 'transcribing';

export type UiLanguage = 'en' | 'es' | 'zh' | 'hi' | 'ar';
export type UiLanguageSetting = UiLanguage | 'system';

export const OPENAI_TRANSCRIPTION_MODELS = [
  'whisper-1',
  'gpt-4o-mini-transcribe',
  'gpt-4o-transcribe',
] as const;
export type OpenAITranscriptionModel = (typeof OPENAI_TRANSCRIPTION_MODELS)[number];

export interface AppSettings {
  hotkey: string;
  handsFreeMode: boolean;
  uiLanguage: UiLanguageSetting;
  microphoneId: string | null;
  muteSystemAudioWhileRecording: boolean;
  openAtLogin: boolean;
  mode: 'offline' | 'cloud';
  openaiApiKey: string | null;
  openaiModel: OpenAITranscriptionModel;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  language: string | null;
  durationMs: number;
  createdAt: number;
}
