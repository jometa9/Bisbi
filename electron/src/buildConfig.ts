import fs from 'fs';
import path from 'path';

function readAppVersion(): string {
  try {
    const p = path.resolve(__dirname, '..', '..', 'package.json');
    if (fs.existsSync(p)) {
      const pkg = JSON.parse(fs.readFileSync(p, 'utf8')) as { version?: string };
      if (pkg.version) return pkg.version;
    }
  } catch {}
  return '0.0.0';
}

export const WHISPER_MODELS = {
  fast: 'ggml-base-q5_1.bin',
  balanced: 'ggml-small-q5_1.bin',
  high: 'ggml-large-v3-turbo-q5_0.bin',
} as const;

export const BUILD_CONFIG = {
  APP_VERSION: readAppVersion(),
  FRONTEND_PORT: 7775,
  PROTOCOL: 'bisbi',
  PRODUCT_NAME: 'Bisbi',
  WHISPER_MODELS,
  DEFAULT_PRECISION: 'balanced' as const,
  DEFAULT_HOTKEY: process.platform === 'darwin' ? 'Cmd+Shift+Space' : 'Ctrl+Shift+Space',
} as const;
