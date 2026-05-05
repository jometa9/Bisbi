import fs from 'fs';
import path from 'path';

const LOG_RETENTION_DAYS = 3;
const RETENTION_WINDOW_MS = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const TRIM_INTERVAL_MS = 60 * 60 * 1000;

const lastTrimByPath = new Map<string, number>();

function parseLineDateMs(line: string): number | null {
  // Look for YYYY-MM-DD near the beginning; this avoids false positives in message payloads.
  const scan = line.slice(0, 96);
  const re = /(\d{4})-(\d{2})-(\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(scan)) !== null) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) continue;
    if (year < 1970 || year > 2100) continue;
    const utcMs = Date.UTC(year, month - 1, day);
    const dt = new Date(utcMs);
    if (
      dt.getUTCFullYear() !== year ||
      dt.getUTCMonth() !== month - 1 ||
      dt.getUTCDate() !== day
    ) {
      continue;
    }
    return utcMs;
  }
  return null;
}

export function trimLogFileToRetention(logPath: string, force = false): void {
  try {
    const now = Date.now();
    const last = lastTrimByPath.get(logPath) ?? 0;
    if (!force && now - last < TRIM_INTERVAL_MS) return;
    lastTrimByPath.set(logPath, now);

    if (!fs.existsSync(logPath)) return;
    const content = fs.readFileSync(logPath, 'utf8');
    const cutoff = now - RETENTION_WINDOW_MS;
    const kept = content
      .split(/\r?\n/)
      .filter((line) => {
        if (!line.trim()) return true;
        const dateMs = parseLineDateMs(line);
        if (dateMs == null) return true;
        return dateMs >= cutoff;
      })
      .join('\n');
    fs.writeFileSync(logPath, kept.length > 0 ? `${kept}\n` : '', 'utf8');
  } catch {
    // Best effort cleanup; never block app startup or logging.
  }
}

export function appendLogLineWithRetention(logPath: string, line: string): void {
  try {
    const dir = path.dirname(logPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(logPath, `${line}\n`, 'utf8');
    trimLogFileToRetention(logPath);
  } catch {
    // Best effort logging; never throw.
  }
}
