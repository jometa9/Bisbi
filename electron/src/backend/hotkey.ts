import { globalShortcut } from 'electron';

type HotkeyHandler = () => void;

let registered: string | null = null;
let activeHandler: HotkeyHandler | null = null;

export function registerHotkey(accelerator: string, handler: HotkeyHandler): boolean {
  unregisterHotkey();
  try {
    const ok = globalShortcut.register(accelerator, () => {
      activeHandler?.();
    });
    if (!ok) return false;
    registered = accelerator;
    activeHandler = handler;
    return true;
  } catch (err) {
    console.error('[hotkey] register failed:', err);
    return false;
  }
}

export function unregisterHotkey(): void {
  if (registered) {
    try {
      globalShortcut.unregister(registered);
    } catch {}
    registered = null;
  }
  activeHandler = null;
}

export function unregisterAll(): void {
  globalShortcut.unregisterAll();
  registered = null;
  activeHandler = null;
}

export function getRegistered(): string | null {
  return registered;
}
