import { useEffect, useState } from 'react';
import type { RecordingState } from './types';

export function RecordingApp() {
  const [state, setState] = useState<RecordingState>('recording');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const off = window.bisbi.onRecordingState((s) => setState(s));
    return off;
  }, []);

  useEffect(() => {
    if (state !== 'recording') return;
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  return (
    <div className="recording-pill">
      <div className={`dot ${state}`} />
      <div className="label">
        {state === 'recording' && `Grabando · ${formatTime(seconds)}`}
        {state === 'transcribing' && 'Transcribiendo…'}
        {state === 'idle' && 'Listo'}
      </div>
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
