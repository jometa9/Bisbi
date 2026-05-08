import { execFileSync } from 'child_process';
import { createHash, randomBytes } from 'crypto';
import fs from 'fs';
import os from 'os';
import { metaGet, metaSet } from './db';

const HWID_META_KEY = 'device_hwid_v1';
const HWID_SALT = 'bisbi:device:v1';

function readDarwinPlatformUuid(): string | null {
  try {
    const out = execFileSync('/usr/sbin/ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice'], {
      timeout: 2000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString('utf8');
    const m = out.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function readWindowsMachineGuid(): string | null {
  try {
    const out = execFileSync(
      'reg',
      ['QUERY', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'],
      { timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] }
    ).toString('utf8');
    const m = out.match(/MachineGuid\s+REG_SZ\s+([a-f0-9-]+)/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function readLinuxMachineId(): string | null {
  for (const p of ['/etc/machine-id', '/var/lib/dbus/machine-id']) {
    try {
      const v = fs.readFileSync(p, 'utf8').trim();
      if (v) return v;
    } catch {}
  }
  return null;
}

function deriveRawId(): string {
  let raw: string | null = null;
  if (process.platform === 'darwin') raw = readDarwinPlatformUuid();
  else if (process.platform === 'win32') raw = readWindowsMachineGuid();
  else raw = readLinuxMachineId();

  if (raw) return raw;

  const fallback = `${os.hostname()}|${os.platform()}|${os.arch()}|${os.userInfo().username}`;
  return `fallback:${fallback}`;
}

function hashId(raw: string): string {
  return createHash('sha256').update(`${HWID_SALT}|${raw}`).digest('hex');
}

let cachedHwid: string | null = null;

export function getHwid(): string {
  if (cachedHwid) return cachedHwid;

  const stored = metaGet(HWID_META_KEY);
  if (stored && /^[a-f0-9]{64}(\|[a-f0-9]{32})?$/.test(stored)) {
    cachedHwid = stored;
    return stored;
  }

  const raw = deriveRawId();
  const installSalt = randomBytes(16).toString('hex');
  const hashed = `${hashId(`${raw}|${installSalt}`)}|${installSalt}`;
  metaSet(HWID_META_KEY, hashed);
  cachedHwid = hashed;
  return hashed;
}
