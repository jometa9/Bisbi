import { useEffect, useMemo, useState } from 'react';
import type { AppSettings, RecordingState, TranscriptionRow } from '../types';
import { useTranslation, type UiLanguage } from '../i18n';

interface Props {
  settings: AppSettings;
  recState: RecordingState;
}

export function Home({ settings, recState }: Props) {
  const { t, language } = useTranslation();
  const [rows, setRows] = useState<TranscriptionRow[]>([]);

  useEffect(() => {
    void window.bisbi.listHistory(50).then(setRows);
    const off = window.bisbi.onHistoryChange(() => {
      void window.bisbi.listHistory(50).then(setRows);
    });
    return off;
  }, []);

  const greeting = useMemo(() => t(timeGreetingKey()), [t]);
  const last = rows[0];
  const today = useMemo(() => countToday(rows), [rows]);

  const statusText = t(`home.statusTitle.${recState}` as const);
  const transcriptionsLabel =
    today.count === 1
      ? t('home.transcriptionsOne')
      : t('home.transcriptionsOther');

  return (
    <div className="home">
      <div className="home-hero">
        <span className="home-greeting">{greeting}</span>
        <h1 className="home-title">
          {statusText}.
          <br />
          <em>{t('home.titleHint')}</em>
        </h1>
      </div>

      <div className="home-hotkey">
        <span className="home-hotkey-label">{t('home.hotkeyLabel')}</span>
        <div className="home-hotkey-keys">{renderHotkey(settings.hotkey)}</div>
        <span className="home-hotkey-hint">
          {settings.pasteMode === 'paste'
            ? t('home.hotkeyHintPaste')
            : t('home.hotkeyHintClipboard')}
        </span>
      </div>

      <section className="home-section">
        <h2 className="home-section-title">{t('home.todaySection')}</h2>
        <div className="home-stats">
          <Stat value={today.count} label={transcriptionsLabel} />
          <Stat value={formatSeconds(today.seconds)} label={t('home.dictated')} />
          <Stat
            value={formatLanguage(last?.language, t) ?? '—'}
            label={t('home.lastLanguage')}
          />
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-section-title">{t('home.lastTranscriptionSection')}</h2>
        {last ? (
          <article className="home-recent">
            <div className="home-recent-meta">
              <time>{relativeTime(last.createdAt, language, t)}</time>
              {last.durationMs != null && (
                <> · {(last.durationMs / 1000).toFixed(1)}s</>
              )}
            </div>
            <p className="home-recent-text">{last.text}</p>
          </article>
        ) : (
          <p className="home-empty">{t('home.empty')}</p>
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

function timeGreetingKey():
  | 'home.greeting.lateNight'
  | 'home.greeting.morning'
  | 'home.greeting.afternoon'
  | 'home.greeting.evening' {
  const h = new Date().getHours();
  if (h < 6) return 'home.greeting.lateNight';
  if (h < 13) return 'home.greeting.morning';
  if (h < 20) return 'home.greeting.afternoon';
  return 'home.greeting.evening';
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

type TFn = ReturnType<typeof useTranslation>['t'];

function formatLanguage(code: string | null | undefined, t: TFn): string | null {
  if (!code) return null;
  const key = `languages.${code}` as const;
  // Falls back to the uppercase code when the language is not in the catalog.
  const translated = t(key as Parameters<TFn>[0]);
  if (translated === key) return code.toUpperCase();
  return translated;
}

function relativeTime(ts: number, lang: UiLanguage, t: TFn): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('home.relative.justNow');
  if (mins < 60) return t('home.relative.minutes', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('home.relative.hours', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('home.relative.days', { n: days });
  return new Date(ts).toLocaleDateString(localeForLang(lang));
}

function localeForLang(lang: UiLanguage): string {
  switch (lang) {
    case 'en': return 'en-US';
    case 'es': return 'es-ES';
    case 'zh': return 'zh-CN';
    case 'hi': return 'hi-IN';
    case 'ar': return 'ar';
  }
}
