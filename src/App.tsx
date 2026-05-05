import { useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { startRecording, type RecordingHandle } from './audio';
import type { AppSettings, RecordingState } from './types';

type Tab = 'home' | 'settings' | 'history';

export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [recState, setRecState] = useState<RecordingState>('idle');
  const [appVersion, setAppVersion] = useState('');
  const [resourcesOk, setResourcesOk] = useState<boolean | null>(null);

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
      else if (to === '/home' || to === '/') setTab('home');
    });
    return () => {
      offSettings();
      offState();
      offNav();
    };
  }, []);

  // The hotkey lives in the main process. When it fires, main asks the
  // renderer to start/stop the mic capture via these IPC events.
  useEffect(() => {
    if (!window.bisbi) return;
    let handle: RecordingHandle | null = null;

    const offStart = window.bisbi.onRecordingStart(async () => {
      try {
        handle = await startRecording();
      } catch (err) {
        console.error('[App] mic access failed:', err);
        await window.bisbi.cancelRecording();
        alert(
          'No se pudo acceder al micrófono. Asegurate de que Bisbi tenga permiso en los ajustes del sistema.'
        );
      }
    });

    const offStop = window.bisbi.onRecordingStop(async () => {
      if (!handle) {
        await window.bisbi.cancelRecording();
        return;
      }
      try {
        const { pcm, sampleRate, channels } = await handle.stop();
        handle = null;
        await window.bisbi.submitAudio(pcm, sampleRate, channels);
      } catch (err) {
        console.error('[App] transcription failed:', err);
        await window.bisbi.cancelRecording();
      }
    });

    return () => {
      offStart();
      offStop();
      handle?.cancel();
    };
  }, []);

  if (!window.bisbi) {
    return (
      <div className="not-electron">
        <h1>Bisbi</h1>
        <p>
          Esta ventana tiene que abrirse desde Electron para que funcionen el
          hotkey global, el micrófono y la transcripción.
        </p>
        <p>
          Si estás en desarrollo, corré <code>npm run dev</code> en la raíz del
          repo y dejá que Electron abra su propia ventana. No abras{' '}
          <code>http://localhost:7775</code> directamente en el browser.
        </p>
      </div>
    );
  }

  if (!settings) {
    return <div className="loading">Cargando…</div>;
  }

  return (
    <div className="app">
      <header className="titlebar">
        <div className="brand">Bisbi</div>
        <nav className="tabs">
          <button
            className={tab === 'home' ? 'active' : ''}
            onClick={() => setTab('home')}
          >
            Inicio
          </button>
          <button
            className={tab === 'history' ? 'active' : ''}
            onClick={() => setTab('history')}
          >
            Historial
          </button>
          <button
            className={tab === 'settings' ? 'active' : ''}
            onClick={() => setTab('settings')}
          >
            Ajustes
          </button>
        </nav>
        <div className="status">
          <StatusBadge state={recState} />
        </div>
      </header>

      {resourcesOk === false && (
        <div className="banner banner-error">
          Faltan los recursos de Whisper. Mirá el README para descargar el
          binario y el modelo en <code>resources/whisper</code>.
        </div>
      )}

      <main className="content">
        <div className="content-inner">
          {tab === 'home' && <Home settings={settings} recState={recState} />}
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
            />
          )}
          {tab === 'history' && <History />}
        </div>
      </main>

      <footer className="footer">
        <span>v{appVersion}</span>
      </footer>
    </div>
  );
}

function StatusBadge({ state }: { state: RecordingState }) {
  const text =
    state === 'recording' ? 'Grabando' : state === 'transcribing' ? 'Transcribiendo' : 'Listo';
  return <span className={`badge badge-${state}`}>{text}</span>;
}
