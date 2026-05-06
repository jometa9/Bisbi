export const WHISPER_MODELS = {
  fast: 'ggml-base-q5_1.bin',
  balanced: 'ggml-small-q5_1.bin',
  high: 'ggml-large-v3-turbo-q5_0.bin',
} as const;

export const BUILD_CONFIG = {
  FRONTEND_PORT: 7775,
  PROTOCOL: 'bisbi',
  PRODUCT_NAME: 'Bisbi',
  WHISPER_MODELS,
  DEFAULT_PRECISION: 'high' as const,
  // Single-key defaults so the hotkey works in push-to-talk: hold one thumb-
  // reachable key. Right Command on Mac, Right Alt elsewhere.
  DEFAULT_HOTKEY: process.platform === 'darwin' ? 'MetaRight' : 'AltRight',
  DEFAULT_HANDS_FREE: false,
} as const;
