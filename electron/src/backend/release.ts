import { BrowserWindow, app } from 'electron';

export type ReleaseDownloadUrls = {
  mac: string | null;
  windows: string | null;
  linux: string | null;
};

export type ReleaseInfo = {
  version: string | null;
  downloadUrls: ReleaseDownloadUrls;
};

export type ReleaseState = {
  current: string;
  latest: ReleaseInfo | null;
  hasUpdate: boolean;
  downloadUrl: string | null;
  fetchedAt: number | null;
};

let latest: ReleaseInfo | null = null;
let fetchedAt: number | null = null;

function currentVersion(): string {
  try {
    return app.getVersion();
  } catch {
    return '0.0.0';
  }
}

function platformKey(): keyof ReleaseDownloadUrls {
  if (process.platform === 'darwin') return 'mac';
  if (process.platform === 'win32') return 'windows';
  return 'linux';
}

function parseSemver(v: string): number[] | null {
  const m = v.trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function isStrictlyNewer(latestV: string, currentV: string): boolean {
  const a = parseSemver(latestV);
  const b = parseSemver(currentV);
  if (!a || !b) return latestV.trim() !== currentV.trim();
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return false;
}

export function getReleaseState(): ReleaseState {
  const current = currentVersion();
  const latestVersion = latest?.version ?? null;
  const hasUpdate = !!latestVersion && isStrictlyNewer(latestVersion, current);
  const downloadUrl = latest?.downloadUrls[platformKey()] ?? null;
  return {
    current,
    latest,
    hasUpdate,
    downloadUrl,
    fetchedAt,
  };
}

function broadcastState() {
  const state = getReleaseState();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('release:state', state);
    }
  }
}

function isReleaseInfo(value: unknown): value is ReleaseInfo {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (!('version' in v) || !('downloadUrls' in v)) return false;
  const urls = v.downloadUrls as Record<string, unknown> | null | undefined;
  if (!urls || typeof urls !== 'object') return false;
  return 'mac' in urls && 'windows' in urls && 'linux' in urls;
}

export function captureFromJson(payload: unknown): void {
  if (!payload || typeof payload !== 'object') return;
  const release = (payload as Record<string, unknown>).release;
  if (!isReleaseInfo(release)) return;

  const prev = latest;
  latest = {
    version: release.version,
    downloadUrls: {
      mac: release.downloadUrls.mac ?? null,
      windows: release.downloadUrls.windows ?? null,
      linux: release.downloadUrls.linux ?? null,
    },
  };
  fetchedAt = Date.now();

  const changed =
    !prev ||
    prev.version !== latest.version ||
    prev.downloadUrls.mac !== latest.downloadUrls.mac ||
    prev.downloadUrls.windows !== latest.downloadUrls.windows ||
    prev.downloadUrls.linux !== latest.downloadUrls.linux;

  if (changed) broadcastState();
}
