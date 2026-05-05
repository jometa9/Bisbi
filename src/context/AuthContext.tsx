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
  startWebLogin: () => void;
  cancelLogin: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// The landing page redirects via bisbi://login?token=XYZ. We accept both
// `token` and `apiKey` to stay compatible with the IPTRADE-style flow until
// the bisbi.io endpoint is finalized.
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

  // Live subscriptions: backend session changes (e.g. logout from another
  // window) and deep links delivered while the app is already running.
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

  // MOCK MODE — flip this to false (or remove the block) once bisbi.io is
  // wired up. While true, clicking "Sign in" skips the browser round-trip
  // and validates a hardcoded token so the rest of the app is usable.
  const USE_MOCK_LOGIN = true;

  const startWebLogin = useCallback(() => {
    if (!window.bisbi) return;
    setError(null);

    if (USE_MOCK_LOGIN) {
      void handleToken('mock-dev-token');
      return;
    }

    setLoginStatus('authenticating');
    void window.bisbi.openExternal(urls.signIn);
    // After a short delay we transition to "redirecting" so the user sees we
    // are still waiting for the browser. If the deep link arrives first the
    // listener clears the timer.
    if (redirectingTimerRef.current) clearTimeout(redirectingTimerRef.current);
    redirectingTimerRef.current = setTimeout(() => {
      setLoginStatus((cur) => (cur === 'authenticating' ? 'redirecting' : cur));
    }, 3000);
  }, [handleToken]);

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
    const next = await window.bisbi.auth.logout();
    setSession(next);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: session.isAuthenticated,
      userInfo: session.userInfo,
      loginStatus,
      error,
      startWebLogin,
      cancelLogin,
      logout,
      clearError,
    }),
    [
      isLoading,
      session.isAuthenticated,
      session.userInfo,
      loginStatus,
      error,
      startWebLogin,
      cancelLogin,
      logout,
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
