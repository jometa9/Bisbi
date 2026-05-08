import { safeStorage } from 'electron';
import {
  authGet,
  authSet,
  authClear,
  metaGet,
  metaSet,
  setMonthlyWordLimit,
  setMonthlyWordUsageFromServer,
} from './db';
import { apiFetch } from './apiClient';

export type Plan = 'free' | 'pro';

export interface PricingPlan {
  priceId: string | null;
  amount: number;
  currency: string;
  label: string;
}

export interface PricingPlanAnnual extends PricingPlan {
  monthlyEquivalent: string;
  savings: string;
}

export interface Pricing {
  pro: {
    monthly: PricingPlan;
    annual: PricingPlanAnnual;
  };
}

export interface UserInfo {
  userId: string;
  email: string;
  name: string;
  plan: Plan;
  avatarUrl?: string | null;
  subscriptionStatus?: string | null;
  subscriptionExpiresAt?: string | null;
  subscriptionBillingPeriod?: string | null;
  pricing?: Pricing | null;
}

export interface AuthSession {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
}

const LAST_VALIDATED_META_KEY = 'auth_last_validated_at';
const PRO_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
const REVALIDATE_AFTER_MS = 5 * 60 * 1000;

let memCache: { token: string; userInfo: UserInfo | null } | null = null;

function encryptString(value: string): Buffer {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure storage unavailable on this system');
  }
  return safeStorage.encryptString(value);
}

function decryptString(buf: Buffer): string | null {
  if (!safeStorage.isEncryptionAvailable()) return null;
  try {
    return safeStorage.decryptString(buf);
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
  const prevPlan = memCache?.userInfo?.plan;
  const tokenEnc = encryptString(token);
  const userInfoEnc = userInfo ? encryptString(JSON.stringify(userInfo)) : null;
  authSet(tokenEnc, userInfoEnc);
  memCache = { token, userInfo };
  if (prevPlan === 'pro' && userInfo?.plan && userInfo.plan !== 'pro' && onPlanDowngrade) {
    try { onPlanDowngrade(); } catch { /* swallow */ }
  }
}

let onPlanDowngrade: (() => void) | null = null;

export function setAuthEventHandlers(handlers: {
  onPlanDowngrade?: () => void;
}): void {
  onPlanDowngrade = handlers.onPlanDowngrade ?? null;
}

function getLastValidatedAt(): number {
  const v = metaGet(LAST_VALIDATED_META_KEY);
  if (!v) return 0;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function setLastValidatedAt(ts: number): void {
  metaSet(LAST_VALIDATED_META_KEY, String(ts));
}

export function getSession(): AuthSession {
  loadFromDisk();
  return {
    isAuthenticated: memCache !== null,
    userInfo: memCache?.userInfo ?? null,
  };
}

export function getAuthToken(): string | null {
  loadFromDisk();
  return memCache?.token ?? null;
}

async function validateTokenWithApi(token: string): Promise<UserInfo> {
  console.log('[auth] validateTokenWithApi: calling /api/license');
  const resp = await apiFetch('/api/license', { token });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    console.error('[auth] /api/license failed', { status: resp.status, body });
    throw new Error(`Auth failed: ${resp.status}`);
  }
  const data = await resp.json() as {
    userId: string;
    email: string;
    name: string;
    avatar?: string | null;
    plan: Plan;
    subscription?: {
      status: string;
      tier: string;
      billingPeriod: string | null;
      expiresAt: string | null;
    } | null;
    pricing?: Pricing | null;
    usage?: {
      monthKey: string;
      wordsUsed: number;
      wordsLimit: number | null;
      exceeded: boolean;
      remaining: number | null;
    } | null;
  };
  if (data.usage) {
    setMonthlyWordUsageFromServer(data.usage.wordsUsed, data.usage.monthKey);
    setMonthlyWordLimit(data.usage.wordsLimit);
  }
  setLastValidatedAt(Date.now());
  console.log('[auth] /api/license ok', {
    plan: data.plan,
    subscriptionStatus: data.subscription?.status ?? null,
    hasReleaseField: 'release' in (data as Record<string, unknown>),
  });
  return {
    userId: data.userId,
    email: data.email,
    name: data.name,
    plan: data.plan,
    avatarUrl: data.avatar ?? null,
    subscriptionStatus: data.subscription?.status ?? null,
    subscriptionExpiresAt: data.subscription?.expiresAt ?? null,
    subscriptionBillingPeriod: data.subscription?.billingPeriod ?? null,
    pricing: data.pricing ?? null,
  };
}

export async function loginWithToken(token: string): Promise<AuthSession> {
  const trimmed = token.trim();
  if (!trimmed) throw new Error('Empty token');
  const userInfo = await validateTokenWithApi(trimmed);
  persist(trimmed, userInfo);
  return { isAuthenticated: true, userInfo };
}

export async function refreshSession(): Promise<AuthSession> {
  loadFromDisk();
  if (!memCache?.token) {
    console.log('[auth] refreshSession: no token in memCache, returning unauthenticated');
    return { isAuthenticated: false, userInfo: null };
  }
  try {
    const userInfo = await validateTokenWithApi(memCache.token);
    persist(memCache.token, userInfo);
    console.log('[auth] refreshSession: success, plan =', userInfo.plan);
    return { isAuthenticated: true, userInfo };
  } catch (err) {
    console.error('[auth] refreshSession failed, keeping cached userInfo', err);
    return { isAuthenticated: true, userInfo: memCache.userInfo };
  }
}

export type CanTranscribeResult =
  | { allowed: true }
  | { allowed: false; reason: 'unauthenticated' | 'limit-reached' | 'session-expired'; info?: { used?: number; limit?: number } };

export function canTranscribe(getLocalUsage: () => { used: number; limit: number }): CanTranscribeResult {
  loadFromDisk();
  if (!memCache?.token) {
    return { allowed: false, reason: 'unauthenticated' };
  }

  const sinceValidation = Date.now() - getLastValidatedAt();
  if (sinceValidation > REVALIDATE_AFTER_MS) {
    void refreshSession();
  }

  const isPro = memCache.userInfo?.plan === 'pro';
  if (isPro) {
    if (sinceValidation > PRO_GRACE_MS) {
      return { allowed: false, reason: 'session-expired' };
    }
    const expiresAtRaw = memCache.userInfo?.subscriptionExpiresAt;
    if (expiresAtRaw) {
      const expiresAt = Date.parse(expiresAtRaw);
      if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
        return { allowed: false, reason: 'session-expired' };
      }
    }
    return { allowed: true };
  }

  const { used, limit } = getLocalUsage();
  if (used >= limit) {
    return { allowed: false, reason: 'limit-reached', info: { used, limit } };
  }
  return { allowed: true };
}

let periodicRefreshTimer: NodeJS.Timeout | null = null;

export function startPeriodicAuthRefresh(): void {
  if (periodicRefreshTimer) return;
  void refreshSession();
  periodicRefreshTimer = setInterval(() => {
    void refreshSession();
  }, REVALIDATE_AFTER_MS);
}

export function stopPeriodicAuthRefresh(): void {
  if (periodicRefreshTimer) {
    clearInterval(periodicRefreshTimer);
    periodicRefreshTimer = null;
  }
}

export async function startCheckout(billingPeriod: 'monthly' | 'annual'): Promise<string> {
  loadFromDisk();
  if (!memCache?.token) throw new Error('Not authenticated');
  const resp = await apiFetch('/api/checkout', {
    method: 'POST',
    token: memCache.token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ billingPeriod }),
  });
  if (!resp.ok) throw new Error(`Checkout failed: ${resp.status}`);
  const data = await resp.json() as { checkoutUrl: string };
  return data.checkoutUrl;
}

export async function openBillingPortal(): Promise<string> {
  loadFromDisk();
  if (!memCache?.token) throw new Error('Not authenticated');
  const resp = await apiFetch('/api/billing-portal', {
    method: 'POST',
    token: memCache.token,
  });
  if (!resp.ok) throw new Error(`Billing portal failed: ${resp.status}`);
  const data = await resp.json() as { portalUrl: string };
  return data.portalUrl;
}

export async function logout(): Promise<AuthSession> {
  loadFromDisk();
  const token = memCache?.token ?? null;
  if (token) {
    try {
      await apiFetch('/api/desktop-logout', { method: 'POST', token });
    } catch {
      // Best-effort; clear local state regardless so user can sign out offline.
    }
  }
  memCache = null;
  authClear();
  metaSet(LAST_VALIDATED_META_KEY, null);
  return { isAuthenticated: false, userInfo: null };
}

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
