import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n';
import type { PermissionStatus } from '../../types';

interface Props {
  platform: NodeJS.Platform | null;
  onContinue: () => void;
}

type Status = 'unknown' | 'granted' | 'denied';

// Driver for the second onboarding screen. The "Otorgar permisos" button
// chains the OS prompts: mic first, then accessibility (mac only). After a
// denial we show a direct link to the relevant System Settings pane and let
// the user retry — the page polls permission state on focus so the moment
// they flip the toggle externally, the check turns green.
export function Permissions({ platform, onContinue }: Props) {
  const { t } = useTranslation();
  const [perms, setPerms] = useState<PermissionStatus | null>(null);
  const [working, setWorking] = useState(false);

  const isMac = platform === 'darwin';

  useEffect(() => {
    let cancelled = false;
    void window.bisbi.onboarding.getPermissions().then((p) => {
      if (!cancelled) setPerms(p);
    });
    const onFocus = () => {
      void window.bisbi.onboarding.getPermissions().then((p) => {
        if (!cancelled) setPerms(p);
      });
    };
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const micStatus: Status =
    perms?.microphone === 'granted'
      ? 'granted'
      : perms?.microphone === 'denied'
        ? 'denied'
        : 'unknown';
  const a11yStatus: Status =
    !isMac
      ? 'granted'
      : perms?.accessibility === 'granted'
        ? 'granted'
        : perms?.accessibility === 'denied'
          ? 'denied'
          : 'unknown';

  const allGranted = micStatus === 'granted' && a11yStatus === 'granted';

  const requestAll = async () => {
    setWorking(true);
    try {
      let next = perms;
      if (micStatus !== 'granted') {
        next = await window.bisbi.onboarding.requestMicrophone();
        setPerms(next);
        if (process.platform === 'win32' || platform === 'win32') {
          // Windows requires a real getUserMedia call to surface the prompt.
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            for (const tr of stream.getTracks()) tr.stop();
            next = await window.bisbi.onboarding.getPermissions();
            setPerms(next);
          } catch {
            // user said no; nothing else we can do here
          }
        }
      }
      if (isMac && next && next.accessibility !== 'granted') {
        const updated = await window.bisbi.onboarding.requestAccessibility();
        setPerms(updated);
      }
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="onb-screen">
      <h1 className="onb-title">{t('onboarding.permissions.title')}</h1>
      <p className="onb-subtitle">{t('onboarding.permissions.subtitle')}</p>

      <div className="onb-perm-cards">
        <PermissionCard
          status={micStatus}
          icon="mic"
          title={t('onboarding.permissions.microphone.title')}
          description={t('onboarding.permissions.microphone.description')}
          deniedHint={t('onboarding.permissions.microphone.deniedHint')}
          openSettingsLabel={t('onboarding.permissions.openSettings')}
          onOpenSettings={() => window.bisbi.onboarding.openSystemSettings('microphone')}
        />
        {isMac && (
          <PermissionCard
            status={a11yStatus}
            icon="a11y"
            title={t('onboarding.permissions.accessibility.title')}
            description={t('onboarding.permissions.accessibility.description')}
            deniedHint={t('onboarding.permissions.accessibility.deniedHint')}
            openSettingsLabel={t('onboarding.permissions.openSettings')}
            onOpenSettings={() => window.bisbi.onboarding.openSystemSettings('accessibility')}
          />
        )}
      </div>

      <button
        type="button"
        className="btn-primary onb-cta"
        onClick={allGranted ? onContinue : requestAll}
        disabled={working}
      >
        {allGranted
          ? t('onboarding.permissions.continue')
          : t('onboarding.permissions.grant')}
      </button>
    </div>
  );
}

interface CardProps {
  status: Status;
  icon: 'mic' | 'a11y';
  title: string;
  description: string;
  deniedHint: string;
  openSettingsLabel: string;
  onOpenSettings: () => void;
}

function PermissionCard({
  status,
  icon,
  title,
  description,
  deniedHint,
  openSettingsLabel,
  onOpenSettings,
}: CardProps) {
  return (
    <div className={`onb-perm-card onb-perm-card--${status}`}>
      <span className="onb-perm-card-icon" aria-hidden="true">
        {icon === 'mic' ? <MicIcon /> : <A11yIcon />}
      </span>
      <div className="onb-perm-card-body">
        <span className="onb-perm-card-title">{title}</span>
        <span className="onb-perm-card-description">{description}</span>
        {status === 'denied' && (
          <span className="onb-perm-card-denied">
            {deniedHint}{' '}
            <button type="button" className="onb-link" onClick={onOpenSettings}>
              {openSettingsLabel}
            </button>
          </span>
        )}
      </div>
      <span className="onb-perm-card-status" aria-hidden="true">
        {status === 'granted' && <CheckIcon />}
      </span>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </svg>
  );
}

function A11yIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
