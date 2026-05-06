import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n';
import { HotkeyKeys } from '../../components/HotkeyKeys';
import { HotkeyCapture } from '../../components/HotkeyCapture';
import { formatHotkeyAccelerator, type KeyPlatform } from '../../lib/hotkey';

interface Props {
  platform: NodeJS.Platform | null;
  initialHotkey: string;
  onConfirm: (accelerator: string) => Promise<void> | void;
  onBack: () => void;
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
      { id: 'rctrl', accelerator: 'CtrlRight' },
      { id: 'caps', accelerator: 'CapsLock' },
    ];
  }
  return [
    { id: 'recommended', accelerator: 'AltRight', recommended: true },
    { id: 'rctrl', accelerator: 'CtrlRight' },
    { id: 'caps', accelerator: 'CapsLock' },
  ];
}

export function Hotkey({ platform, initialHotkey, onConfirm, onBack }: Props) {
  const { t } = useTranslation();
  const presets = useMemo(() => buildPresets(platform), [platform]);
  const keyPlatform: KeyPlatform = platform === 'darwin' ? 'mac' : 'win';

  const initialMatch = presets.find((p) => p.accelerator === initialHotkey);
  const [selected, setSelected] = useState<string>(
    initialMatch?.accelerator ?? presets[0]!.accelerator
  );
  const [customAccel, setCustomAccel] = useState<string | null>(
    initialMatch ? null : initialHotkey || null
  );
  const [capturing, setCapturing] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isCustomActive = selected === '__custom__';
  const finalAccelerator = isCustomActive ? (customAccel ?? '') : selected;

  useEffect(() => {
    setConflict(null);
  }, [selected, customAccel]);

  const onPickPreset = (accelerator: string) => {
    setSelected(accelerator);
    setCapturing(false);
  };

  const onPickCustom = () => {
    setSelected('__custom__');
    setCapturing(true);
  };

  const onCaptureDone = async (accelerator: string) => {
    setCapturing(false);
    setCustomAccel(accelerator);
    setSelected('__custom__');
    const result = await window.bisbi.onboarding.validateHotkey(accelerator);
    if (!result.ok) {
      setConflict(result.reason ?? 'invalid');
    }
  };

  const onSubmit = async () => {
    if (!finalAccelerator) return;
    setSubmitting(true);
    try {
      const result = await window.bisbi.onboarding.validateHotkey(finalAccelerator);
      if (!result.ok) {
        setConflict(result.reason ?? 'invalid');
        setSubmitting(false);
        return;
      }
      await onConfirm(finalAccelerator);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="onb-screen">
      <h1 className="onb-title">{t('onboarding.hotkey.title')}</h1>
      <p className="onb-subtitle">{t('onboarding.hotkey.subtitle')}</p>

      <div className="onb-hotkey-preview">
        {capturing ? (
          <HotkeyCapture
            onCapture={onCaptureDone}
            onCancel={() => {
              setCapturing(false);
              if (!customAccel) setSelected(presets[0]!.accelerator);
            }}
          />
        ) : finalAccelerator ? (
          <span className="onb-hotkey-preview-keys">
            <HotkeyKeys accel={finalAccelerator} platform={keyPlatform} visual="lit" size="md" />
          </span>
        ) : (
          <span className="onb-hotkey-preview-empty">
            {t('onboarding.hotkey.pickOne')}
          </span>
        )}
      </div>

      {finalAccelerator && !capturing && (
        <p className="onb-hotkey-readout">
          {formatHotkeyAccelerator(finalAccelerator, keyPlatform)}
        </p>
      )}

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
                {formatHotkeyAccelerator(preset.accelerator, keyPlatform)}
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
        <button
          type="button"
          className={`onb-hotkey-option${isCustomActive ? ' selected' : ''}`}
          onClick={onPickCustom}
        >
          <span className="onb-hotkey-option-radio" aria-hidden="true" />
          <span className="onb-hotkey-option-body">
            <span className="onb-hotkey-option-name">
              {t('onboarding.hotkey.custom')}
            </span>
            {isCustomActive && customAccel && !capturing && (
              <span className="onb-hotkey-option-hint">
                {formatHotkeyAccelerator(customAccel, keyPlatform)}
              </span>
            )}
          </span>
        </button>
      </div>

      {conflict && (
        <p className="onb-error">
          {conflict === 'inUse'
            ? t('onboarding.hotkey.conflictInUse')
            : t('onboarding.hotkey.conflictInvalid')}
        </p>
      )}

      <div className="onb-nav">
        <button type="button" className="btn-secondary onb-back" onClick={onBack}>
          {t('onboarding.back')}
        </button>
        <button
          type="button"
          className="btn-primary onb-cta"
          onClick={onSubmit}
          disabled={submitting || !finalAccelerator || capturing}
        >
          {t('onboarding.hotkey.confirm')}
        </button>
      </div>
    </div>
  );
}
