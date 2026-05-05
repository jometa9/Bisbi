import { useEffect, useState } from 'react';
import type { TranscriptionRow } from '../types';

export function History() {
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
        <h2>Transcripciones recientes</h2>
        {rows.length > 0 && (
          <button
            className="btn-secondary"
            onClick={async () => {
              if (!confirm('¿Borrar todo el historial?')) return;
              await window.bisbi.clearHistory();
            }}
          >
            Borrar todo
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="empty">Todavía no hay transcripciones. Probá tu atajo.</p>
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
                  Copiar
                </button>
                <button
                  className="btn-link danger"
                  onClick={() => window.bisbi.deleteHistory(row.id)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
