import { useEffect, useState } from 'react';
import type { UpdateStatus } from '../types';
import { useTranslation } from '../i18n';

export function UpdateLabel() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UpdateStatus>({ kind: 'idle' });

  useEffect(() => {
    if (!window.bisbi) return;
    void window.bisbi.updater.getState().then(setStatus);
    return window.bisbi.updater.onStateChange(setStatus);
  }, []);

  if (status.kind === 'downloading') {
    const pct = Math.max(0, Math.min(100, Math.round(status.percent ?? 0)));
    return (
      <div className="sidebar-update sidebar-update-downloading" role="status">
        <div className="sidebar-update-progress" style={{ width: `${pct}%` }} aria-hidden="true" />
        <span className="sidebar-update-text">
          {t('update.downloading', { percent: pct })}
        </span>
      </div>
    );
  }

  if (status.kind === 'downloaded') {
    return (
      <button
        type="button"
        className="sidebar-update sidebar-update-ready"
        onClick={() => void window.bisbi.updater.install()}
      >
        <span className="sidebar-update-text">
          {t('update.ready', { version: status.version ?? '' })}
        </span>
        <span className="sidebar-update-cta">{t('update.restart')}</span>
      </button>
    );
  }

  return null;
}
