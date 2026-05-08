import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const appRoot = path.resolve(__dirname, '..', '..');

interface AfterPackContext {
  electronPlatformName: string;
  appOutDir: string;
}

function applyWindowsIcon(appOutDir: string) {
  const exePath = path.join(appOutDir, 'Bisbi.exe');
  if (!fs.existsSync(exePath)) return;
  const icoPath = path.join(appRoot, 'build-resources', 'icon.ico');
  if (!fs.existsSync(icoPath)) return;
  const rceditPath = path.join(appRoot, 'node_modules', 'rcedit', 'bin', 'rcedit.exe');
  if (!fs.existsSync(rceditPath)) return;
  try {
    execSync(`"${rceditPath}" "${exePath}" --set-icon "${icoPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error('afterPack: set icon failed:', err);
  }
}

function ensureWhisperBinaryExecutable(appOutDir: string, platformName: string) {
  // electron-builder copies extraResources but loses the executable bit on
  // POSIX targets when the source tree was checked out without it.
  if (platformName === 'win32') return;
  const candidates = [
    path.join(appOutDir, 'Bisbi.app', 'Contents', 'Resources', 'whisper'),
    path.join(appOutDir, 'resources', 'whisper'),
  ];
  for (const root of candidates) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const bin = path.join(root, entry.name, 'whisper-cli');
      if (fs.existsSync(bin)) {
        try { fs.chmodSync(bin, 0o755); } catch (err) {
          console.error(`afterPack: chmod ${bin} failed:`, err);
        }
      }
    }
  }
}

async function afterPack(context: AfterPackContext) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName === 'win32') {
    try { applyWindowsIcon(appOutDir); } catch (err) { console.error('afterPack: Windows icon application failed:', err); }
  }
  ensureWhisperBinaryExecutable(appOutDir, electronPlatformName);
}

export = afterPack;
