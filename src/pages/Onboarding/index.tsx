import { useEffect, useMemo, useState } from 'react';
import type { OnboardingStep, AppSettings, PermissionStatus } from '../../types';
import { useTranslation } from '../../i18n';
import { Welcome } from './Welcome';
import { Permissions } from './Permissions';
import { Hotkey } from './Hotkey';
import { FirstDictation } from './FirstDictation';
import { AccountStep } from './AccountStep';

interface Props {
  settings: AppSettings;
  onSettingsChange: (next: AppSettings) => void;
  initialStep: OnboardingStep;
}

// The 5-screen pre-login flow. Screens are linear and persist progress to
// disk so a quit-and-reopen lands on the last incomplete step. Screen 2
// auto-skips when the OS already reports both permissions granted (a
// reinstall, typically). The orchestrator stays small — every screen is
// self-contained except for state plumbing handled here.
export function Onboarding({ settings, onSettingsChange, initialStep }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [platform, setPlatform] = useState<NodeJS.Platform | null>(null);
  const [perms, setPerms] = useState<PermissionStatus | null>(null);

  useEffect(() => {
    if (!window.bisbi) return;
    void window.bisbi.getPlatform().then(setPlatform);
    void window.bisbi.onboarding.getPermissions().then(setPerms);
  }, []);

  // Skip the permissions screen on first entry if the OS already reports both
  // checks granted — typically a reinstall on the same machine.
  useEffect(() => {
    if (step !== 2 || !perms) return;
    const a11yOk = perms.accessibility !== 'denied';
    const micOk = perms.microphone === 'granted';
    if (micOk && a11yOk && perms.accessibility !== 'unknown') {
      goTo(3);
    }
    // we only check once per entry, so deps are minimal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, perms]);

  const goTo = (next: OnboardingStep) => {
    setStep(next);
    void window.bisbi?.onboarding.setState({ lastStep: next });
  };

  const finish = () => {
    void window.bisbi?.onboarding.setState({ completed: true, lastStep: 5 });
    // Auth state will switch the App away from the onboarding when the user
    // signs in via Google; we don't unmount until then.
  };

  const onConfirmHotkey = async (accelerator: string) => {
    try {
      const next = await window.bisbi.updateSettings({ hotkey: accelerator });
      onSettingsChange(next);
      goTo(4);
    } catch (err) {
      console.error('[onboarding] hotkey update failed:', err);
    }
  };

  const showsBack = step === 2 || step === 3 || step === 4;
  const totalSteps = 5;

  const content = useMemo(() => {
    switch (step) {
      case 1:
        return <Welcome onContinue={() => goTo(2)} />;
      case 2:
        return <Permissions platform={platform} onContinue={() => goTo(3)} />;
      case 3:
        return (
          <Hotkey
            platform={platform}
            initialHotkey={settings.hotkey}
            onConfirm={onConfirmHotkey}
            onBack={() => goTo(2)}
          />
        );
      case 4:
        return (
          <FirstDictation
            hotkey={settings.hotkey}
            platform={platform}
            microphoneId={settings.microphoneId}
            onContinue={() => {
              finish();
              goTo(5);
            }}
            onBack={() => goTo(3)}
          />
        );
      case 5:
        return <AccountStep />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, platform, settings, perms]);

  return (
    <div className="onb-shell">
      <div className="onb-progress" aria-hidden={!showsBack}>
        <span className="onb-progress-text">
          {t('onboarding.progress', { current: step, total: totalSteps })}
        </span>
      </div>
      <div className="onb-content" key={step}>
        {content}
      </div>
    </div>
  );
}
