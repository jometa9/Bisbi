import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let cached: string | null = null;

export function getAppVersion(): string {
  if (cached) return cached;
  try {
    const pkgPath = path.resolve(__dirname, '..', '..', '..', 'package.json');
    const raw = fs.readFileSync(pkgPath, 'utf8');
    const parsed = JSON.parse(raw) as { version?: string };
    if (parsed.version && typeof parsed.version === 'string') {
      cached = parsed.version;
      return cached;
    }
  } catch {
    // fall through
  }
  try {
    cached = app.getVersion();
    return cached;
  } catch {
    return '0.0.0';
  }
}
