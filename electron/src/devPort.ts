import fs from 'fs';
import path from 'path';
import { BUILD_CONFIG } from './buildConfig';

const PORT_FILE = path.resolve(__dirname, '..', '..', '.bisbi-dev-port');

export function resolveDevFrontendPort(): number {
  const envPort = Number(process.env.BISBI_FRONTEND_PORT);
  if (Number.isFinite(envPort) && envPort > 0) return envPort;
  try {
    if (fs.existsSync(PORT_FILE)) {
      const filePort = Number(fs.readFileSync(PORT_FILE, 'utf8').trim());
      if (Number.isFinite(filePort) && filePort > 0) return filePort;
    }
  } catch {}
  return BUILD_CONFIG.FRONTEND_PORT;
}
