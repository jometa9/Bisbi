import { useEffect, useRef, useState } from 'react';
import type { RecordingState } from './types';

const BARS = 12;
const FALLOFF = 0.78;

export function RecordingApp() {
  const [state, setState] = useState<RecordingState>('recording');
  const [bars, setBars] = useState<number[]>(() => new Array(BARS).fill(0));
  const [seconds, setSeconds] = useState(0);
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

  useEffect(() => {
    if (state === 'idle') {
      setSeconds(0);
      return;
    }
    if (state === 'recording') {
      setSeconds(0);
      const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => window.clearInterval(id);
    }
    // 'transcribing' freezes the counter at the value reached during recording
  }, [state]);

  return (
    <div className={`recording-pill state-${state}`}>
      <div className="rec-indicator" aria-hidden="true" />
      <div className="rec-waveform" aria-hidden="true">
        {bars.map((v, i) => (
          <span
            key={i}
            className="rec-bar"
            style={{ transform: `scaleY(${0.12 + Math.min(1, v) * 0.68})` }}
          />
        ))}
      </div>
      {state !== 'idle' && (
        <span className="rec-time">{formatTime(seconds)}</span>
      )}
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
