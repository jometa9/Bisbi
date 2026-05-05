import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n';

interface Props {
  className?: string;
  label: string;
  question: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmButton({ className, label, question, onConfirm }: Props) {
  const { t } = useTranslation();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!armed) return;
    confirmRef.current?.focus();

    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setArmed(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setArmed(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [armed]);

  if (!armed) {
    return (
      <button
        type="button"
        className={className ?? 'btn-danger'}
        onClick={() => setArmed(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="confirm-inline" role="group" ref={containerRef}>
      <span className="confirm-inline-question">{question}</span>
      <div className="confirm-inline-actions">
        <button
          ref={confirmRef}
          type="button"
          className="btn-danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              setArmed(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          {t('common.yes')}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => setArmed(false)}
        >
          {t('common.no')}
        </button>
      </div>
    </div>
  );
}
