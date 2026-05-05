import { Fragment, useMemo, useState, type ReactNode } from 'react';
import type { TranscriptionRow } from '../types';
import { useTranslation, type UiLanguage } from '../i18n';

interface Props {
  rows: TranscriptionRow[];
  emptyLabel?: string;
}

export function TranscriptionList({ rows, emptyLabel }: Props) {
  const { t, language } = useTranslation();

  if (rows.length === 0) {
    return <p className="tx-empty">{emptyLabel ?? t('history.empty')}</p>;
  }

  const groups = groupByDay(rows, language, t);

  return (
    <div className="tx-list">
      {groups.map((g) => (
        <section key={g.key} className="tx-group">
          <h3 className="tx-group-title">{g.label}</h3>
          <ul className="tx-items">
            {g.rows.map((row) => (
              <TranscriptionItem key={row.id} row={row} language={language} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TranscriptionItem({ row, language }: { row: TranscriptionRow; language: UiLanguage }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const formatted = useMemo(() => formatTranscript(row.text), [row.text]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(row.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard access can fail when the window isn't focused; ignore.
    }
  };

  const handleDelete = () => {
    void window.bisbi.deleteHistory(row.id);
  };

  return (
    <li className="tx-item">
      <span className="tx-time">{formatTime(row.createdAt, language)}</span>
      <div className="tx-body">
        <p className="tx-text">{formatted}</p>
        <div className="tx-actions">
          <button
            type="button"
            className="tx-icon-btn tx-icon-copy"
            onClick={handleCopy}
            aria-label={copied ? t('history.copied') : t('history.copy')}
            title={copied ? t('history.copied') : t('history.copy')}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          <button
            type="button"
            className="tx-icon-btn tx-icon-delete"
            onClick={handleDelete}
            aria-label={t('history.delete')}
            title={t('history.delete')}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </li>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

interface DayGroup {
  key: string;
  label: string;
  rows: TranscriptionRow[];
}

type TFn = ReturnType<typeof useTranslation>['t'];

function groupByDay(rows: TranscriptionRow[], lang: UiLanguage, t: TFn): DayGroup[] {
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const groups: DayGroup[] = [];
  const index = new Map<number, DayGroup>();

  for (const row of rows) {
    const day = startOfDay(new Date(row.createdAt)).getTime();
    let group = index.get(day);
    if (!group) {
      let label: string;
      if (day === today.getTime()) label = t('dateGroups.today');
      else if (day === yesterday.getTime()) label = t('dateGroups.yesterday');
      else label = formatDateGroup(row.createdAt, lang);
      group = { key: String(day), label, rows: [] };
      index.set(day, group);
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatTime(ts: number, lang: UiLanguage): string {
  return new Intl.DateTimeFormat(localeForLang(lang), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(ts));
}

function formatDateGroup(ts: number, lang: UiLanguage): string {
  return new Intl.DateTimeFormat(localeForLang(lang), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts));
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

// Whisper.cpp returns plain text, but it does emit two cues we can lean on:
//   - non-speech annotations like [Music], [Applause], (laughter)
//   - emphasized phrases that come back fully capitalized
// Render the first as muted italics and the second as bold, leave the rest as-is.
const TRANSCRIPT_TOKEN_RE = /\[[^\]\n]+\]|\([^)\n]+\)|\b[\p{Lu}\p{N}][\p{Lu}\p{N}'’\-]{2,}\b/gu;

function formatTranscript(text: string): ReactNode {
  if (!text) return text;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(TRANSCRIPT_TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    const token = match[0];
    const first = token[0];
    if (first === '[' || first === '(') {
      nodes.push(<em key={key++} className="tx-annotation">{token}</em>);
    } else {
      nodes.push(<strong key={key++} className="tx-emphasis">{token}</strong>);
    }
    lastIndex = start + token.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return <Fragment>{nodes}</Fragment>;
}
