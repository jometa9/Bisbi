import { useState, useRef, useEffect } from 'react';
import type { AppSettings, Precision } from '../types';
import {
  SUPPORTED_UI_LANGUAGES,
  matchLocale,
  useTranslation,
  type UiLanguage,
  type UiLanguageSetting,
} from '../i18n';

interface Props {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => Promise<void>;
  onReset: () => Promise<void>;
}

const TRANSCRIPTION_LANGUAGES: { value: string; key: string }[] = [
  { value: 'auto', key: 'languages.auto' },
  { value: 'es', key: 'languages.es' },
  { value: 'en', key: 'languages.en' },
  { value: 'pt', key: 'languages.pt' },
  { value: 'fr', key: 'languages.fr' },
  { value: 'it', key: 'languages.it' },
  { value: 'de', key: 'languages.de' },
  { value: 'zh', key: 'languages.zh' },
  { value: 'hi', key: 'languages.hi' },
  { value: 'ar', key: 'languages.ar' },
];

const PRECISION_OPTIONS: Precision[] = ['fast', 'balanced', 'high'];

export function Settings({ settings, onChange, onReset }: Props) {
  const { t, systemLocale } = useTranslation();

  const detectedSystemLang: UiLanguage =
    matchLocale(systemLocale ?? '') ?? 'en';
  const systemLabel = t('settings.uiLanguage.system', {
    detected: t(`uiLanguageOption.${detectedSystemLang}` as const),
  });

  return (
    <div className="settings">
      <Section
        title={t('settings.hotkey.title')}
        description={t('settings.hotkey.description')}
      >
        <HotkeyInput
          value={settings.hotkey}
          onChange={(hotkey) => onChange({ hotkey })}
        />
      </Section>

      <Section
        title={t('settings.uiLanguage.title')}
        description={t('settings.uiLanguage.description')}
      >
        <select
          value={settings.uiLanguage}
          onChange={(e) =>
            onChange({ uiLanguage: e.target.value as UiLanguageSetting })
          }
        >
          <option value="system">{systemLabel}</option>
          {SUPPORTED_UI_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {t(`uiLanguageOption.${lang}` as const)}
            </option>
          ))}
        </select>
      </Section>

      <Section
        title={t('settings.transcriptionLanguage.title')}
        description={t('settings.transcriptionLanguage.description')}
      >
        <select
          value={settings.language}
          onChange={(e) => onChange({ language: e.target.value })}
        >
          {TRANSCRIPTION_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {t(l.key as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
      </Section>

      <Section
        title={t('settings.precision.title')}
        description={t('settings.precision.description')}
      >
        {PRECISION_OPTIONS.map((opt) => (
          <label className="radio" key={opt}>
            <input
              type="radio"
              checked={settings.precision === opt}
              onChange={() => onChange({ precision: opt })}
            />
            <span>
              <strong>{t(`settings.precision.${opt}.label` as const)}</strong>
              <small style={{ display: 'block', opacity: 0.7 }}>
                {t(`settings.precision.${opt}.hint` as const)}
              </small>
            </span>
          </label>
        ))}
      </Section>

      <Section
        title={t('settings.pasteMode.title')}
        description={t('settings.pasteMode.description')}
      >
        <label className="radio">
          <input
            type="radio"
            checked={settings.pasteMode === 'paste'}
            onChange={() => onChange({ pasteMode: 'paste' })}
          />
          <span>{t('settings.pasteMode.paste')}</span>
        </label>
        <label className="radio">
          <input
            type="radio"
            checked={settings.pasteMode === 'clipboard'}
            onChange={() => onChange({ pasteMode: 'clipboard' })}
          />
          <span>{t('settings.pasteMode.clipboard')}</span>
        </label>
      </Section>

      <Section
        title={t('settings.saveHistory.title')}
        description={t('settings.saveHistory.description')}
      >
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.saveHistory}
            onChange={(e) => onChange({ saveHistory: e.target.checked })}
          />
          <span>{t('settings.saveHistory.label')}</span>
        </label>
      </Section>

      <div className="actions">
        <button className="btn-secondary" onClick={onReset}>
          {t('settings.reset')}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <header>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>
      <div className="section-body">{children}</div>
    </section>
  );
}

function HotkeyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const { t } = useTranslation();
  const [capturing, setCapturing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (!capturing) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const accel = keyEventToAccelerator(e);
      if (accel) {
        setDraft(accel);
        if (isFinalAccelerator(accel)) {
          setCapturing(false);
          onChange(accel);
        }
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [capturing, onChange]);

  return (
    <div className="hotkey-input" ref={ref}>
      <code className={capturing ? 'capturing' : ''}>{draft}</code>
      <button
        className="btn-secondary"
        onClick={() => {
          setCapturing((c) => !c);
        }}
      >
        {capturing ? t('settings.hotkey.cancel') : t('settings.hotkey.change')}
      </button>
    </div>
  );
}

function keyEventToAccelerator(e: KeyboardEvent): string | null {
  const parts: string[] = [];
  if (e.metaKey) parts.push('Cmd');
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  const key = normalizeKey(e.key, e.code);
  if (!key) return parts.join('+');
  parts.push(key);
  return parts.join('+');
}

function isFinalAccelerator(accel: string): boolean {
  // Require at least one non-modifier key.
  const lastPart = accel.split('+').pop() ?? '';
  return !['Cmd', 'Ctrl', 'Alt', 'Shift'].includes(lastPart);
}

function normalizeKey(key: string, code: string): string | null {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return null;
  if (key === ' ' || code === 'Space') return 'Space';
  if (/^[a-z]$/i.test(key)) return key.toUpperCase();
  if (/^F\d+$/.test(key)) return key;
  if (/^Arrow/.test(key)) return key.replace('Arrow', '');
  if (key.length === 1) return key;
  return key;
}
