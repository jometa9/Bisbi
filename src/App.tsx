import { useEffect, useRef, useState } from 'react';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { Account } from './pages/Account';
import { Login } from './pages/Login';
import { startRecording, type RecordingHandle } from './audio';
import type { AppSettings, RecordingState } from './types';
import { useTranslation } from './i18n';
import { useAuth } from './context/AuthContext';

type Tab = 'home' | 'settings' | 'history' | 'account';

export function App() {
  const { t } = useTranslation();
  const { isLoading: isAuthLoading, isAuthenticated, userInfo } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  // Read inside the recording-start handler without resubscribing on every
  // settings change.
  const settingsRef = useRef<AppSettings | null>(null);
  const [recState, setRecState] = useState<RecordingState>('idle');
  const [appVersion, setAppVersion] = useState('');
  const [resourcesOk, setResourcesOk] = useState<boolean | null>(null);

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
    return () => {
      offSettings();
      offState();
      offNav();
    };
  }, []);

  // The hotkey lives in the main process. When it fires, main asks the
  // renderer to start/stop the mic capture via these IPC events. We
  // serialize start/stop through a promise chain so a fast re-tap can't
  // open a new mic handle before the previous one finishes flushing.
  useEffect(() => {
    if (!window.bisbi) return;
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

    return () => {
      offStart();
      offStop();
      handle?.cancel();
    };
  }, [t]);

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
    return <Login />;
  }

  const accountInitial = (
    userInfo?.name || userInfo?.email || '?'
  ).trim().charAt(0).toUpperCase();

  return (
    <div className="app">
      <aside className="sidebar">
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
          <StatusBadge state={recState} />
          <span className="sidebar-version">v{appVersion}</span>
        </div>
      </aside>

      <main className="content">
        {resourcesOk === false && (
          <div className="banner banner-error">
            {renderWithTokens(
              t('app.resourcesMissing', { path: '__PATH__' }),
              { __PATH__: <code key="path">resources/whisper</code> }
            )}
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
          {tab === 'history' && (
            <History
              saveHistoryEnabled={settings.saveHistory}
              onOpenSettings={() => setTab('settings')}
            />
          )}
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

// Splits a translated string by tokens like __CMD__ and replaces them with
// React nodes. Lets translators move placeholders around freely while the
// markup is owned by the component.
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
