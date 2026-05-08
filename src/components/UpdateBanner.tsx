import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n';
import type { ReleaseState } from '../types';

export function UpdateBanner() {
  const { t } = useTranslation();
  const [state, setState] = useState<ReleaseState | null>(null);

  useEffect(() => {
    if (!window.bisbi?.release) {
      console.log('[UpdateBanner] window.bisbi.release is unavailable');
      return;
    }
    void window.bisbi.release.getState().then((s) => {
      console.log('[UpdateBanner] initial getState ->', s);
      setState(s);
    });
    return window.bisbi.release.onStateChange((s) => {
      console.log('[UpdateBanner] onStateChange ->', s);
      setState(s);
    });
  }, []);

  console.log('[UpdateBanner] render with state', state);

  if (!state?.hasUpdate || !state.downloadUrl || !state.latest?.version) {
    return null;
  }

  const handleClick = () => {
    if (state.downloadUrl) {
      void window.bisbi.openExternal(state.downloadUrl);
    }
  };

  return (
    <div className="sidebar-update">
      <div className="sidebar-update-watermark" aria-hidden="true">
        v{state.latest.version}
      </div>
      <div className="sidebar-update-content">
        <span className="sidebar-update-text">
          {t('app.updateAvailable')}
        </span>
        <button
          type="button"
          className="sidebar-update-button"
          onClick={handleClick}
        >
          {t('app.updateAction')}
        </button>
      </div>
    </div>
  );
}
