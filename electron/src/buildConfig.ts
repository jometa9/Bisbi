//export const WEB_BASE = 'https://bisbi.io';
export const WEB_BASE = 'http://localhost:3001';

export type WhisperPrecision = 'fast' | 'accurate';

export const WHISPER_MODELS: Record<WhisperPrecision, string> = {
  fast: 'bsb-001.dat',
  accurate: 'bsb-002.dat',
};

// Windows machines tend to lack the GPU acceleration that makes the larger
// model usable in real time, so they default to fast. Mac (Metal) handles the
// accurate model fine.
const DEFAULT_PRECISION: WhisperPrecision =
  process.platform === 'win32' ? 'fast' : 'accurate';

export const BUILD_CONFIG = {
  FRONTEND_PORT: 7775,
  PROTOCOL: 'bisbi',
  PRODUCT_NAME: 'Bisbi',
  WHISPER_MODELS,
  DEFAULT_PRECISION,
  DEFAULT_HOTKEY: process.platform === 'darwin' ? 'MetaRight' : 'CtrlRight',
  DEFAULT_HANDS_FREE: false,
} as const;
