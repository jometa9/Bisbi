import { clipboard } from 'electron';
import { spawn } from 'child_process';

export async function deliverText(text: string): Promise<void> {
  if (!text) return;
  clipboard.writeText(text);
  // Pasting text into Finder (macOS 26+) creates a new text file instead of
  // doing nothing, so leave the text on the clipboard and skip the paste.
  if (process.platform === 'darwin' && (await isFinderFrontmost())) return;
  await sleep(60);
  await simulatePaste();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function simulatePaste(): Promise<void> {
  if (process.platform === 'darwin') return pasteMac();
  if (process.platform === 'win32') return pasteWin();
  return Promise.resolve();
}

function isFinderFrontmost(): Promise<boolean> {
  return new Promise((resolve) => {
    let out = '';
    const child = spawn(
      'osascript',
      ['-e', 'tell application "System Events" to get name of first application process whose frontmost is true'],
      { stdio: ['ignore', 'pipe', 'ignore'] }
    );
    child.stdout?.on('data', (d) => (out += d));
    child.on('error', () => resolve(false));
    child.on('close', () => resolve(out.trim() === 'Finder'));
  });
}

function pasteMac(): Promise<void> {
  return run('osascript', [
    '-e',
    'tell application "System Events" to keystroke "v" using command down',
  ]);
}

function pasteWin(): Promise<void> {
  const script = "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')";
  return run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]);
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
