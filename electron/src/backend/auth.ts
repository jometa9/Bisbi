import { safeStorage } from 'electron';
import {
  authGet,
  authSet,
  authClear,
  setMonthlyWordLimit,
  setMonthlyWordUsageFromServer,
} from './db';
import { WEB_BASE } from '../buildConfig';

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

let memCache: { token: string; userInfo: UserInfo | null } | null = null;

function encryptString(value: string): Buffer {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(value);
  }
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

export function getAuthToken(): string | null {
  loadFromDisk();
  return memCache?.token ?? null;
}

async function validateTokenWithApi(token: string): Promise<UserInfo> {
  const resp = await fetch(`${WEB_BASE}/api/license`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
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
  if (!memCache?.token) return { isAuthenticated: false, userInfo: null };
  try {
    const userInfo = await validateTokenWithApi(memCache.token);
    persist(memCache.token, userInfo);
    return { isAuthenticated: true, userInfo };
  } catch {
    return { isAuthenticated: true, userInfo: memCache.userInfo };
  }
}

export async function startCheckout(billingPeriod: 'monthly' | 'annual'): Promise<string> {
  loadFromDisk();
  if (!memCache?.token) throw new Error('Not authenticated');
  const resp = await fetch(`${WEB_BASE}/api/checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${memCache.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ billingPeriod }),
  });
  if (!resp.ok) throw new Error(`Checkout failed: ${resp.status}`);
  const data = await resp.json() as { checkoutUrl: string };
  return data.checkoutUrl;
}

export async function openBillingPortal(): Promise<string> {
  loadFromDisk();
  if (!memCache?.token) throw new Error('Not authenticated');
  const resp = await fetch(`${WEB_BASE}/api/billing-portal`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${memCache.token}` },
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
      await fetch(`${WEB_BASE}/api/desktop-logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Best-effort; clear local state regardless so user can sign out offline.
    }
  }
  memCache = null;
  authClear();
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
