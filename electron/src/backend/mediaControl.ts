import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileP = promisify(execFile);

const OSA_TIMEOUT_MS = 1500;
const PS_TIMEOUT_MS = 2000;

interface MuteSnapshot {
  platform: NodeJS.Platform;
  macWasMuted: boolean | null;
  windowsToggled: boolean;
}

async function osascript(script: string): Promise<string> {
  const { stdout } = await execFileP('osascript', ['-e', script], {
    timeout: OSA_TIMEOUT_MS,
  });
  return stdout.trim();
}

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
