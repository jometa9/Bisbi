// Global hotkey handling backed by uiohook-napi so we can observe both
// keydown and keyup. Electron's `globalShortcut` only fires once on press,
// which is not enough for push-to-talk or double-tap detection.
//
// macOS note: uiohook-napi requires Accessibility permission. Without it
// keydown/keyup events never arrive. Bisbi prompts for it the first time
// the hook starts.
import { uIOhook, UiohookKey } from 'uiohook-napi';

export interface HotkeyConfig {
  accelerator: string;
  // When true: tap to start, tap to stop. When false: hold to record (push-
  // to-talk), and a quick double-tap locks the current session so the user
  // can release the key while recording continues.
  handsFreeMode: boolean;
}

export interface HotkeyCallbacks {
  onStartRecording: () => void;
  onStopRecording: () => void;
}

interface ParsedAccelerator {
  raw: string;
  keycode: number;
  modifiers: { ctrl: boolean; alt: boolean; shift: boolean; meta: boolean };
  // True when the accelerator IS a bare modifier (e.g. "AltRight" alone).
  // We then accept it without requiring extra modifier flags.
  bareModifier: boolean;
}

// libuiohook exposes the macOS Fn key as VC_FUNCTION (0x0E36). It isn't in
// uiohook-napi's UiohookKey map but events still carry the keycode, so we
// recognize it by number. Outside macOS Fn rarely surfaces as a keycode.
const VC_FUNCTION = 0x0e36;

const KEY_TOKEN_MAP: Record<string, number> = {
  // Letters and digits
  ...Object.fromEntries(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      .split('')
      .map((l) => [l, (UiohookKey as Record<string, number>)[l]])
  ),
  ...Object.fromEntries(
    '0123456789'.split('').map((d) => [d, (UiohookKey as Record<string, number>)[d]])
  ),
  // Function row
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
  // Bare modifier keys (used standalone, not as modifier flags)
  Fn: VC_FUNCTION,
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
  'Fn',
  'AltRight',
  'AltLeft',
  'CtrlRight',
  'CtrlLeft',
  'ShiftRight',
  'ShiftLeft',
  'MetaRight',
  'MetaLeft',
]);

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
        // Last non-modifier wins; we don't support multi-key accelerators.
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
  // For bare modifier accelerators (e.g. "AltRight" alone) we don't compare
  // modifier flags — pressing the key itself toggles its own flag and we
  // don't want to require it to be pressed in addition to itself.
  if (parsed.bareModifier) return true;
  return (
    e.ctrlKey === parsed.modifiers.ctrl &&
    e.altKey === parsed.modifiers.alt &&
    e.shiftKey === parsed.modifiers.shift &&
    e.metaKey === parsed.modifiers.meta
  );
}

// Push-to-talk timing. After a short tap (release within TAP_THRESHOLD_MS)
// we delay the stop by DOUBLE_TAP_GRACE_MS waiting for a second press; if
// that press arrives we promote the session to "locked" and skip the stop.
const TAP_THRESHOLD_MS = 250;
const DOUBLE_TAP_GRACE_MS = 280;

type Mode = 'idle' | 'ptt' | 'locked';

interface RuntimeState {
  parsed: ParsedAccelerator;
  cfg: HotkeyConfig;
  cb: HotkeyCallbacks;
  mode: Mode;
  keyHeld: boolean;
  pressStartedAt: number;
  pendingStopTimer: NodeJS.Timeout | null;
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
  if (!eventMatches(state.parsed, e)) return;
  // libuiohook fires keydown on auto-repeat; ignore until we see a keyup.
  if (state.keyHeld) return;
  state.keyHeld = true;
  state.pressStartedAt = Date.now();
  handlePress();
}

function onKeyup(e: UiohookEvent): void {
  if (!state) return;
  // Bare-modifier hotkeys (e.g. Fn, AltRight) get a keyup event whose
  // modifier-flag values can differ from keydown, so match purely on
  // keycode for the release.
  if (e.keycode !== state.parsed.keycode) return;
  if (!state.keyHeld) return;
  state.keyHeld = false;
  handleRelease();
}

function handlePress(): void {
  if (!state) return;
  const s = state;

  if (s.cfg.handsFreeMode) {
    // Toggle: tap to start, tap to stop.
    if (s.mode === 'idle') {
      s.mode = 'locked';
      s.cb.onStartRecording();
    } else {
      s.mode = 'idle';
      s.cb.onStopRecording();
    }
    return;
  }

  // Push-to-talk
  if (s.mode === 'idle') {
    s.mode = 'ptt';
    s.cb.onStartRecording();
    return;
  }
  if (s.mode === 'ptt') {
    // We get here only when a short release scheduled a deferred stop and
    // the second press arrived inside the grace window — a double-tap.
    // Promote the live session to locked instead of stopping.
    if (s.pendingStopTimer) {
      clearTimeout(s.pendingStopTimer);
      s.pendingStopTimer = null;
    }
    s.mode = 'locked';
    return;
  }
  if (s.mode === 'locked') {
    // Second tap of a locked session ends it.
    s.mode = 'idle';
    s.cb.onStopRecording();
  }
}

function handleRelease(): void {
  if (!state) return;
  const s = state;
  if (s.cfg.handsFreeMode) return; // releases ignored in hands-free mode
  if (s.mode !== 'ptt') return; // 'locked' ignores release; 'idle' shouldn't happen

  const heldFor = Date.now() - s.pressStartedAt;
  if (heldFor >= TAP_THRESHOLD_MS) {
    // User held the key — straightforward push-to-talk.
    s.mode = 'idle';
    s.cb.onStopRecording();
    return;
  }
  // Short tap: defer the stop so a second press inside the grace window
  // can promote the session to locked.
  if (s.pendingStopTimer) clearTimeout(s.pendingStopTimer);
  s.pendingStopTimer = setTimeout(() => {
    if (!state) return;
    state.pendingStopTimer = null;
    if (state.mode === 'ptt') {
      state.mode = 'idle';
      state.cb.onStopRecording();
    }
  }, DOUBLE_TAP_GRACE_MS);
}

export function registerHotkey(cfg: HotkeyConfig, cb: HotkeyCallbacks): boolean {
  const parsed = parseAccelerator(cfg.accelerator);
  if (!parsed) {
    console.warn('[hotkey] unable to parse accelerator:', cfg.accelerator);
    return false;
  }
  // Reset any pending state from a previous registration.
  if (state?.pendingStopTimer) clearTimeout(state.pendingStopTimer);
  state = {
    parsed,
    cfg,
    cb,
    mode: 'idle',
    keyHeld: false,
    pressStartedAt: 0,
    pendingStopTimer: null,
  };
  ensureHookStarted();
  return true;
}

export function unregisterHotkey(): void {
  if (state?.pendingStopTimer) clearTimeout(state.pendingStopTimer);
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
