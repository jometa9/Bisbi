import { useState, useRef, useEffect, useMemo } from 'react';
import type { AppSettings, Precision } from '../types';
import {
  SUPPORTED_UI_LANGUAGES,
  matchLocale,
  useTranslation,
  type UiLanguage,
  type UiLanguageSetting,
} from '../i18n';
import { Select } from '../components/Select';
import { ConfirmButton } from '../components/ConfirmButton';

interface Props {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => Promise<void>;
  onReset: () => Promise<void>;
  onClearHistory: () => Promise<void>;
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

export function Settings({ settings, onChange, onReset, onClearHistory }: Props) {
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
        title={t('settings.handsFree.title')}
        description={t('settings.handsFree.description')}
      >
        <div className="option-cards">
          <OptionCard
            name="handsFreeMode"
            selected={!settings.handsFreeMode}
            title={t('settings.handsFree.pushToTalk.label')}
            hint={t('settings.handsFree.pushToTalk.hint')}
            onSelect={() => onChange({ handsFreeMode: false })}
          />
          <OptionCard
            name="handsFreeMode"
            selected={settings.handsFreeMode}
            title={t('settings.handsFree.tapToToggle.label')}
            hint={t('settings.handsFree.tapToToggle.hint')}
            onSelect={() => onChange({ handsFreeMode: true })}
          />
        </div>
      </Section>

      <Section
        title={t('settings.uiLanguage.title')}
        description={t('settings.uiLanguage.description')}
      >
        <Select<UiLanguageSetting>
          value={settings.uiLanguage}
          onChange={(uiLanguage) => onChange({ uiLanguage })}
          ariaLabel={t('settings.uiLanguage.title')}
          options={[
            { value: 'system', label: systemLabel },
            ...SUPPORTED_UI_LANGUAGES.map((lang) => ({
              value: lang,
              label: t(`uiLanguageOption.${lang}` as const),
            })),
          ]}
        />
      </Section>

      <Section
        title={t('settings.transcriptionLanguage.title')}
        description={t('settings.transcriptionLanguage.description')}
      >
        <Select<string>
          value={settings.language}
          onChange={(language) => onChange({ language })}
          ariaLabel={t('settings.transcriptionLanguage.title')}
          options={TRANSCRIPTION_LANGUAGES.map((l) => ({
            value: l.value,
            label: t(l.key as Parameters<typeof t>[0]),
          }))}
        />
      </Section>

      <Section
        title={t('settings.precision.title')}
        description={t('settings.precision.description')}
      >
        <div className="option-cards">
          {PRECISION_OPTIONS.map((opt) => (
            <OptionCard
              key={opt}
              name="precision"
              selected={settings.precision === opt}
              title={t(`settings.precision.${opt}.label` as const)}
              hint={t(`settings.precision.${opt}.hint` as const)}
              onSelect={() => onChange({ precision: opt })}
            />
          ))}
        </div>
      </Section>

      <Section
        title={t('settings.pasteMode.title')}
        description={t('settings.pasteMode.description')}
      >
        <div className="option-cards">
          <OptionCard
            name="pasteMode"
            selected={settings.pasteMode === 'paste'}
            title={t('settings.pasteMode.paste')}
            onSelect={() => onChange({ pasteMode: 'paste' })}
          />
          <OptionCard
            name="pasteMode"
            selected={settings.pasteMode === 'clipboard'}
            title={t('settings.pasteMode.clipboard')}
            onSelect={() => onChange({ pasteMode: 'clipboard' })}
          />
        </div>
      </Section>

      <Section
        title={t('settings.saveHistory.title')}
        description={t('settings.saveHistory.description')}
      >
        <div className="option-cards">
          <OptionCard
            name="saveHistory"
            selected={settings.saveHistory}
            title={t('settings.saveHistory.enabled.label')}
            hint={t('settings.saveHistory.enabled.hint')}
            onSelect={() => onChange({ saveHistory: true })}
          />
          <OptionCard
            name="saveHistory"
            selected={!settings.saveHistory}
            title={t('settings.saveHistory.disabled.label')}
            hint={t('settings.saveHistory.disabled.hint')}
            onSelect={() => onChange({ saveHistory: false })}
          />
        </div>
      </Section>

      <Section
        title={t('settings.dangerZone.title')}
        description={t('settings.dangerZone.description')}
      >
        <div className="actions">
          <ConfirmButton
            label={t('settings.reset')}
            question={t('settings.confirmReset')}
            onConfirm={onReset}
          />
          <ConfirmButton
            label={t('settings.clearHistory')}
            question={t('history.confirmClear')}
            onConfirm={onClearHistory}
          />
        </div>
      </Section>
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

function OptionCard({
  name,
  selected,
  title,
  hint,
  onSelect,
}: {
  name: string;
  selected: boolean;
  title: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <label className={`option-card${selected ? ' selected' : ''}`}>
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={onSelect}
        className="option-card-input"
      />
      <span className="option-card-radio" aria-hidden="true" />
      <span className="option-card-body">
        <span className="option-card-title">{title}</span>
        {hint && <span className="option-card-hint">{hint}</span>}
      </span>
    </label>
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
  // Tracks whether a non-modifier key was pressed during this capture
  // session. If only modifiers were pressed and then released, we accept
  // the modifier itself as a bare-modifier hotkey (e.g. AltRight).
  const sawNonModifierRef = useRef(false);
  const isMac = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPod|iPad/.test(navigator.platform),
    []
  );

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (!capturing) return;
    sawNonModifierRef.current = false;

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const isMod =
        e.key === 'Control' ||
        e.key === 'Shift' ||
        e.key === 'Alt' ||
        e.key === 'Meta';
      if (!isMod) sawNonModifierRef.current = true;
      const accel = keyEventToAccelerator(e);
      if (accel) {
        setDraft(accel);
        if (isFinalAccelerator(accel)) {
          finish(accel);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      // If the user released a modifier without ever pressing a non-modifier,
      // treat the modifier itself as a bare-modifier accelerator (handy for
      // single-key hotkeys like Right Alt / Right Cmd).
      if (sawNonModifierRef.current) return;
      const bare = bareModifierFromCode(e.code);
      if (!bare) return;
      e.preventDefault();
      finish(bare);
    };

    const finish = (accel: string) => {
      setDraft(accel);
      setCapturing(false);
      onChange(accel);
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [capturing, onChange]);

  const showCapturePreview = capturing && draft && draft !== value;

  return (
    <div className="hotkey-input" ref={ref}>
      <div className={`hotkey-display${capturing ? ' capturing' : ''}`}>
        {capturing ? (
          <>
            <span className="hotkey-display-pulse" aria-hidden="true" />
            <span className="hotkey-display-text">
              {showCapturePreview ? draft : t('settings.hotkey.waiting')}
            </span>
          </>
        ) : (
          <span className="hotkey-display-text">{draft}</span>
        )}
      </div>
      <button
        className="btn-secondary"
        onClick={() => {
          setCapturing((c) => !c);
        }}
      >
        {capturing ? t('settings.hotkey.cancel') : t('settings.hotkey.change')}
      </button>
      <div className="hotkey-presets">
        {isMac && (
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setDraft('Fn');
              onChange('Fn');
              setCapturing(false);
            }}
          >
            Fn
          </button>
        )}
        <button
          type="button"
          className="btn-link"
          onClick={() => {
            setDraft('AltRight');
            onChange('AltRight');
            setCapturing(false);
          }}
        >
          {isMac ? 'Right Option' : 'Right Alt'}
        </button>
      </div>
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
  const lastPart = accel.split('+').pop() ?? '';
  return !['Cmd', 'Ctrl', 'Alt', 'Shift'].includes(lastPart);
}

function bareModifierFromCode(code: string): string | null {
  switch (code) {
    case 'AltRight':
      return 'AltRight';
    case 'AltLeft':
      return 'AltLeft';
    case 'ControlRight':
      return 'CtrlRight';
    case 'ControlLeft':
      return 'CtrlLeft';
    case 'ShiftRight':
      return 'ShiftRight';
    case 'ShiftLeft':
      return 'ShiftLeft';
    case 'MetaRight':
    case 'OSRight':
      return 'MetaRight';
    case 'MetaLeft':
    case 'OSLeft':
      return 'MetaLeft';
    default:
      return null;
  }
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
