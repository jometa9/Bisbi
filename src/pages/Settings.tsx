import { useState, useRef, useEffect, useMemo } from 'react';
import type { AppSettings } from '../types';
import {
  SUPPORTED_UI_LANGUAGES,
  matchLocale,
  useTranslation,
  type UiLanguage,
  type UiLanguageSetting,
} from '../i18n';
import { Select } from '../components/Select';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { ConfirmButton } from '../components/ConfirmButton';
import { listMicrophones, type MicrophoneDevice } from '../audio';
import { HotkeyKeys } from '../components/HotkeyKeys';

interface Props {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => Promise<void>;
  onReset: () => Promise<void>;
  onClearHistory: () => Promise<void>;
}

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
        <SegmentedToggle<'pushToTalk' | 'tapToToggle'>
          value={settings.handsFreeMode ? 'tapToToggle' : 'pushToTalk'}
          onChange={(next) =>
            onChange({ handsFreeMode: next === 'tapToToggle' })
          }
          ariaLabel={t('settings.handsFree.title')}
          options={[
            {
              value: 'pushToTalk',
              label: t('settings.handsFree.pushToTalk.label'),
            },
            {
              value: 'tapToToggle',
              label: t('settings.handsFree.tapToToggle.label'),
            },
          ]}
          hint={
            settings.handsFreeMode
              ? t('settings.handsFree.tapToToggle.hint')
              : t('settings.handsFree.pushToTalk.hint')
          }
        />
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
        title={t('settings.transcriptionMode.title')}
        description={t('settings.transcriptionMode.description')}
      >
        <SegmentedToggle<'cloud' | 'offline'>
          value={settings.mode}
          onChange={(mode) => onChange({ mode })}
          ariaLabel={t('settings.transcriptionMode.title')}
          options={[
            {
              value: 'cloud',
              label: t('settings.transcriptionMode.cloud.label'),
            },
            {
              value: 'offline',
              label: t('settings.transcriptionMode.offline.label'),
            },
          ]}
          hint={
            settings.mode === 'offline'
              ? t('settings.transcriptionMode.offline.hint')
              : t('settings.transcriptionMode.cloud.hint')
          }
        />
      </Section>

      <Section
        title={t('settings.openAtLogin.title')}
        description={t('settings.openAtLogin.description')}
      >
        <SegmentedToggle<'enabled' | 'disabled'>
          value={settings.openAtLogin ? 'enabled' : 'disabled'}
          onChange={(next) => onChange({ openAtLogin: next === 'enabled' })}
          ariaLabel={t('settings.openAtLogin.title')}
          options={[
            {
              value: 'enabled',
              label: t('settings.openAtLogin.enabled.label'),
            },
            {
              value: 'disabled',
              label: t('settings.openAtLogin.disabled.label'),
            },
          ]}
          hint={
            settings.openAtLogin
              ? t('settings.openAtLogin.enabled.hint')
              : t('settings.openAtLogin.disabled.hint')
          }
        />
      </Section>

      <Section
        title={t('settings.muteAudio.title')}
        description={t('settings.muteAudio.description')}
      >
        <SegmentedToggle<'enabled' | 'disabled'>
          value={settings.muteSystemAudioWhileRecording ? 'enabled' : 'disabled'}
          onChange={(next) =>
            onChange({ muteSystemAudioWhileRecording: next === 'enabled' })
          }
          ariaLabel={t('settings.muteAudio.title')}
          options={[
            {
              value: 'enabled',
              label: t('settings.muteAudio.enabled.label'),
            },
            {
              value: 'disabled',
              label: t('settings.muteAudio.disabled.label'),
            },
          ]}
          hint={
            settings.muteSystemAudioWhileRecording
              ? t('settings.muteAudio.enabled.hint')
              : t('settings.muteAudio.disabled.hint')
          }
        />
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
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <header>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
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
      <div className={`hotkey-row${capturing ? ' capturing' : ''}`}>
        <div className="hotkey-display">
          {capturing && !showCapturePreview ? (
            <>
              <span className="hotkey-display-pulse" aria-hidden="true" />
              <span className="hotkey-display-text">
                {t('settings.hotkey.waiting')}
              </span>
            </>
          ) : (
            <span className="hotkey-display-keys">
              <HotkeyKeys accel={draft} platform={platform} size="sm" />
            </span>
          )}
        </div>
        <button
          className="btn-secondary hotkey-change-btn"
          onClick={() => {
            setCapturing((c) => !c);
          }}
        >
          {capturing ? t('settings.hotkey.cancel') : t('settings.hotkey.change')}
        </button>
      </div>
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
