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
}

export function Onboarding({ settings, onSettingsChange, onExit }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [platform, setPlatform] = useState<NodeJS.Platform | null>(null);
  const [perms, setPerms] = useState<PermissionStatus | null>(null);

  useEffect(() => {
    if (!window.bisbi) return;
    void window.bisbi.getPlatform().then(setPlatform);
    void window.bisbi.onboarding.getPermissions().then(setPerms);
  }, []);

  const permsAlreadyGranted = useMemo(() => {
    if (!perms) return false;
    const micOk = perms.microphone === 'granted';
    const a11yOk =
      platform === 'darwin' ? perms.accessibility === 'granted' : true;
    return micOk && a11yOk;
  }, [perms, platform]);

  // If we land on the permissions screen but the OS already reports both
  // checks granted (typically a reinstall on the same machine), jump straight
  // to the dictation step.
  useEffect(() => {
    if (step === 2 && permsAlreadyGranted) {
      setStep(3);
    }
  }, [step, permsAlreadyGranted]);

  const onMicrophoneChange = async (microphoneId: string | null) => {
    try {
      const next = await window.bisbi.updateSettings({ microphoneId });
      onSettingsChange(next);
    } catch (err) {
      console.error('[onboarding] microphone update failed:', err);
    }
  };

  const goFromWelcome = () => {
    setStep(permsAlreadyGranted ? 3 : 2);
  };

  // The progress counter hides the permissions step when it is going to be
  // skipped — the user should never see "1 of 3" if they will only ever go
  // through two screens.
  const totalSteps = permsAlreadyGranted ? 2 : 3;
  const displayStep =
    step === 1 ? 1 : step === 2 ? 2 : permsAlreadyGranted ? 2 : 3;

  const content = useMemo(() => {
    switch (step) {
      case 1:
        return <Welcome onContinue={goFromWelcome} />;
      case 2:
        return <Permissions platform={platform} onContinue={() => setStep(3)} />;
      case 3:
        return (
          <FirstDictation
            hotkey={settings.hotkey}
            platform={platform}
            microphoneId={settings.microphoneId}
            onMicrophoneChange={onMicrophoneChange}
            onContinue={onExit}
          />
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, platform, settings, perms, permsAlreadyGranted]);

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
          {t('onboarding.skip')}
        </button>
      </div>
    </div>
  );
}
