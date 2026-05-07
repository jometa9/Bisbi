export const WEB_BASE = 'http://localhost:3001';

export const WHISPER_MODELS = {
  fast: 'bsb-001.dat',
  accurate: 'bsb-004.dat',
} as const;

export const BUILD_CONFIG = {
  FRONTEND_PORT: 7775,
  PROTOCOL: 'bisbi',
  PRODUCT_NAME: 'Bisbi',
  WHISPER_MODELS,
  DEFAULT_PRECISION: 'accurate' as const,
  DEFAULT_HOTKEY: process.platform === 'darwin' ? 'MetaRight' : 'AltRight',
  DEFAULT_HANDS_FREE: false,
} as const;
