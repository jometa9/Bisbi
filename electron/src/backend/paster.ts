import { clipboard } from 'electron';
import { spawn } from 'child_process';

export async function deliverText(text: string): Promise<void> {
  if (!text) return;
  clipboard.writeText(text);
  // Small delay so the OS clipboard is ready before the synthetic paste fires.
  await sleep(60);
  await simulatePaste();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function simulatePaste(): Promise<void> {
  if (process.platform === 'darwin') return pasteMac();
  if (process.platform === 'win32') return pasteWin();
  if (process.platform === 'linux') return pasteLinux();
  return Promise.resolve();
}

function pasteMac(): Promise<void> {
  return run('osascript', [
    '-e',
    'tell application "System Events" to keystroke "v" using command down',
  ]);
}

function pasteWin(): Promise<void> {
  // PowerShell SendKeys: ^v = Ctrl+V. Avoid -Command parsing surprises by
  // passing the script via -EncodedCommand-friendly inline text.
  const script = "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')";
  return run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]);
}

function pasteLinux(): Promise<void> {
  // Try xdotool first (X11), fall back to wtype (Wayland) silently.
  return run('xdotool', ['key', '--clearmodifiers', 'ctrl+v']).catch(() =>
    run('wtype', ['-M', 'ctrl', 'v'])
  );
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}
