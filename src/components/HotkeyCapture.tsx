import { useEffect, useState } from 'react';

interface Props {
  onCapture: (accelerator: string) => void;
  onCancel: () => void;
}

// Captures a single key combo from the renderer. Returns the accelerator in
// the same string format the backend's `parseAccelerator` understands
// (Modifier+Modifier+Key). Bare modifier presses (e.g. just Right Cmd) are
// recognised as standalone accelerators.
export function HotkeyCapture({ onCapture, onCancel }: Props) {
  const [pressed, setPressed] = useState<string[]>([]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      const accel = buildAccelerator(e);
      if (!accel) return;
      setPressed(accel.split('+'));
      // Bare modifier? Capture immediately on keydown — the keyup of a bare
      // modifier can produce inconsistent metaKey/ctrlKey flags.
      const isBareModifier =
        accel.endsWith('Right') ||
        accel.endsWith('Left') ||
        accel === 'CapsLock';
      if (isBareModifier && !accel.includes('+')) {
        onCapture(accel);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const accel = buildAccelerator(e);
      if (!accel) return;
      // Combo with a non-modifier key: commit on keyup so we capture the full
      // combination the user actually held.
      const parts = accel.split('+');
      const last = parts[parts.length - 1] ?? '';
      const isBareModifier =
        last === 'CapsLock' ||
        last.endsWith('Right') ||
        last.endsWith('Left');
      if (!isBareModifier && parts.length >= 2) {
        onCapture(accel);
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [onCapture, onCancel]);

  return (
    <div className="onb-hotkey-capture">
      <span className="onb-hotkey-capture-pulse" aria-hidden="true" />
      <span className="onb-hotkey-capture-text">
        {pressed.length > 0 ? pressed.join(' + ') : 'Apretá una tecla…'}
      </span>
    </div>
  );
}

function buildAccelerator(e: KeyboardEvent): string | null {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Meta');

  // Detect bare modifier presses by looking at e.code, since e.key is
  // 'Control'/'Meta'/etc. with no left/right info.
  const code = e.code;
  const bareMap: Record<string, string> = {
    ControlLeft: 'CtrlLeft',
    ControlRight: 'CtrlRight',
    AltLeft: 'AltLeft',
    AltRight: 'AltRight',
    MetaLeft: 'MetaLeft',
    MetaRight: 'MetaRight',
    OSLeft: 'MetaLeft',
    OSRight: 'MetaRight',
    ShiftLeft: 'ShiftLeft',
    ShiftRight: 'ShiftRight',
    CapsLock: 'CapsLock',
  };

  if (bareMap[code]) {
    // If a modifier is the *only* key being pressed, return it bare.
    const modifierCount = (e.ctrlKey ? 1 : 0) + (e.altKey ? 1 : 0) + (e.shiftKey ? 1 : 0) + (e.metaKey ? 1 : 0);
    if (modifierCount <= 1 && code !== 'CapsLock') return bareMap[code]!;
    if (code === 'CapsLock' && modifierCount === 0) return 'CapsLock';
  }

  // Non-modifier key: pair with whatever modifiers were active.
  const key = normalizeKey(e);
  if (key && parts.length > 0) {
    return [...parts, key].join('+');
  }
  return null;
}

function normalizeKey(e: KeyboardEvent): string | null {
  const code = e.code;
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('F') && /^F\d{1,2}$/.test(code)) return code;
  const direct: Record<string, string> = {
    Space: 'Space',
    Enter: 'Enter',
    Escape: 'Escape',
    Tab: 'Tab',
    Backspace: 'Backspace',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
  };
  return direct[code] ?? null;
}
