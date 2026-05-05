import { useEffect, useMemo, useState } from 'react';
import type { AppSettings, RecordingState, TranscriptionRow } from '../types';

interface Props {
  settings: AppSettings;
  recState: RecordingState;
}

export function Home({ settings, recState }: Props) {
  const [rows, setRows] = useState<TranscriptionRow[]>([]);

  useEffect(() => {
    void window.bisbi.listHistory(50).then(setRows);
    const off = window.bisbi.onHistoryChange(() => {
      void window.bisbi.listHistory(50).then(setRows);
    });
    return off;
  }, []);

  const greeting = useMemo(() => timeGreeting(), []);
  const last = rows[0];
  const today = useMemo(() => countToday(rows), [rows]);

  const statusText =
    recState === 'recording'
      ? 'Grabando ahora'
      : recState === 'transcribing'
        ? 'Transcribiendo'
        : 'Listo para escuchar';

  return (
    <div className="home">
      <div className="home-hero">
        <span className="home-greeting">{greeting}</span>
        <h1 className="home-title">
          {statusText}.
          <br />
          <em>Apretá el atajo y hablá.</em>
        </h1>
      </div>

      <div className="home-hotkey">
        <span className="home-hotkey-label">Atajo</span>
        <div className="home-hotkey-keys">{renderHotkey(settings.hotkey)}</div>
        <span className="home-hotkey-hint">
          {settings.pasteMode === 'paste'
            ? 'El texto se pega automáticamente donde estés escribiendo.'
            : 'El texto se copia al portapapeles.'}
        </span>
      </div>

      <section className="home-section">
        <h2 className="home-section-title">Hoy</h2>
        <div className="home-stats">
          <Stat value={today.count} label={today.count === 1 ? 'transcripción' : 'transcripciones'} />
          <Stat value={formatSeconds(today.seconds)} label="dictado" />
          <Stat value={formatLanguage(last?.language) ?? '—'} label="último idioma" />
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-section-title">Última transcripción</h2>
        {last ? (
          <article className="home-recent">
            <div className="home-recent-meta">
              <time>{relativeTime(last.createdAt)}</time>
              {last.durationMs != null && (
                <> · {(last.durationMs / 1000).toFixed(1)}s</>
              )}
            </div>
            <p className="home-recent-text">{last.text}</p>
          </article>
        ) : (
          <p className="home-empty">Todavía no hay transcripciones. Probá tu atajo.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="home-stat">
      <span className="home-stat-value">{value}</span>
      <span className="home-stat-label">{label}</span>
    </div>
  );
}

function renderHotkey(accel: string) {
  const parts = accel.split('+').filter(Boolean);
  return parts.flatMap((part, i) => {
    const node = (
      <kbd key={`k-${i}`} className="kbd">
        {prettyKey(part)}
      </kbd>
    );
    if (i === parts.length - 1) return [node];
    return [
      node,
      <span key={`p-${i}`} className="kbd-plus">
        +
      </span>,
    ];
  });
}

function prettyKey(part: string): string {
  switch (part) {
    case 'Cmd':
    case 'CommandOrControl':
      return '⌘';
    case 'Ctrl':
      return '⌃';
    case 'Alt':
    case 'Option':
      return '⌥';
    case 'Shift':
      return '⇧';
    case 'Space':
      return 'Space';
    default:
      return part;
  }
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 13) return 'Buen día';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function countToday(rows: TranscriptionRow[]): { count: number; seconds: number } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  let count = 0;
  let seconds = 0;
  for (const r of rows) {
    if (r.createdAt >= startMs) {
      count++;
      if (r.durationMs) seconds += r.durationMs / 1000;
    }
  }
  return { count, seconds: Math.round(seconds) };
}

function formatSeconds(s: number): string {
  if (s <= 0) return '0s';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
}

function formatLanguage(code: string | null | undefined): string | null {
  if (!code) return null;
  const map: Record<string, string> = {
    es: 'Español',
    en: 'Inglés',
    pt: 'Portugués',
    fr: 'Francés',
    it: 'Italiano',
    de: 'Alemán',
  };
  return map[code] ?? code.toUpperCase();
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(ts).toLocaleDateString();
}
