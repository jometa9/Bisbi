import { useEffect, useState } from 'react';
import type { TranscriptionRow } from '../types';
import { useTranslation } from '../i18n';
import { TranscriptionList } from '../components/TranscriptionList';
import { ConfirmButton } from '../components/ConfirmButton';

interface Props {
  saveHistoryEnabled: boolean;
  onOpenSettings: () => void;
}

export function History({ saveHistoryEnabled, onOpenSettings }: Props) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<TranscriptionRow[]>([]);

  const refresh = () => void window.bisbi.listHistory(200).then(setRows);

  useEffect(() => {
    refresh();
    const off = window.bisbi.onHistoryChange(refresh);
    return off;
  }, []);

  return (
    <div className="history">
      <div className="history-header">
        <h2>{t('history.title')}</h2>
        {saveHistoryEnabled && rows.length > 0 && (
          <ConfirmButton
            label={t('history.clearAll')}
            question={t('history.confirmClear')}
            onConfirm={() => window.bisbi.clearHistory()}
          />
        )}
      </div>

      {saveHistoryEnabled ? (
        <TranscriptionList rows={rows} emptyLabel={t('history.empty')} />
      ) : (
        <div className="history-disabled" role="status">
          <p className="history-disabled-title">{t('history.savingDisabledTitle')}</p>
          <p className="history-disabled-hint">{t('history.savingDisabledHint')}</p>
          <button type="button" className="btn-secondary" onClick={onOpenSettings}>
            {t('history.savingDisabledCta')}
          </button>
        </div>
      )}
    </div>
  );
}
