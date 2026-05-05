import { safeStorage } from 'electron';
import { authGet, authSet, authClear } from './db';

export type Plan = 'free' | 'pro';

export interface UserInfo {
  userId: string;
  email: string;
  name: string;
  plan: Plan;
  avatarUrl?: string | null;
}

export interface AuthSession {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
}

let memCache: { token: string; userInfo: UserInfo | null } | null = null;

function encryptString(value: string): Buffer {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(value);
  }
  // Fallback for systems where the OS keychain is unavailable (rare, mostly
  // Linux without libsecret). The data still lives on disk only — no worse
  // than localStorage — and we mark it so decrypt can detect plain values.
  return Buffer.from(`PLAIN:${value}`, 'utf8');
}

function decryptString(buf: Buffer): string | null {
  try {
    if (buf.length >= 6 && buf.slice(0, 6).toString('utf8') === 'PLAIN:') {
      return buf.slice(6).toString('utf8');
    }
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(buf);
    }
    return null;
  } catch {
    return null;
  }
}

function loadFromDisk(): void {
  if (memCache !== null) return;
  const row = authGet();
  if (!row) return;
  const token = decryptString(row.tokenEnc);
  if (!token) {
    authClear();
    return;
  }
  let userInfo: UserInfo | null = null;
  if (row.userInfoEnc) {
    const raw = decryptString(row.userInfoEnc);
    if (raw) {
      try {
        userInfo = JSON.parse(raw) as UserInfo;
      } catch {
        userInfo = null;
      }
    }
  }
  memCache = { token, userInfo };
}

function persist(token: string, userInfo: UserInfo | null): void {
  const tokenEnc = encryptString(token);
  const userInfoEnc = userInfo ? encryptString(JSON.stringify(userInfo)) : null;
  authSet(tokenEnc, userInfoEnc);
  memCache = { token, userInfo };
}

export function getSession(): AuthSession {
  loadFromDisk();
  return {
    isAuthenticated: memCache !== null,
    userInfo: memCache?.userInfo ?? null,
  };
}

// Mock validation. When the real bisbi.io API is wired up, swap the body of
// this function for a fetch call to the validate endpoint and parse the
// response into a UserInfo.
async function validateTokenWithApi(token: string): Promise<UserInfo> {
  // Pretend the network call succeeded. The mock always returns a Pro user
  // so the Account screen has something realistic to display.
  await Promise.resolve();
  const trimmed = token.trim();
  return {
    userId: trimmed.slice(0, 16) || 'mock-user',
    email: 'demo@bisbi.io',
    name: 'Bisbi Demo',
    plan: 'pro',
    avatarUrl: null,
  };
}

export async function loginWithToken(token: string): Promise<AuthSession> {
  const trimmed = token.trim();
  if (!trimmed) throw new Error('Empty token');
  const userInfo = await validateTokenWithApi(trimmed);
  persist(trimmed, userInfo);
  return { isAuthenticated: true, userInfo };
}

export function logout(): AuthSession {
  memCache = null;
  authClear();
  return { isAuthenticated: false, userInfo: null };
}

// Parses an incoming deep link of shape bisbi://login?token=XYZ and returns
// the token if present. Returns null for any other URL.
export function parseLoginDeepLink(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'bisbi:') return null;
    if (u.host.toLowerCase() !== 'login' && !u.pathname.toLowerCase().includes('login')) {
      return null;
    }
    const token =
      u.searchParams.get('token') ??
      u.searchParams.get('apiKey') ??
      u.searchParams.get('api_key');
    return token && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}
