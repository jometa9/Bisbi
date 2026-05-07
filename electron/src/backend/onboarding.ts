import { app, systemPreferences, shell, globalShortcut } from 'electron';
import fs from 'fs';
import path from 'path';

export type OnboardingStep = 1 | 2 | 3 | 4;

export interface OnboardingState {
  completed: boolean;
  lastStep: OnboardingStep;
}

const STATE_FILE = 'onboarding-state.json';
const DEFAULT_STATE: OnboardingState = { completed: false, lastStep: 1 };

function statePath(): string {
  return path.join(app.getPath('userData'), STATE_FILE);
}

let cached: OnboardingState | null = null;

export function getOnboardingState(): OnboardingState {
  if (cached) return cached;
  try {
    const raw = fs.readFileSync(statePath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    cached = {
      completed: parsed.completed === true,
      lastStep:
        parsed.lastStep === 1 ||
        parsed.lastStep === 2 ||
        parsed.lastStep === 3 ||
        parsed.lastStep === 4 ||
        parsed.lastStep === 5
          ? parsed.lastStep
          : 1,
    };
  } catch {
    cached = { ...DEFAULT_STATE };
  }
  return cached;
}

export function setOnboardingState(patch: Partial<OnboardingState>): OnboardingState {
  const current = getOnboardingState();
  const next: OnboardingState = { ...current, ...patch };
  cached = next;
  try {
    fs.writeFileSync(statePath(), JSON.stringify(next, null, 2), 'utf8');
  } catch {}
  return next;
}

export interface PermissionStatus {
  microphone: 'granted' | 'denied' | 'unknown';
  accessibility: 'granted' | 'denied' | 'unknown' | 'not-applicable';
}

export function getPermissionStatus(): PermissionStatus {
  const platform = process.platform;
  if (platform === 'darwin') {
    const mic = systemPreferences.getMediaAccessStatus('microphone');
    const micStatus: PermissionStatus['microphone'] =
      mic === 'granted' ? 'granted' : mic === 'denied' || mic === 'restricted' ? 'denied' : 'unknown';
    const a11y = systemPreferences.isTrustedAccessibilityClient(false);
    return {
      microphone: micStatus,
      accessibility: a11y ? 'granted' : 'denied',
    };
  }
  if (platform === 'win32') {
    const mic = systemPreferences.getMediaAccessStatus('microphone');
    const micStatus: PermissionStatus['microphone'] =
      mic === 'granted' ? 'granted' : mic === 'denied' || mic === 'restricted' ? 'denied' : 'unknown';
    return { microphone: micStatus, accessibility: 'not-applicable' };
  }
  return { microphone: 'unknown', accessibility: 'not-applicable' };
}

export async function requestMicrophonePermission(): Promise<boolean> {
  if (process.platform === 'darwin') {
    try {
      return await systemPreferences.askForMediaAccess('microphone');
    } catch {
      return false;
    }
  }
  return getPermissionStatus().microphone === 'granted';
}

export function requestAccessibilityPermission(): boolean {
  if (process.platform !== 'darwin') return true;
  return systemPreferences.isTrustedAccessibilityClient(true);
}

export async function openSystemSettingsFor(
  pane: 'microphone' | 'accessibility'
): Promise<void> {
  if (process.platform === 'darwin') {
    const url =
      pane === 'microphone'
        ? 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone'
        : 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility';
    await shell.openExternal(url);
    return;
  }
  if (process.platform === 'win32') {
    if (pane === 'microphone') {
      await shell.openExternal('ms-settings:privacy-microphone');
    }
    return;
  }
}

export function validateHotkey(accelerator: string): { ok: boolean; reason?: string } {
  if (!accelerator || typeof accelerator !== 'string') {
    return { ok: false, reason: 'empty' };
  }
  const BARE = new Set([
    'AltRight',
    'AltLeft',
    'CtrlRight',
    'CtrlLeft',
    'ShiftRight',
    'ShiftLeft',
    'MetaRight',
    'MetaLeft',
    'CapsLock',
    'Fn',
  ]);
  if (BARE.has(accelerator)) return { ok: true };

  try {
    const wasRegistered = globalShortcut.isRegistered(accelerator);
    if (wasRegistered) return { ok: false, reason: 'inUse' };
    const registered = globalShortcut.register(accelerator, () => {});
    if (!registered) return { ok: false, reason: 'invalid' };
    globalShortcut.unregister(accelerator);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
