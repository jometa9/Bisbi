import { uIOhook, UiohookKey } from 'uiohook-napi';

export interface HotkeyConfig {
  accelerator: string;
  handsFreeMode: boolean;
}

export interface HotkeyCallbacks {
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
}

interface ParsedAccelerator {
  raw: string;
  keycode: number;
  modifiers: { ctrl: boolean; alt: boolean; shift: boolean; meta: boolean };
  bareModifier: boolean;
}

const KEY_TOKEN_MAP: Record<string, number> = {
  ...Object.fromEntries(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      .split('')
      .map((l) => [l, (UiohookKey as Record<string, number>)[l]])
  ),
  ...Object.fromEntries(
    '0123456789'.split('').map((d) => [d, (UiohookKey as Record<string, number>)[d]])
  ),
  ...Object.fromEntries(
    Array.from({ length: 24 }, (_, i) => [
      `F${i + 1}`,
      (UiohookKey as Record<string, number>)[`F${i + 1}`],
    ])
  ),
  Space: UiohookKey.Space,
  Enter: UiohookKey.Enter,
  Escape: UiohookKey.Escape,
  Tab: UiohookKey.Tab,
  Backspace: UiohookKey.Backspace,
  Delete: UiohookKey.Delete,
  Up: UiohookKey.ArrowUp,
  Down: UiohookKey.ArrowDown,
  Left: UiohookKey.ArrowLeft,
  Right: UiohookKey.ArrowRight,
  Home: UiohookKey.Home,
  End: UiohookKey.End,
  PageUp: UiohookKey.PageUp,
  PageDown: UiohookKey.PageDown,
  CapsLock: UiohookKey.CapsLock,
  AltRight: UiohookKey.AltRight,
  AltLeft: UiohookKey.Alt,
  CtrlRight: UiohookKey.CtrlRight,
  CtrlLeft: UiohookKey.Ctrl,
  ShiftRight: UiohookKey.ShiftRight,
  ShiftLeft: UiohookKey.Shift,
  MetaRight: UiohookKey.MetaRight,
  MetaLeft: UiohookKey.Meta,
};

const BARE_MODIFIER_TOKENS = new Set([
  'AltRight',
  'AltLeft',
  'CtrlRight',
  'CtrlLeft',
  'ShiftRight',
  'ShiftLeft',
  'MetaRight',
  'MetaLeft',
]);

const MODIFIER_SIBLING: Partial<Record<number, number>> = {
  [UiohookKey.Ctrl]:       UiohookKey.CtrlRight,
  [UiohookKey.CtrlRight]:  UiohookKey.Ctrl,
  [UiohookKey.Alt]:        UiohookKey.AltRight,
  [UiohookKey.AltRight]:   UiohookKey.Alt,
  [UiohookKey.Shift]:      UiohookKey.ShiftRight,
  [UiohookKey.ShiftRight]: UiohookKey.Shift,
  [UiohookKey.Meta]:       UiohookKey.MetaRight,
  [UiohookKey.MetaRight]:  UiohookKey.Meta,
};

function parseAccelerator(accel: string): ParsedAccelerator | null {
  const parts = accel.split('+').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const modifiers = { ctrl: false, alt: false, shift: false, meta: false };
  let key: string | null = null;

  for (const part of parts) {
    switch (part) {
      case 'Ctrl':
      case 'Control':
        modifiers.ctrl = true;
        break;
      case 'Alt':
      case 'Option':
        modifiers.alt = true;
        break;
      case 'Shift':
        modifiers.shift = true;
        break;
      case 'Cmd':
      case 'Command':
      case 'Meta':
      case 'Super':
        modifiers.meta = true;
        break;
      default:
        key = part;
    }
  }

  if (!key) return null;
  const keycode = KEY_TOKEN_MAP[key];
  if (typeof keycode !== 'number') return null;

  return {
    raw: accel,
    keycode,
    modifiers,
    bareModifier: BARE_MODIFIER_TOKENS.has(key) && !hasAnyModifier(modifiers),
  };
}

function hasAnyModifier(m: ParsedAccelerator['modifiers']): boolean {
  return m.ctrl || m.alt || m.shift || m.meta;
}

interface UiohookEvent {
  keycode: number;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

function eventMatches(parsed: ParsedAccelerator, e: UiohookEvent): boolean {
  if (e.keycode !== parsed.keycode) return false;
  if (parsed.bareModifier) return true;
  return (
    e.ctrlKey === parsed.modifiers.ctrl &&
    e.altKey === parsed.modifiers.alt &&
    e.shiftKey === parsed.modifiers.shift &&
    e.metaKey === parsed.modifiers.meta
  );
}

type Mode = 'idle' | 'recording';

interface RuntimeState {
  parsed: ParsedAccelerator;
  cfg: HotkeyConfig;
  cb: HotkeyCallbacks;
  mode: Mode;
  keyHeld: boolean;
  pressStartedAt: number;
}

let state: RuntimeState | null = null;
let hookStarted = false;
let listenersAttached = false;

function ensureHookStarted(): void {
  if (hookStarted) return;
  if (!listenersAttached) {
    uIOhook.on('keydown', onKeydown);
    uIOhook.on('keyup', onKeyup);
    listenersAttached = true;
  }
  try {
    uIOhook.start();
    hookStarted = true;
  } catch (err) {
    console.error('[hotkey] uIOhook.start failed:', err);
  }
}

function onKeydown(e: UiohookEvent): void {
  if (!state) return;
  console.log('[hotkey] uiohook keydown keycode=', e.keycode, 'ctrl=', e.ctrlKey, 'alt=', e.altKey, 'shift=', e.shiftKey, 'meta=', e.metaKey, '| target keycode=', state.parsed.keycode, 'bareMod=', state.parsed.bareModifier);
  if (
    e.keycode === UiohookKey.Escape &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.shiftKey &&
    !e.metaKey &&
    state.parsed.keycode !== UiohookKey.Escape &&
    state.mode !== 'idle'
  ) {
    state.mode = 'idle';
    state.cb.onCancelRecording();
    return;
  }
  if (!eventMatches(state.parsed, e)) return;
  if (state.keyHeld) return;
  state.keyHeld = true;
  state.pressStartedAt = Date.now();
  console.log('[hotkey] -> handlePress');
  handlePress();
}

const SYNTHETIC_KEYUP_GUARD_MS = 60;

function onKeyup(e: UiohookEvent): void {
  if (!state) return;
  console.log('[hotkey] uiohook KEYUP keycode=', e.keycode, '| target keycode=', state.parsed.keycode, 'keyHeld=', state.keyHeld, 'sincePress=', Date.now() - state.pressStartedAt, 'ms');
  const isTarget =
    e.keycode === state.parsed.keycode ||
    (state.parsed.bareModifier && MODIFIER_SIBLING[state.parsed.keycode] === e.keycode);
  if (!isTarget) { console.log('[hotkey] keyup ignored: not target'); return; }
  if (!state.keyHeld) { console.log('[hotkey] keyup ignored: not held'); return; }
  if (Date.now() - state.pressStartedAt < SYNTHETIC_KEYUP_GUARD_MS) { console.log('[hotkey] keyup ignored: synthetic guard'); return; }
  state.keyHeld = false;
  console.log('[hotkey] -> handleRelease');
  handleRelease();
}

function handlePress(): void {
  if (!state) return;
  const s = state;

  // Hands-free: each press toggles recording on/off.
  if (s.cfg.handsFreeMode) {
    if (s.mode === 'idle') {
      s.mode = 'recording';
      s.cb.onStartRecording();
    } else {
      s.mode = 'idle';
      s.cb.onStopRecording();
    }
    return;
  }

  // Push-to-talk: press starts, release stops.
  if (s.mode === 'idle') {
    s.mode = 'recording';
    s.cb.onStartRecording();
  }
}

function handleRelease(): void {
  if (!state) return;
  const s = state;
  if (s.cfg.handsFreeMode) return;
  if (s.mode !== 'recording') return;
  s.mode = 'idle';
  s.cb.onStopRecording();
}

export function registerHotkey(cfg: HotkeyConfig, cb: HotkeyCallbacks): boolean {
  const parsed = parseAccelerator(cfg.accelerator);
  if (!parsed) {
    console.warn('[hotkey] unable to parse accelerator:', cfg.accelerator);
    return false;
  }
  state = {
    parsed,
    cfg,
    cb,
    mode: 'idle',
    keyHeld: false,
    pressStartedAt: 0,
  };
  ensureHookStarted();
  return true;
}

export function unregisterHotkey(): void {
  state = null;
}

export function unregisterAll(): void {
  unregisterHotkey();
  if (hookStarted) {
    try {
      uIOhook.stop();
    } catch {}
    hookStarted = false;
  }
}

export function getRegistered(): string | null {
  return state?.parsed.raw ?? null;
}

export function notifyExternalKeyup(): void {
  if (!state) return;
  if (!state.keyHeld) return;
  state.keyHeld = false;
  handleRelease();
}

// Same idea for keydown — needed for hands-free toggle when uiohook misses
// the second press because the app has foreground focus.
export function notifyExternalKeydown(): void {
  if (!state) return;
  if (state.keyHeld) return;
  state.keyHeld = true;
  state.pressStartedAt = Date.now();
  handlePress();
}
