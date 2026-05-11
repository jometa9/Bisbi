import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { Account } from './pages/Account';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { startRecording, type RecordingHandle } from './audio';
import { UpdateBanner } from './components/UpdateBanner';
import type { AppSettings, RecordingState } from './types';
import { useTranslation } from './i18n';
import { useAuth } from './context/AuthContext';
import owlIdleSvg from '../build-resources/owl_head.svg';
import owlRecSvg from '../build-resources/owl_head_rec.svg';

type Tab = 'home' | 'settings' | 'history' | 'account';

export function App() {
  const { t } = useTranslation();
  const { isLoading: isAuthLoading, isAuthenticated, userInfo } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const settingsRef = useRef<AppSettings | null>(null);
  const [recState, setRecState] = useState<RecordingState>('idle');
  const [appVersion, setAppVersion] = useState('');
  const [resourcesOk, setResourcesOk] = useState<boolean | null>(null);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [tourActive, setTourActive] = useState(true);
  const [tourMicNeeded, setTourMicNeeded] = useState(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!window.bisbi) return;
    void window.bisbi.getSettings().then(setSettings);
    void window.bisbi.getAppVersion().then(setAppVersion);
    void window.bisbi.getRecordingState().then(setRecState);
    void window.bisbi.checkResources().then((c) => setResourcesOk(c.ok));

    const offSettings = window.bisbi.onSettingsChange(setSettings);
    const offState = window.bisbi.onRecordingState(setRecState);
    const offNav = window.bisbi.onNavigate(({ to }) => {
      if (to === '/history') setTab('history');
      else if (to === '/settings') setTab('settings');
      else if (to === '/account') setTab('account');
      else if (to === '/home' || to === '/') setTab('home');
    });
    const offLimit = window.bisbi.usage.onLimitReached(() => {
      setShowLimitBanner(true);
    });
    return () => {
      offSettings();
      offState();
      offNav();
      offLimit();
    };
  }, []);

  useEffect(() => {
    if (userInfo?.plan === 'pro') setShowLimitBanner(false);
  }, [userInfo?.plan]);

  useEffect(() => {
    if (isAuthenticated) {
      setTab('home');
      setTourActive(false);
      setTourMicNeeded(false);
    } else {
      setTourActive(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!window.bisbi) return;
    const armed = isAuthenticated || tourMicNeeded;
    void window.bisbi.setRecordingArmed(armed);
  }, [isAuthenticated, tourMicNeeded]);

  useEffect(() => {
    if (!window.bisbi) return;
    if (!settings) return;
    const accel = settings.hotkey;
    const downHandler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (matchesAccelerator(e, accel)) {
        window.bisbi.notifyExternalKeydown();
      }
    };
    const upHandler = (e: KeyboardEvent) => {
      if (matchesAccelerator(e, accel)) {
        window.bisbi.notifyExternalKeyup();
      }
    };
    window.addEventListener('keydown', downHandler, true);
    window.addEventListener('keyup', upHandler, true);
    return () => {
      window.removeEventListener('keydown', downHandler, true);
      window.removeEventListener('keyup', upHandler, true);
    };
  }, [settings?.hotkey]);

  useEffect(() => {
    if (!window.bisbi) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return;
      if (recState === 'idle') return;
      void window.bisbi.cancelAll();
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [recState]);

  useEffect(() => {
    if (!window.bisbi) return;
    if (!isAuthenticated) return;
    let handle: RecordingHandle | null = null;
    let chain: Promise<void> = Promise.resolve();

    const offStart = window.bisbi.onRecordingStart(() => {
      chain = chain.then(async () => {
        try {
          handle = await startRecording({
            onLevel: (level) => window.bisbi.sendRecordingLevel(level),
            deviceId: settingsRef.current?.microphoneId ?? null,
          });
        } catch (err) {
          console.error('[App] mic access failed:', err);
          await window.bisbi.cancelRecording();
          alert(t('app.micError'));
        }
      });
    });

    const offStop = window.bisbi.onRecordingStop(() => {
      chain = chain.then(async () => {
        const cur = handle;
        handle = null;
        if (!cur) {
          await window.bisbi.cancelRecording();
          return;
        }
        try {
          const { pcm, sampleRate, channels } = await cur.stop();
          await window.bisbi.submitAudio(pcm, sampleRate, channels);
        } catch (err) {
          console.error('[App] mic stop failed:', err);
          await window.bisbi.cancelRecording();
        }
      });
    });

    const offCancel = window.bisbi.onRecordingCancel(() => {
      chain = chain.then(async () => {
        const cur = handle;
        handle = null;
        cur?.cancel();
      });
    });

    return () => {
      offStart();
      offStop();
      offCancel();
      handle?.cancel();
    };
  }, [t, isAuthenticated]);

  if (!window.bisbi) {
    return (
      <div className="not-electron">
        <h1>Bisbi</h1>
        <p>{t('app.notElectron.body')}</p>
        <p>
          {renderWithTokens(
            t('app.notElectron.devHint', {
              cmd: '__CMD__',
              url: '__URL__',
            }),
            {
              __CMD__: <code key="cmd">npm run dev</code>,
              __URL__: <code key="url">{window.location.origin}</code>,
            }
          )}
        </p>
      </div>
    );
  }

  if (isAuthLoading || !settings) {
    return <div className="loading">{t('app.loading')}</div>;
  }

  if (!isAuthenticated) {
    if (tourActive) {
      return (
        <Onboarding
          settings={settings}
          onSettingsChange={setSettings}
          onExit={() => setTourActive(false)}
          onMicNeeded={setTourMicNeeded}
        />
      );
    }
    return <Login onStartTour={() => setTourActive(true)} />;
  }

  const accountInitial = (
    userInfo?.name || userInfo?.email || '?'
  ).trim().charAt(0).toUpperCase();

  return (
    <div className="app">
      <aside
        className={`sidebar${recState === 'recording' ? ' is-recording' : ''}`}
        style={{
          '--owl-idle': `url(${owlIdleSvg})`,
          '--owl-rec': `url(${owlRecSvg})`,
        } as CSSProperties}
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">{t('app.brand')}</div>
        </div>
        <nav className="sidebar-nav">
          <button
            className={tab === 'home' ? 'active' : ''}
            onClick={() => setTab('home')}
          >
            <HomeIcon />
            {t('app.tabs.home')}
          </button>
          <button
            className={tab === 'history' ? 'active' : ''}
            onClick={() => setTab('history')}
          >
            <HistoryIcon />
            {t('app.tabs.history')}
          </button>
          <button
            className={tab === 'settings' ? 'active' : ''}
            onClick={() => setTab('settings')}
          >
            <SettingsIcon />
            {t('app.tabs.settings')}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <UpdateBanner />
          <button
            className={`sidebar-account${tab === 'account' ? ' active' : ''}`}
            onClick={() => setTab('account')}
          >
            <span className="sidebar-account-avatar" aria-hidden="true">
              {userInfo?.avatarUrl ? (
                <img src={userInfo.avatarUrl} alt="" />
              ) : (
                accountInitial
              )}
            </span>
            <span className="sidebar-account-text">
              <span className="sidebar-account-name">
                {userInfo?.name || userInfo?.email || t('app.tabs.account')}
              </span>
              <span className={`sidebar-account-plan plan-${userInfo?.plan ?? 'free'}`}>
                {userInfo?.plan === 'pro'
                  ? t('account.planPro')
                  : t('account.planFree')}
              </span>
            </span>
          </button>
          <div className="sidebar-status-row">
            <StatusBadge state={recState} />
            {appVersion && <span className="sidebar-version">v{appVersion}</span>}
          </div>
        </div>
      </aside>

      <main className="content">
        {showLimitBanner && userInfo?.plan !== 'pro' && (
          <div className="banner banner-upgrade">
            <span>{t('app.limitReached')}</span>
            <button
              type="button"
              className="banner-upgrade-cta"
              onClick={() => {
                setShowLimitBanner(false);
                setTab('account');
              }}
            >
              {t('account.upgradeToPro')}
            </button>
          </div>
        )}
        {resourcesOk === false && (
          <div className="banner banner-error">
            {t('app.resourcesMissing')}
          </div>
        )}
        <div className="content-inner">
          {tab === 'home' && (
            <Home
              settings={settings}
              recState={recState}
              onNavigateToHistory={() => setTab('history')}
            />
          )}
          {tab === 'settings' && (
            <Settings
              settings={settings}
              onChange={async (patch) => {
                try {
                  const next = await window.bisbi.updateSettings(patch);
                  setSettings(next);
                } catch (err) {
                  alert((err as Error).message);
                }
              }}
              onReset={async () => {
                const next = await window.bisbi.resetSettings();
                setSettings(next);
              }}
              onClearHistory={async () => {
                await window.bisbi.clearHistory();
              }}
            />
          )}
          {tab === 'history' && <History />}
          {tab === 'account' && <Account />}
        </div>
      </main>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg
      className="nav-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      className="nav-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="nav-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

function StatusBadge({ state }: { state: RecordingState }) {
  const { t } = useTranslation();
  const text = t(`app.status.${state}` as const);
  return <span className={`badge badge-${state}`}>{text}</span>;
}

function renderWithTokens(
  template: string,
  replacements: Record<string, React.ReactNode>
): React.ReactNode[] {
  const tokens = Object.keys(replacements);
  if (tokens.length === 0) return [template];
  const re = new RegExp(`(${tokens.join('|')})`, 'g');
  return template.split(re).map((part, i) =>
    tokens.includes(part) ? (
      <span key={i}>{replacements[part]}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const ACCEL_TO_DOM_CODE: Record<string, string> = {
  CtrlRight: 'ControlRight',
  CtrlLeft: 'ControlLeft',
  AltRight: 'AltRight',
  AltLeft: 'AltLeft',
  ShiftRight: 'ShiftRight',
  ShiftLeft: 'ShiftLeft',
  MetaRight: 'MetaRight',
  MetaLeft: 'MetaLeft',
};

function matchesAccelerator(e: KeyboardEvent, accel: string): boolean {
  const parts = accel.split('+').map((p) => p.trim()).filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return false;
  const expected = ACCEL_TO_DOM_CODE[last] ?? last;
  return e.code === expected;
}
