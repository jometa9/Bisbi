import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
import { HotkeyKeys } from '../../components/HotkeyKeys';
import { formatHotkeyAccelerator, useHotkeyLabels, type KeyPlatform } from '../../lib/hotkey';

interface Props {
  platform: NodeJS.Platform | null;
  initialHotkey: string;
  onConfirm: (accelerator: string) => Promise<void> | void;
}

interface Preset {
  id: string;
  accelerator: string;
  recommended?: boolean;
}

function buildPresets(platform: NodeJS.Platform | null): Preset[] {
  if (platform === 'darwin') {
    return [
      { id: 'recommended', accelerator: 'MetaRight', recommended: true },
      { id: 'caps', accelerator: 'CapsLock' },
    ];
  }
  return [
    { id: 'recommended', accelerator: 'AltRight', recommended: true },
    { id: 'caps', accelerator: 'CapsLock' },
  ];
}

export function Hotkey({ platform, initialHotkey, onConfirm }: Props) {
  const { t } = useTranslation();
  const presets = useMemo(() => buildPresets(platform), [platform]);
  const keyPlatform: KeyPlatform = platform === 'darwin' ? 'mac' : 'win';
  const hotkeyLabels = useHotkeyLabels();

  const initialMatch = presets.find((p) => p.accelerator === initialHotkey);
  const [selected, setSelected] = useState<string>(
    initialMatch?.accelerator ?? presets[0]!.accelerator
  );
  const [conflict, setConflict] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [simPressed, setSimPressed] = useState(false);

  const finalAccelerator = selected;

  useEffect(() => {
    setConflict(null);
  }, [selected]);

  const userPressingRef = useRef(false);
  const onSubmitRef = useRef<(accelerator?: string) => void>(() => {});

  useEffect(() => {
    if (!finalAccelerator) return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const cycle = (pressed: boolean) => {
      if (cancelled) return;
      if (!userPressingRef.current) setSimPressed(pressed);
      timeout = setTimeout(() => cycle(!pressed), pressed ? 900 : 1400);
    };
    cycle(true);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      setSimPressed(false);
    };
  }, [finalAccelerator]);

  const pressedAcceleratorRef = useRef<string | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const codeToAccelerator = new Map<string, string>();
    for (const preset of presets) {
      for (const code of preset.accelerator.split('+').filter(Boolean)) {
        codeToAccelerator.set(code, preset.accelerator);
      }
    }
    const onDown = (e: KeyboardEvent) => {
      const matched = codeToAccelerator.get(e.code);
      if (!matched) return;
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      userPressingRef.current = true;
      pressedAcceleratorRef.current = matched;
      if (matched !== selected) setSelected(matched);
      setSimPressed(true);
    };
    const onUp = (e: KeyboardEvent) => {
      const matched = codeToAccelerator.get(e.code);
      if (!matched || !userPressingRef.current) return;
      if (pressedAcceleratorRef.current !== matched) return;
      userPressingRef.current = false;
      pressedAcceleratorRef.current = null;
      setSimPressed(false);
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        onSubmitRef.current(matched);
      }, 2000);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [presets, selected]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const onPickPreset = (accelerator: string) => {
    setSelected(accelerator);
  };

  const onSubmit = async (accelerator?: string) => {
    const target = accelerator ?? finalAccelerator;
    if (!target) return;
    setSubmitting(true);
    try {
      const result = await window.bisbi.onboarding.validateHotkey(target);
      if (!result.ok) {
        setConflict(result.reason ?? 'invalid');
        setSubmitting(false);
        return;
      }
      await onConfirm(target);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    onSubmitRef.current = (accelerator?: string) => {
      if (submitting) return;
      void onSubmit(accelerator);
    };
  });

  return (
    <div className="onb-screen">
      <h1 className="onb-title">{t('onboarding.hotkey.title')}</h1>
      <p className="onb-subtitle">{t('onboarding.hotkey.subtitle')}</p>

      <div className="home-hotkey">
        <div className="home-hotkey-watermark" aria-hidden="true">
          {simPressed ? t('home.watermark.listening') : t('home.watermark.idle')}
        </div>
        <div className="home-hotkey-content">
          <span className="home-hotkey-label">{t('home.hotkeyLabel')}</span>
          <div className="home-hotkey-keys">
            {finalAccelerator ? (
              <HotkeyKeys
                accel={finalAccelerator}
                platform={keyPlatform}
                visual={simPressed ? 'pressed' : 'idle'}
                size="md"
              />
            ) : (
              <span className="onb-hotkey-preview-empty">
                {t('onboarding.hotkey.pickOne')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="onb-hotkey-options">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`onb-hotkey-option${selected === preset.accelerator ? ' selected' : ''}`}
            onClick={() => onPickPreset(preset.accelerator)}
          >
            <span className="onb-hotkey-option-radio" aria-hidden="true" />
            <span className="onb-hotkey-option-body">
              <span className="onb-hotkey-option-name">
                {formatHotkeyAccelerator(preset.accelerator, keyPlatform, hotkeyLabels)}
                {preset.recommended && (
                  <span className="onb-hotkey-option-badge">
                    {t('onboarding.hotkey.recommended')}
                  </span>
                )}
              </span>
            </span>
            <span className="onb-hotkey-option-keys">
              <HotkeyKeys accel={preset.accelerator} platform={keyPlatform} size="sm" />
            </span>
          </button>
        ))}
      </div>

      {conflict && (
        <p className="onb-error">
          {conflict === 'inUse'
            ? t('onboarding.hotkey.conflictInUse')
            : t('onboarding.hotkey.conflictInvalid')}
        </p>
      )}

      <div className="onb-nav onb-nav--single">
        <button
          type="button"
          className="btn-primary onb-cta"
          onClick={() => onSubmit()}
          disabled={submitting || !finalAccelerator}
        >
          {t('onboarding.hotkey.confirm')}
        </button>
      </div>
    </div>
  );
}
