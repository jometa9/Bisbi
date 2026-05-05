import { useEffect, useRef, useState } from 'react';
import type { RecordingState } from './types';

const BARS = 12;
const FALLOFF = 0.78;
// Adaptive gain: the peak follows the recent loudness so bars look proportional
// regardless of whether the user speaks softly or loudly.
const MIN_PEAK = 0.04;     // noise floor — silence stays tiny, doesn't get amplified
const PEAK_ATTACK = 0.6;   // how fast peak rises toward a louder value (0–1)
const PEAK_DECAY = 0.992;  // per-tick decay (~30s half-life at 60ms tick)

export function RecordingApp() {
  const [state, setState] = useState<RecordingState>('recording');
  const [bars, setBars] = useState<number[]>(() => new Array(BARS).fill(0));
  const [seconds, setSeconds] = useState(0);
  const lastLevelRef = useRef(0);
  const peakRef = useRef(MIN_PEAK);

  useEffect(() => {
    if (!window.bisbi) return;
    const offState = window.bisbi.onPillState(setState);
    const offLevel = window.bisbi.onRecordingLevel((level) => {
      lastLevelRef.current = level;
    });
    return () => {
      offState();
      offLevel();
    };
  }, []);

  useEffect(() => {
    if (state !== 'recording') {
      peakRef.current = MIN_PEAK;
      return;
    }
    const id = window.setInterval(() => {
      setBars((prev) => {
        const next = prev.slice(1);
        const v = lastLevelRef.current;
        lastLevelRef.current = v * FALLOFF;
        const decayed = Math.max(MIN_PEAK, peakRef.current * PEAK_DECAY);
        peakRef.current = v > decayed ? decayed + (v - decayed) * PEAK_ATTACK : decayed;
        next.push(Math.min(1, v / peakRef.current));
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
