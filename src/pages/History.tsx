import { useEffect, useState } from 'react';
import type { TranscriptionRow } from '../types';
import { useTranslation } from '../i18n';
import { TranscriptionList } from '../components/TranscriptionList';
import { ConfirmButton } from '../components/ConfirmButton';

export function History() {
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
        {rows.length > 0 && (
          <ConfirmButton
            label={t('history.clearAll')}
            question={t('history.confirmClear')}
            onConfirm={() => window.bisbi.clearHistory()}
          />
        )}
      </div>

      <TranscriptionList rows={rows} emptyLabel={t('history.empty')} />
    </div>
  );
}
