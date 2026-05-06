import { useEffect, useMemo, useState } from 'react';
import type { AppSettings, RecordingState, StatsTotals, TranscriptionRow } from '../types';
import { useTranslation, type UiLanguage } from '../i18n';
import { TranscriptionList } from '../components/TranscriptionList';
import { HotkeyKeys, type HotkeyVisualState } from '../components/HotkeyKeys';
import type { KeyPlatform } from '../lib/hotkey';

interface Props {
  settings: AppSettings;
  recState: RecordingState;
  onNavigateToHistory?: () => void;
}

type KeyStyle = KeyPlatform;

const HOME_RECENT_LIMIT = 3;
const EMPTY_TOTALS: StatsTotals = {
  totalTranscriptions: 0,
  totalAudioMs: 0,
  totalWords: 0,
};

export function Home({ settings, recState, onNavigateToHistory }: Props) {
  const { t, language } = useTranslation();
  const [rows, setRows] = useState<TranscriptionRow[]>([]);
  const [totals, setTotals] = useState<StatsTotals>(EMPTY_TOTALS);
  const [keyStyle, setKeyStyle] = useState<KeyStyle>(() =>
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? 'mac' : 'win'
  );

  useEffect(() => {
    void window.bisbi.listHistory(50).then(setRows);
    void window.bisbi.getStatsTotals().then(setTotals);
    const offHistory = window.bisbi.onHistoryChange(() => {
      void window.bisbi.listHistory(50).then(setRows);
    });
    const offTotals = window.bisbi.onStatsTotalsChange(setTotals);
    void window.bisbi.getPlatform().then((p) => {
      setKeyStyle(p === 'darwin' ? 'mac' : 'win');
    });
    return () => {
      offHistory();
      offTotals();
    };
  }, []);

  const greeting = useMemo(() => t(timeGreetingKey()), [t]);
  const recent = useMemo(() => rows.slice(0, HOME_RECENT_LIMIT), [rows]);
  const hasMore = rows.length > HOME_RECENT_LIMIT;

  const wpm = useMemo(() => {
    if (totals.totalAudioMs <= 0) return 0;
    return Math.round(totals.totalWords / (totals.totalAudioMs / 60000));
  }, [totals.totalAudioMs, totals.totalWords]);

  const statusText = t(`home.statusTitle.${recState}` as const);
  const transcriptionsLabel =
    totals.totalTranscriptions === 1
      ? t('home.transcriptionsOne')
      : t('home.transcriptionsOther');
  const wordsLabel =
    totals.totalWords === 1 ? t('home.wordsOne') : t('home.wordsOther');

  return (
    <div className={`home${settings.saveHistory ? '' : ' home--centered'}`}>
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
        <div className="home-hotkey-keys">
          <HotkeyKeys
            accel={settings.hotkey}
            platform={keyStyle}
            visual={hotkeyVisualState(recState, settings.handsFreeMode)}
          />
        </div>
        <span className="home-hotkey-hint">
          {settings.pasteMode === 'paste'
            ? t('home.hotkeyHintPaste')
            : t('home.hotkeyHintClipboard')}
        </span>
      </div>

      {settings.saveHistory && (
        <>
          <section className="home-section">
            <h2 className="home-section-title">{t('home.activitySection')}</h2>
            <div className="home-stats">
              <Stat
                value={formatNumber(totals.totalTranscriptions, language)}
                label={transcriptionsLabel}
              />
              <Stat
                value={formatDuration(Math.round(totals.totalAudioMs / 1000))}
                label={t('home.dictated')}
              />
              <Stat value={formatNumber(totals.totalWords, language)} label={wordsLabel} />
              <Stat value={formatNumber(wpm, language)} label={t('home.wpmLabel')} />
            </div>
          </section>

          <section className="home-section">
            <h2 className="home-section-title">{t('home.recentSection')}</h2>
            <TranscriptionList rows={recent} emptyLabel={t('home.empty')} />
            {hasMore && (
              <button
                type="button"
                className="home-see-more"
                onClick={() => onNavigateToHistory?.()}
              >
                {t('home.seeMore')}
              </button>
            )}
          </section>
        </>
      )}
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

function hotkeyVisualState(rec: RecordingState, handsFree: boolean): HotkeyVisualState {
  if (rec !== 'recording') return 'idle';
  return handsFree ? 'lit' : 'pressed';
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

function formatDuration(s: number): string {
  if (s <= 0) return '0s';
  if (s < 60) return `${s}s`;
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
  }
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatNumber(n: number, lang: UiLanguage): string {
  return new Intl.NumberFormat(localeForLang(lang)).format(n);
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
