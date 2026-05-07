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
import { listMicrophones, type MicrophoneDevice } from '../audio';
import { HotkeyKeys } from '../components/HotkeyKeys';
import { WHISPER_LANGUAGES, whisperLanguageLabel } from '../whisperLanguages';

interface Props {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => Promise<void>;
  onReset: () => Promise<void>;
  onClearHistory: () => Promise<void>;
}

const PRECISION_OPTIONS: Precision[] = ['fast', 'accurate'];

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
        title={t('settings.microphone.title')}
        description={t('settings.microphone.description')}
      >
        <MicrophonePicker
          value={settings.microphoneId}
          onChange={(microphoneId) => onChange({ microphoneId })}
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
        {!settings.handsFreeMode && (
          <DoubleTapNotice hotkey={settings.hotkey} />
        )}
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
          searchPlaceholder={t('settings.transcriptionLanguage.searchPlaceholder')}
          options={[
            { value: 'auto', label: t('languages.auto') },
            ...WHISPER_LANGUAGES.map((lang) => ({
              value: lang.code,
              label: whisperLanguageLabel(lang),
              // The label format is "English — Endonym"; pasting both into
              // searchTerms is redundant but harmless and keeps any future
              // label-format change from breaking search.
              searchTerms: `${lang.english} ${lang.endonym} ${lang.code}`,
            })),
          ]}
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
        title={t('settings.vocabulary.title')}
        description={t('settings.vocabulary.description')}
      >
        <VocabularyInput
          value={settings.vocabulary}
          onChange={(vocabulary) => onChange({ vocabulary })}
          placeholder={t('settings.vocabulary.placeholder')}
          hint={t('settings.vocabulary.hint')}
        />
      </Section>

      <Section
        title={t('settings.muteAudio.title')}
        description={t('settings.muteAudio.description')}
      >
        <div className="option-cards">
          <OptionCard
            name="muteSystemAudioWhileRecording"
            selected={settings.muteSystemAudioWhileRecording}
            title={t('settings.muteAudio.enabled.label')}
            hint={t('settings.muteAudio.enabled.hint')}
            onSelect={() => onChange({ muteSystemAudioWhileRecording: true })}
          />
          <OptionCard
            name="muteSystemAudioWhileRecording"
            selected={!settings.muteSystemAudioWhileRecording}
            title={t('settings.muteAudio.disabled.label')}
            hint={t('settings.muteAudio.disabled.hint')}
            onSelect={() => onChange({ muteSystemAudioWhileRecording: false })}
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

function DoubleTapNotice({ hotkey }: { hotkey: string }) {
  const { t } = useTranslation();
  const isMac = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPod|iPad/.test(navigator.platform),
    []
  );
  const platform = isMac ? 'mac' : 'win';
  const [before, after] = t('settings.handsFree.doubleTapNotice').split('{hotkey}');

  return (
    <div className="handsfree-notice" role="note">
      <span className="handsfree-notice-body">
        {before}
        <span className="handsfree-notice-keys">
          <HotkeyKeys accel={hotkey} platform={platform} size="sm" />
          <HotkeyKeys accel={hotkey} platform={platform} size="sm" />
        </span>
        {after}
      </span>
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
  const platform = isMac ? 'mac' : 'win';

  return (
    <div className="hotkey-input" ref={ref}>
      <div className={`hotkey-display${capturing ? ' capturing' : ''}`}>
        {capturing ? (
          <>
            <span className="hotkey-display-pulse" aria-hidden="true" />
            {showCapturePreview ? (
              <span className="hotkey-display-keys">
                <HotkeyKeys accel={draft} platform={platform} size="sm" />
              </span>
            ) : (
              <span className="hotkey-display-text">
                {t('settings.hotkey.waiting')}
              </span>
            )}
          </>
        ) : (
          <span className="hotkey-display-keys">
            <HotkeyKeys accel={draft} platform={platform} size="sm" />
          </span>
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
              setDraft('MetaRight');
              onChange('MetaRight');
              setCapturing(false);
            }}
          >
            Right Command
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

const DEFAULT_MIC_VALUE = '__system_default__';

function MicrophonePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<MicrophoneDevice[]>([]);

  // Refresh whenever the OS reports a device add/remove (plugging in a USB
  // mic, switching Bluetooth headphones, etc.).
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const list = await listMicrophones();
      if (!cancelled) setDevices(list);
    };
    void refresh();
    const md = navigator.mediaDevices;
    md?.addEventListener?.('devicechange', refresh);
    return () => {
      cancelled = true;
      md?.removeEventListener?.('devicechange', refresh);
    };
  }, []);

  // If the persisted device isn't currently available, the dropdown shows
  // "System default" — the saved id stays put so the device gets re-picked
  // automatically when it comes back.
  const persistedAvailable =
    value !== null && devices.some((d) => d.deviceId === value);
  const selected = persistedAvailable ? (value as string) : DEFAULT_MIC_VALUE;

  const options = [
    { value: DEFAULT_MIC_VALUE, label: t('settings.microphone.systemDefault') },
    ...devices.map((d, i) => ({
      value: d.deviceId,
      label: d.label || t('settings.microphone.unnamed', { index: i + 1 }),
    })),
  ];

  return (
    <Select<string>
      value={selected}
      onChange={(next) =>
        onChange(next === DEFAULT_MIC_VALUE ? null : next)
      }
      ariaLabel={t('settings.microphone.title')}
      options={options}
    />
  );
}

// Whisper's `--prompt` is capped around 224 tokens — well under that the
// quality starts to degrade if the prompt drowns out the actual audio.
// 240 chars keeps users within a safe envelope without having to count tokens.
const VOCABULARY_MAX_LENGTH = 240;

function VocabularyInput({
  value,
  onChange,
  placeholder,
  hint,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  hint: string;
}) {
  const [draft, setDraft] = useState(value);
  // Re-sync if the underlying setting changes from elsewhere (reset, another
  // window). We compare to avoid clobbering an in-progress edit when this
  // component itself emitted the change.
  useEffect(() => {
    setDraft((prev) => (prev === value ? prev : value));
  }, [value]);

  // Debounce disk writes so we don't fsync on every keystroke. 400ms feels
  // immediate while still collapsing a typing burst into a single save.
  useEffect(() => {
    if (draft === value) return;
    const handle = setTimeout(() => onChange(draft), 400);
    return () => clearTimeout(handle);
  }, [draft, value, onChange]);

  return (
    <div className="vocabulary-input">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, VOCABULARY_MAX_LENGTH))}
        placeholder={placeholder}
        rows={3}
        maxLength={VOCABULARY_MAX_LENGTH}
        spellCheck={false}
      />
      <div className="vocabulary-input-meta">
        <span className="vocabulary-input-hint">{hint}</span>
        <span className="vocabulary-input-counter">
          {draft.length}/{VOCABULARY_MAX_LENGTH}
        </span>
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
