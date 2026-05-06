import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthSession, UserInfo } from '../types';
import { urls } from '../lib/urls';

type LoginStatus = 'idle' | 'authenticating' | 'redirecting' | 'validating';

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  loginStatus: LoginStatus;
  error: string | null;
  isRefreshing: boolean;
  startWebLogin: () => void;
  cancelLogin: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function extractTokenFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'bisbi:') return null;
    const tok =
      u.searchParams.get('token') ??
      u.searchParams.get('apiKey') ??
      u.searchParams.get('api_key');
    return tok && tok.trim() ? tok.trim() : null;
  } catch {
    return null;
  }
}

interface ProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: ProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<AuthSession>({
    isAuthenticated: false,
    userInfo: null,
  });
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const redirectingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToken = useCallback(async (token: string) => {
    if (!window.bisbi) return;
    setLoginStatus('validating');
    setError(null);
    try {
      const next = await window.bisbi.auth.loginWithToken(token);
      setSession(next);
      setLoginStatus('idle');
    } catch (err) {
      setLoginStatus('idle');
      setError((err as Error).message || 'invalidToken');
    }
  }, []);

  // Initial bootstrap: read the persisted session and any deep link the OS
  // delivered before the renderer was ready.
  useEffect(() => {
    if (!window.bisbi) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    void window.bisbi.auth.getSession().then(async (s) => {
      if (cancelled) return;
      setSession(s);
      const pending = await window.bisbi.deepLink.getPending();
      if (cancelled) return;
      if (pending) {
        const token = extractTokenFromUrl(pending);
        await window.bisbi.deepLink.clearPending(pending);
        if (token) await handleToken(token);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [handleToken]);

  // Live subscriptions: backend session changes and deep links while running.
  useEffect(() => {
    if (!window.bisbi) return;
    const offChange = window.bisbi.auth.onChange((s) => setSession(s));
    const offLink = window.bisbi.deepLink.onLink(({ url }) => {
      const token = extractTokenFromUrl(url);
      void window.bisbi.deepLink.clearPending(url);
      if (token) {
        if (redirectingTimerRef.current) {
          clearTimeout(redirectingTimerRef.current);
          redirectingTimerRef.current = null;
        }
        void handleToken(token);
      }
    });
    return () => {
      offChange();
      offLink();
    };
  }, [handleToken]);

  // Auto-refresh on window focus so the plan updates after the user manages
  // their subscription in the browser and comes back to the app.
  useEffect(() => {
    const onFocus = () => {
      if (!window.bisbi || !session.isAuthenticated) return;
      void window.bisbi.auth.refresh().then((next) => setSession(next));
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [session.isAuthenticated]);

  const startWebLogin = useCallback(() => {
    if (!window.bisbi) return;
    setError(null);
    setLoginStatus('authenticating');
    void window.bisbi.openExternal(urls.signIn);
    if (redirectingTimerRef.current) clearTimeout(redirectingTimerRef.current);
    redirectingTimerRef.current = setTimeout(() => {
      setLoginStatus((cur) => (cur === 'authenticating' ? 'redirecting' : cur));
    }, 3000);
  }, []);

  const cancelLogin = useCallback(() => {
    if (redirectingTimerRef.current) {
      clearTimeout(redirectingTimerRef.current);
      redirectingTimerRef.current = null;
    }
    setLoginStatus('idle');
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    if (!window.bisbi) return;
    await window.bisbi.clearHistory();
    await window.bisbi.resetSettings();
    const next = await window.bisbi.auth.logout();
    setSession(next);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!window.bisbi) return;
    setIsRefreshing(true);
    try {
      const next = await window.bisbi.auth.refresh();
      setSession(next);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: session.isAuthenticated,
      userInfo: session.userInfo,
      loginStatus,
      error,
      isRefreshing,
      startWebLogin,
      cancelLogin,
      logout,
      refreshSession,
      clearError,
    }),
    [
      isLoading,
      session.isAuthenticated,
      session.userInfo,
      loginStatus,
      error,
      isRefreshing,
      startWebLogin,
      cancelLogin,
      logout,
      refreshSession,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
