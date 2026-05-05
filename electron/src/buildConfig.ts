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
  DEFAULT_PRECISION: 'balanced' as const,
  // Single-key defaults so the hotkey works in push-to-talk: hold one thumb-
  // reachable key. Fn on Mac (libuiohook reports it as VC_FUNCTION); Right Alt
  // elsewhere because Fn isn't a reportable keycode on most non-Mac keyboards.
  DEFAULT_HOTKEY: process.platform === 'darwin' ? 'Fn' : 'AltRight',
  DEFAULT_HANDS_FREE: false,
} as const;
