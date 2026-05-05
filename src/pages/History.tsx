import { useEffect, useState } from 'react';
import type { TranscriptionRow } from '../types';
import { useTranslation } from '../i18n';

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
          <button
            className="btn-secondary"
            onClick={async () => {
              if (!confirm(t('history.confirmClear'))) return;
              await window.bisbi.clearHistory();
            }}
          >
            {t('history.clearAll')}
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="empty">{t('history.empty')}</p>
      ) : (
        <ul className="history-list">
          {rows.map((row) => (
            <li key={row.id}>
              <div className="history-meta">
                <time>{new Date(row.createdAt).toLocaleString()}</time>
                {row.durationMs != null && (
                  <span className="dim"> · {(row.durationMs / 1000).toFixed(1)}s</span>
                )}
                {row.language && <span className="dim"> · {row.language}</span>}
              </div>
              <p className="history-text">{row.text}</p>
              <div className="history-actions">
                <button
                  className="btn-link"
                  onClick={() => navigator.clipboard.writeText(row.text)}
                >
                  {t('history.copy')}
                </button>
                <button
                  className="btn-link danger"
                  onClick={() => window.bisbi.deleteHistory(row.id)}
                >
                  {t('history.delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
