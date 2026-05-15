import { execFile, spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { promisify } from 'util';

const execFileP = promisify(execFile);

const OSA_TIMEOUT_MS = 1500;
const WIN_CMD_TIMEOUT_MS = 1500;

interface MuteSnapshot {
  platform: NodeJS.Platform;
  macWasMuted: boolean | null;
  winWasMuted: boolean | null;
}

// ---------- macOS ----------

async function osascript(script: string): Promise<string> {
  const { stdout } = await execFileP('osascript', ['-e', script], {
    timeout: OSA_TIMEOUT_MS,
  });
  return stdout.trim();
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

// ---------- Windows (Core Audio via persistent PowerShell worker) ----------
//
// We avoid `keybd_event(VK_VOLUME_MUTE)` because it triggers the native
// Windows volume OSD. Instead we call `IAudioEndpointVolume::SetMute` on the
// default render endpoint, which mutes silently — same approach used by apps
// like WhisperFlow, Discord, etc.
//
// PowerShell + Add-Type has a ~200–400ms cold-start, so we spawn a single
// long-lived worker at app start, pre-compile the C# type, and pipe simple
// text commands (`GET` / `MUTE` / `UNMUTE`) over stdin.

const WIN_WORKER_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class BisbiAudio {
    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    private class MMDeviceEnumerator { }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"),
     InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IMMDeviceEnumerator {
        int NotImpl_RegisterEndpointNotificationCallback();
        int NotImpl_UnregisterEndpointNotificationCallback();
        [PreserveSig] int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"),
     InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IMMDevice {
        [PreserveSig] int Activate(ref Guid iid, int clsCtx, IntPtr activationParams,
            [MarshalAs(UnmanagedType.IUnknown)] out object o);
    }

    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"),
     InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IAudioEndpointVolume {
        int f01_RegisterControlChangeNotify();
        int f02_UnregisterControlChangeNotify();
        int f03_GetChannelCount();
        int f04_SetMasterVolumeLevel();
        int f05_SetMasterVolumeLevelScalar();
        int f06_GetMasterVolumeLevel();
        int f07_GetMasterVolumeLevelScalar();
        int f08_SetChannelVolumeLevel();
        int f09_SetChannelVolumeLevelScalar();
        int f10_GetChannelVolumeLevel();
        int f11_GetChannelVolumeLevelScalar();
        [PreserveSig] int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid pguidEventContext);
        [PreserveSig] int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
    }

    private const int eRender = 0;
    private const int eMultimedia = 1;
    private const int CLSCTX_ALL = 23;

    private static IAudioEndpointVolume GetEndpoint() {
        IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumerator());
        IMMDevice device;
        int hr = enumerator.GetDefaultAudioEndpoint(eRender, eMultimedia, out device);
        Marshal.ThrowExceptionForHR(hr);
        Guid iid = typeof(IAudioEndpointVolume).GUID;
        object o;
        hr = device.Activate(ref iid, CLSCTX_ALL, IntPtr.Zero, out o);
        Marshal.ThrowExceptionForHR(hr);
        return (IAudioEndpointVolume)o;
    }

    public static bool GetMute() {
        bool muted;
        Marshal.ThrowExceptionForHR(GetEndpoint().GetMute(out muted));
        return muted;
    }

    public static void SetMute(bool mute) {
        Guid ctx = Guid.Empty;
        Marshal.ThrowExceptionForHR(GetEndpoint().SetMute(mute, ref ctx));
    }
}
"@

[Console]::Out.WriteLine("READY")
[Console]::Out.Flush()

while ($true) {
    $line = [Console]::In.ReadLine()
    if ($null -eq $line) { break }
    $cmd = $line.Trim()
    try {
        switch ($cmd) {
            'GET'    { $m = [BisbiAudio]::GetMute();      [Console]::Out.WriteLine("MUTE=" + $m) }
            'MUTE'   { [BisbiAudio]::SetMute($true);      [Console]::Out.WriteLine("OK") }
            'UNMUTE' { [BisbiAudio]::SetMute($false);     [Console]::Out.WriteLine("OK") }
            'EXIT'   { [Console]::Out.WriteLine("BYE"); [Console]::Out.Flush(); break }
            default  { [Console]::Out.WriteLine("ERR unknown") }
        }
    } catch {
        $msg = $_.Exception.Message -replace "\\r|\\n", ' '
        [Console]::Out.WriteLine("ERR " + $msg)
    }
    [Console]::Out.Flush()
}
`;

interface PendingCommand {
  resolve: (line: string) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}

class WindowsAudioWorker {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private readyPromise: Promise<void> | null = null;
  private queue: PendingCommand[] = [];
  private stdoutBuf = '';
  private starting = false;

  start(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;
    this.starting = true;
    this.readyPromise = new Promise<void>((resolve, reject) => {
      try {
        const proc = spawn(
          'powershell.exe',
          ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', '-'],
          { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }
        );
        this.proc = proc;

        let readySeen = false;
        const onReadyLine = (line: string) => {
          if (readySeen) return;
          if (line === 'READY') {
            readySeen = true;
            this.starting = false;
            resolve();
          } else if (line.startsWith('ERR ')) {
            readySeen = true;
            this.starting = false;
            reject(new Error(line.slice(4)));
          }
        };

        proc.stdout.setEncoding('utf8');
        proc.stdout.on('data', (chunk: string) => {
          this.stdoutBuf += chunk;
          let idx: number;
          while ((idx = this.stdoutBuf.indexOf('\n')) !== -1) {
            const raw = this.stdoutBuf.slice(0, idx).replace(/\r$/, '');
            this.stdoutBuf = this.stdoutBuf.slice(idx + 1);
            if (!readySeen) {
              onReadyLine(raw);
              continue;
            }
            const pending = this.queue.shift();
            if (pending) {
              clearTimeout(pending.timer);
              pending.resolve(raw);
            }
          }
        });

        proc.stderr.setEncoding('utf8');
        proc.stderr.on('data', (chunk: string) => {
          console.warn('[mediaControl] worker stderr:', chunk.trim());
        });

        proc.on('error', (err) => {
          console.warn('[mediaControl] worker error:', err);
          this.teardown(err);
          if (!readySeen) reject(err);
        });

        proc.on('exit', (code, signal) => {
          const err = new Error(`worker exited code=${code} signal=${signal ?? ''}`);
          this.teardown(err);
          if (!readySeen) reject(err);
        });

        // Pipe the script in via stdin so we don't blow out the command-line
        // length limit and don't have to escape quotes for cmd.exe.
        proc.stdin.write(WIN_WORKER_SCRIPT);
        proc.stdin.write('\n');
      } catch (err) {
        this.starting = false;
        reject(err as Error);
      }
    });
    return this.readyPromise;
  }

  private teardown(err: Error): void {
    const queue = this.queue;
    this.queue = [];
    for (const p of queue) {
      clearTimeout(p.timer);
      p.reject(err);
    }
    if (this.proc) {
      try { this.proc.kill(); } catch { /* noop */ }
      this.proc = null;
    }
    this.readyPromise = null;
  }

  async send(cmd: 'GET' | 'MUTE' | 'UNMUTE'): Promise<string> {
    await this.start();
    const proc = this.proc;
    if (!proc) throw new Error('worker not running');
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.queue.findIndex((p) => p.timer === timer);
        if (idx !== -1) this.queue.splice(idx, 1);
        reject(new Error(`mute worker timeout (${cmd})`));
      }, WIN_CMD_TIMEOUT_MS);
      this.queue.push({ resolve, reject, timer });
      try {
        proc.stdin.write(cmd + '\n');
      } catch (err) {
        clearTimeout(timer);
        const idx = this.queue.findIndex((p) => p.timer === timer);
        if (idx !== -1) this.queue.splice(idx, 1);
        reject(err as Error);
      }
    });
  }

  stop(): void {
    if (!this.proc) return;
    try { this.proc.stdin.write('EXIT\n'); } catch { /* noop */ }
    try { this.proc.kill(); } catch { /* noop */ }
    this.proc = null;
    this.readyPromise = null;
    this.starting = false;
  }
}

const winWorker = process.platform === 'win32' ? new WindowsAudioWorker() : null;

export function prewarmMediaControl(): void {
  if (!winWorker) return;
  winWorker.start().catch((err) => {
    console.warn('[mediaControl] prewarm failed:', err);
  });
}

export function shutdownMediaControl(): void {
  if (winWorker) winWorker.stop();
}

async function winGetMuted(): Promise<boolean | null> {
  if (!winWorker) return null;
  try {
    const line = await winWorker.send('GET');
    if (line === 'MUTE=True') return true;
    if (line === 'MUTE=False') return false;
    return null;
  } catch (err) {
    console.warn('[mediaControl] winGetMuted failed:', err);
    return null;
  }
}

async function winSetMuted(muted: boolean): Promise<boolean> {
  if (!winWorker) return false;
  try {
    const line = await winWorker.send(muted ? 'MUTE' : 'UNMUTE');
    return line === 'OK';
  } catch (err) {
    console.warn('[mediaControl] winSetMuted failed:', err);
    return false;
  }
}

// ---------- Public API ----------

export async function muteSystemAudio(): Promise<MuteSnapshot> {
  const snapshot: MuteSnapshot = {
    platform: process.platform,
    macWasMuted: null,
    winWasMuted: null,
  };
  try {
    if (process.platform === 'darwin') {
      const wasMuted = await getMacMuted();
      snapshot.macWasMuted = wasMuted;
      if (wasMuted === false) {
        await setMacMuted(true);
      }
    } else if (process.platform === 'win32') {
      const wasMuted = await winGetMuted();
      snapshot.winWasMuted = wasMuted;
      if (wasMuted === false) {
        await winSetMuted(true);
      }
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
    } else if (snapshot.platform === 'win32') {
      if (snapshot.winWasMuted === false) {
        await winSetMuted(false);
      }
    }
  } catch (err) {
    console.warn('[mediaControl] restoreSystemAudio failed:', err);
  }
}

export type { MuteSnapshot };
