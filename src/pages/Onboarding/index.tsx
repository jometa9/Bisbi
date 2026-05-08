import { useEffect, useMemo, useState } from 'react';
import type { OnboardingStep, AppSettings, PermissionStatus } from '../../types';
import { useTranslation } from '../../i18n';
import { Welcome } from './Welcome';
import { Permissions } from './Permissions';
import { FirstDictation } from './FirstDictation';
import owlIdleSvg from '../../../build-resources/owl_head.svg';

interface Props {
  settings: AppSettings;
  onSettingsChange: (next: AppSettings) => void;
  onExit: () => void;
  onMicNeeded: (needed: boolean) => void;
}

export function Onboarding({ settings, onSettingsChange, onExit, onMicNeeded }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [platform, setPlatform] = useState<NodeJS.Platform | null>(null);
  const [perms, setPerms] = useState<PermissionStatus | null>(null);

  useEffect(() => {
    if (!window.bisbi) return;
    void window.bisbi.getPlatform().then(setPlatform);
    void window.bisbi.onboarding.getPermissions().then(setPerms);
  }, []);

  useEffect(() => {
    onMicNeeded(step === 3);
    return () => onMicNeeded(false);
  }, [step, onMicNeeded]);

  // Skip the permissions screen on first entry if the OS already reports both
  // checks granted — typically a reinstall on the same machine.
  useEffect(() => {
    if (step !== 2 || !perms) return;
    const a11yOk = perms.accessibility !== 'denied';
    const micOk = perms.microphone === 'granted';
    if (micOk && a11yOk && perms.accessibility !== 'unknown') {
      setStep(3);
    }
  }, [step, perms]);

  const onMicrophoneChange = async (microphoneId: string | null) => {
    try {
      const next = await window.bisbi.updateSettings({ microphoneId });
      onSettingsChange(next);
    } catch (err) {
      console.error('[onboarding] microphone update failed:', err);
    }
  };

  const onLanguageChange = async (language: string) => {
    try {
      const next = await window.bisbi.updateSettings({ language });
      onSettingsChange(next);
    } catch (err) {
      console.error('[onboarding] language update failed:', err);
    }
  };

  const totalSteps = 3;
  const displayStep = step === 1 ? 1 : 2;

  const content = useMemo(() => {
    switch (step) {
      case 1:
        return <Welcome onContinue={() => setStep(2)} />;
      case 2:
        return <Permissions platform={platform} onContinue={() => setStep(3)} />;
      case 3:
        return (
          <FirstDictation
            hotkey={settings.hotkey}
            platform={platform}
            microphoneId={settings.microphoneId}
            language={settings.language}
            onMicrophoneChange={onMicrophoneChange}
            onLanguageChange={onLanguageChange}
            onContinue={onExit}
          />
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, platform, settings, perms]);

  return (
    <div className="onb-shell">
      <img
        src={owlIdleSvg}
        alt=""
        aria-hidden="true"
        className="login-owl login-owl--left"
      />
      <div className="onb-progress">
        <span className="onb-progress-text">
          {t('onboarding.progress', { current: displayStep, total: totalSteps })}
        </span>
      </div>
      <div className="onb-content" key={step}>
        {content}
      </div>
      <div className="onb-footer">
        <button
          type="button"
          className="onb-exit"
          onClick={onExit}
        >
          {t('auth.backToLogin')}
        </button>
      </div>
    </div>
  );
}
