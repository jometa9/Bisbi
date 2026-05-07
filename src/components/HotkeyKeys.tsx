import { formatHotkeyPart, useHotkeyLabels, type KeyPlatform } from '../lib/hotkey';

export type HotkeyVisualState = 'idle' | 'pressed' | 'lit';

interface Props {
  accel: string;
  platform: KeyPlatform;
  visual?: HotkeyVisualState;
  size?: 'sm' | 'md';
}

export function HotkeyKeys({ accel, platform, visual = 'idle', size = 'md' }: Props) {
  const labels = useHotkeyLabels();
  const parts = accel.split('+').filter(Boolean);
  const stateClass = visual === 'idle' ? '' : ` kbd-${visual}`;
  const sizeClass = size === 'sm' ? ' kbd-sm' : '';
  return (
    <>
      {parts.flatMap((part, i) => {
        const node = (
          <kbd key={`k-${i}`} className={`kbd kbd-${platform}${sizeClass}${stateClass}`}>
            {formatHotkeyPart(part, platform, labels)}
          </kbd>
        );
        if (i === parts.length - 1) return [node];
        return [
          node,
          <span key={`p-${i}`} className="kbd-plus">
            +
          </span>,
        ];
      })}
    </>
  );
}
