import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n';
import type { ReleaseState } from '../types';

export function UpdateBanner() {
  const { t } = useTranslation();
  const [state, setState] = useState<ReleaseState | null>(null);

  useEffect(() => {
    if (!window.bisbi?.release) return;
    void window.bisbi.release.getState().then(setState);
    return window.bisbi.release.onStateChange(setState);
  }, []);

  if (!state?.hasUpdate || !state.downloadUrl || !state.latest?.version) {
    return null;
  }

  const handleClick = () => {
    if (state.downloadUrl) {
      void window.bisbi.openExternal(state.downloadUrl);
    }
  };

  return (
    <button
      type="button"
      className="sidebar-update sidebar-update-ready"
      onClick={handleClick}
    >
      <span className="sidebar-update-text">
        {t('app.updateAvailable', { version: state.latest.version })}
      </span>
      <span className="sidebar-update-cta">{t('app.updateAction')}</span>
    </button>
  );
}
