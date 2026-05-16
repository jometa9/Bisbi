import { BrowserWindow } from 'electron';
import { getAppVersion } from './appVersion';

export type ReleaseDownloadUrls = {
  mac: string | null;
  windows: string | null;
  linux: string | null;
};

export type ReleaseInfo = {
  version: string | null;
  downloadUrls: ReleaseDownloadUrls;
  htmlUrl: string | null;
};

export type ReleaseState = {
  current: string;
  latest: ReleaseInfo | null;
  hasUpdate: boolean;
  downloadUrl: string | null;
  fetchedAt: number | null;
};

const GITHUB_OWNER = 'jometa9';
const GITHUB_REPO = 'Bisbi';
const LATEST_RELEASE_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const POLL_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 h

let latest: ReleaseInfo | null = null;
let fetchedAt: number | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function currentVersion(): string {
  return getAppVersion();
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

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name?: string;
  name?: string;
  html_url?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: GitHubAsset[];
}

function pickAssetUrl(assets: GitHubAsset[], matchers: RegExp[]): string | null {
  for (const re of matchers) {
    const hit = assets.find((a) => re.test(a.name));
    if (hit) return hit.browser_download_url;
  }
  return null;
}

function parseGitHubRelease(payload: GitHubRelease): ReleaseInfo | null {
  if (!payload || payload.draft || payload.prerelease) return null;
  const tag = (payload.tag_name ?? payload.name ?? '').toString();
  if (!tag) return null;
  const assets = Array.isArray(payload.assets) ? payload.assets : [];
  return {
    version: tag.replace(/^v/i, ''),
    htmlUrl: payload.html_url ?? null,
    downloadUrls: {
      // electron-builder default DMG artifact is e.g. Bisbi-Setup.dmg.
      mac: pickAssetUrl(assets, [/\.dmg$/i, /mac.*\.zip$/i]),
      windows: pickAssetUrl(assets, [/\.exe$/i, /win.*\.zip$/i]),
      linux: pickAssetUrl(assets, [/\.AppImage$/i, /\.tar\.gz$/i, /\.deb$/i]),
    },
  };
}

export async function fetchLatestRelease(): Promise<void> {
  try {
    const resp = await fetch(LATEST_RELEASE_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': `Bisbi/${currentVersion()}`,
      },
    });
    if (!resp.ok) {
      console.warn(`[release] github fetch failed: ${resp.status}`);
      return;
    }
    const payload = (await resp.json()) as GitHubRelease;
    const info = parseGitHubRelease(payload);
    if (!info) return;
    const prev = latest;
    latest = info;
    fetchedAt = Date.now();
    const changed =
      !prev ||
      prev.version !== info.version ||
      prev.downloadUrls.mac !== info.downloadUrls.mac ||
      prev.downloadUrls.windows !== info.downloadUrls.windows ||
      prev.downloadUrls.linux !== info.downloadUrls.linux;
    if (changed) broadcastState();
  } catch (err) {
    console.warn('[release] github fetch error:', err instanceof Error ? err.message : String(err));
  }
}

export function startReleasePolling(): void {
  if (pollTimer) return;
  void fetchLatestRelease();
  pollTimer = setInterval(() => {
    void fetchLatestRelease();
  }, POLL_INTERVAL_MS);
}

export function stopReleasePolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
