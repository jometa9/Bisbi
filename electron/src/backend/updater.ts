import { app } from 'electron';
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater';

// Fired via `broadcast('updater:state', status)` whenever the state machine
// advances. The renderer mirrors this into the UpdateBanner UI.
export type UpdateStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available'; version: string }
  | {
      kind: 'downloading';
      version: string;
      percent: number;
      bytesPerSecond: number;
      transferred: number;
      total: number;
    }
  | { kind: 'downloaded'; version: string }
  | { kind: 'not-available' }
  | { kind: 'error'; message: string };

const INITIAL_CHECK_DELAY_MS = 15_000;
const PERIODIC_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MANUAL_CHECK_DEBOUNCE_MS = 3_000;
const NOT_AVAILABLE_CLEAR_MS = 5_000;

type Broadcaster = (channel: string, payload?: unknown) => void;

let currentStatus: UpdateStatus = { kind: 'idle' };
let broadcaster: Broadcaster | null = null;
let initialized = false;
let lastManualCheck = 0;
let pendingVersion: string | null = null;

function logUpdater(message: string, err?: unknown): void {
  if (err !== undefined) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[updater] ${message}: ${msg}`);
  } else {
    console.log(`[updater] ${message}`);
  }
}

function setStatus(next: UpdateStatus): void {
  currentStatus = next;
  if (broadcaster) broadcaster('updater:state', currentStatus);
}

export function getUpdateStatus(): UpdateStatus {
  return currentStatus;
}

function triggerCheck(): void {
  if (!app.isPackaged) return;
  autoUpdater.checkForUpdates().catch((err) => {
    logUpdater('checkForUpdates rejected', err);
  });
}

export function initUpdater(broadcast: Broadcaster): void {
  if (initialized) return;
  initialized = true;
  broadcaster = broadcast;

  // electron-updater relies on the packaged `app-update.yml` produced by
  // electron-builder's `publish` config; it is a no-op in dev mode.
  if (!app.isPackaged) {
    logUpdater('disabled: running unpackaged (dev mode)');
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  autoUpdater.on('checking-for-update', () => {
    setStatus({ kind: 'checking' });
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    pendingVersion = info.version;
    setStatus({ kind: 'available', version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    setStatus({ kind: 'not-available' });
    setTimeout(() => {
      if (currentStatus.kind === 'not-available') setStatus({ kind: 'idle' });
    }, NOT_AVAILABLE_CLEAR_MS);
  });

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    setStatus({
      kind: 'downloading',
      version: pendingVersion ?? '',
      percent: Math.max(0, Math.min(100, Math.round(progress.percent))),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    pendingVersion = info.version;
    setStatus({ kind: 'downloaded', version: info.version });
  });

  autoUpdater.on('error', (err: Error) => {
    logUpdater('error', err);
    setStatus({ kind: 'error', message: err?.message || 'Unknown update error' });
  });

  setTimeout(() => triggerCheck(), INITIAL_CHECK_DELAY_MS);
  setInterval(() => triggerCheck(), PERIODIC_CHECK_INTERVAL_MS);
}

export function checkForUpdatesManual(): void {
  if (!app.isPackaged) return;
  const now = Date.now();
  if (now - lastManualCheck < MANUAL_CHECK_DEBOUNCE_MS) return;
  lastManualCheck = now;
  triggerCheck();
}

export function installUpdateAndRestart(): void {
  if (currentStatus.kind !== 'downloaded') return;
  // Defer to next tick so the IPC reply returns before Electron tears down.
  setImmediate(() => {
    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (err) {
      logUpdater('quitAndInstall failed', err);
    }
  });
}
