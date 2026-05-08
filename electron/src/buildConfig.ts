export const WEB_BASE = 'https://bisbi.io';

export const WHISPER_MODEL_FILE = 'bsb-002.dat';

export const BUILD_CONFIG = {
  FRONTEND_PORT: 7775,
  PROTOCOL: 'bisbi',
  PRODUCT_NAME: 'Bisbi',
  WHISPER_MODEL_FILE,
  DEFAULT_HOTKEY: process.platform === 'darwin' ? 'MetaRight' : 'CtrlRight',
  DEFAULT_HANDS_FREE: false,
} as const;
