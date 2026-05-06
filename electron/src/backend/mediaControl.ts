// Mute / restore system output around a recording session so the user's voice
// is not competing with whatever they were playing. Opt-in (see AppSettings).
//
// macOS: read+write the system mute state via `osascript` so we restore the
//   exact previous value instead of toggling blindly.
//
// Windows: PowerShell with user32!keybd_event simulating the VK_VOLUME_MUTE
//   virtual key. This key is a toggle, so we cannot read the prior state from
//   outside Win32; we track our own bookkeeping and only send a second toggle
//   on stop if we sent the first one.

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileP = promisify(execFile);

const OSA_TIMEOUT_MS = 1500;
const PS_TIMEOUT_MS = 2000;

interface MuteSnapshot {
  platform: NodeJS.Platform;
  // macOS: previous mute state. We always restore exactly this.
  macWasMuted: boolean | null;
  // Windows: did we send a Volume Mute? If true, we send another on stop.
  windowsToggled: boolean;
}

async function osascript(script: string): Promise<string> {
  const { stdout } = await execFileP('osascript', ['-e', script], {
    timeout: OSA_TIMEOUT_MS,
  });
  return stdout.trim();
}

// Embed a tiny PowerShell helper that calls user32!keybd_event with the
// supplied virtual-key code (down + up). 0xAD = VK_VOLUME_MUTE.
async function sendWindowsKey(vkHex: string): Promise<void> {
  const ps = [
    "$sig = '[DllImport(\"user32.dll\")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);';",
    "$t = Add-Type -MemberDefinition $sig -Name 'BisbiKb' -Namespace 'BisbiNs' -PassThru;",
    `$t::keybd_event(${vkHex}, 0, 0, 0);`,
    `$t::keybd_event(${vkHex}, 0, 2, 0);`,
  ].join(' ');
  await execFileP(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', ps],
    { timeout: PS_TIMEOUT_MS }
  );
}

async function getMacMuted(): Promise<boolean | null> {
  try {
    const out = await osascript('output muted of (get volume settings)');
    if (out === 'true') return true;
    if (out === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

async function setMacMuted(muted: boolean): Promise<void> {
  try {
    await osascript(`set volume ${muted ? 'with' : 'without'} output muted`);
  } catch (err) {
    console.warn('[mediaControl] setMacMuted failed:', err);
  }
}

export async function muteSystemAudio(): Promise<MuteSnapshot> {
  const snapshot: MuteSnapshot = {
    platform: process.platform,
    macWasMuted: null,
    windowsToggled: false,
  };
  try {
    if (process.platform === 'darwin') {
      const wasMuted = await getMacMuted();
      snapshot.macWasMuted = wasMuted;
      if (wasMuted === false) {
        await setMacMuted(true);
      }
    } else if (process.platform === 'win32') {
      // VK_VOLUME_MUTE is a toggle. We track that we sent it and undo it on stop.
      await sendWindowsKey('0xAD');
      snapshot.windowsToggled = true;
    }
  } catch (err) {
    console.warn('[mediaControl] muteSystemAudio failed:', err);
  }
  return snapshot;
}

export async function restoreSystemAudio(snapshot: MuteSnapshot): Promise<void> {
  try {
    if (snapshot.platform === 'darwin') {
      // Only restore if we actually changed the state. If macWasMuted is null
      // (read failed) we leave the user's audio alone.
      if (snapshot.macWasMuted === false) {
        await setMacMuted(false);
      }
    } else if (snapshot.platform === 'win32' && snapshot.windowsToggled) {
      await sendWindowsKey('0xAD');
    }
  } catch (err) {
    console.warn('[mediaControl] restoreSystemAudio failed:', err);
  }
}

export type { MuteSnapshot };
