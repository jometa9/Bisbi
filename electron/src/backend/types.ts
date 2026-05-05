export type RecordingState = 'idle' | 'recording' | 'transcribing';

export interface AppSettings {
  hotkey: string;
  language: string;
  pasteMode: 'paste' | 'clipboard';
  saveHistory: boolean;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  language: string | null;
  durationMs: number;
  createdAt: number;
}
