import { useEffect, useRef, type CSSProperties } from 'react';

interface Props {
  level: number;
  active: boolean;
  bars?: number;
}

// Lightweight bar visualizer driven by the same RMS-based level the recording
// pipeline already publishes. A short ring buffer per bar gives the eye
// something to track even when the user's voice is fairly steady.
export function Waveform({ level, active, bars = 28 }: Props) {
  const buffer = useRef<number[]>(Array(bars).fill(0));
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    buffer.current = [...buffer.current.slice(1), active ? Math.min(1, level) : 0];
    const el = containerRef.current;
    if (!el) return;
    const children = el.children;
    for (let i = 0; i < children.length; i++) {
      const target = buffer.current[i] ?? 0;
      const eased = Math.pow(target, 0.65);
      (children[i] as HTMLElement).style.transform = `scaleY(${Math.max(0.06, eased)})`;
    }
  }, [level, active, bars]);

  const style: CSSProperties = active ? {} : { opacity: 0.4 };

  return (
    <div ref={containerRef} className="onb-waveform" style={style} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className="onb-waveform-bar" />
      ))}
    </div>
  );
}
