export const OFFLINE_MODEL_FILE = 'bsb-001.dat';

export const BUILD_CONFIG = {
  FRONTEND_PORT: 7775,
  PRODUCT_NAME: 'Bisbi',
  OFFLINE_MODEL_FILE,
  DEFAULT_HOTKEY: process.platform === 'darwin' ? 'MetaRight' : 'CtrlRight',
  DEFAULT_HANDS_FREE: false,
} as const;
