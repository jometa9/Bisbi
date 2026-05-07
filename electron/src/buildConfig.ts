export const WEB_BASE = 'http://localhost:3001';

// Model files are renamed from their upstream `ggml-*.bin` names to opaque
// `bsb-*.dat` names so they don't reveal the underlying Whisper model when a
// curious user inspects the bundled app. whisper-cli accepts any path.
export const WHISPER_MODELS = {
  fast: 'bsb-001.dat',
  balanced: 'bsb-002.dat',
  high: 'bsb-003.dat',
  max: 'bsb-004.dat',
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
