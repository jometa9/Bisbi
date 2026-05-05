import { useEffect, useRef, useState } from 'react';
import type { RecordingState } from './types';

const BARS = 16;
const FALLOFF = 0.85;

export function RecordingApp() {
  const [state, setState] = useState<RecordingState>('recording');
  const [bars, setBars] = useState<number[]>(() => new Array(BARS).fill(0));
  const lastLevelRef = useRef(0);

  useEffect(() => {
    if (!window.bisbi) return;
    const offState = window.bisbi.onRecordingState(setState);
    const offLevel = window.bisbi.onRecordingLevel((level) => {
      lastLevelRef.current = level;
    });
    return () => {
      offState();
      offLevel();
    };
  }, []);

  useEffect(() => {
    if (state !== 'recording') return;
    const id = window.setInterval(() => {
      setBars((prev) => {
        const next = prev.slice(1);
        const v = lastLevelRef.current;
        lastLevelRef.current = v * FALLOFF;
        next.push(v);
        return next;
      });
    }, 60);
    return () => window.clearInterval(id);
  }, [state]);

  return (
    <div className={`recording-pill state-${state}`}>
      <div className="rec-indicator" aria-hidden="true">
        <span className="rec-square" />
      </div>
      <div className="rec-waveform" aria-hidden="true">
        {bars.map((v, i) => (
          <span
            key={i}
            className="rec-bar"
            style={{ transform: `scaleY(${0.12 + Math.min(1, v) * 0.88})` }}
          />
        ))}
      </div>
    </div>
  );
}
