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

export const BUILD_CONFIG = {
  APP_VERSION: readAppVersion(),
  FRONTEND_PORT: 7775,
  PROTOCOL: 'bisbi',
  PRODUCT_NAME: 'Bisbi',
  WHISPER_MODEL_FILE: 'ggml-small-q5_1.bin',
  DEFAULT_HOTKEY: process.platform === 'darwin' ? 'Cmd+Shift+Space' : 'Ctrl+Shift+Space',
} as const;
