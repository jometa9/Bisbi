import { BrowserWindow } from 'electron';

export const PROTOCOL = 'bisbi';

// A pending URL is set when the deep link arrives before the renderer is
// ready to receive it (e.g. macOS open-url before the window is created, or
// Windows launching the app fresh from the protocol). The renderer fetches
// it via IPC on mount and clears it once consumed.
let pendingUrl: string | null = null;

type WindowGetter = () => BrowserWindow | null;
let getMainWindow: WindowGetter = () => null;

export function setMainWindowGetter(getter: WindowGetter): void {
  getMainWindow = getter;
}

export function findProtocolUrl(args: readonly string[]): string | null {
  for (const arg of args) {
    if (typeof arg === 'string' && arg.toLowerCase().startsWith(`${PROTOCOL}://`)) {
      return arg;
    }
  }
  return null;
}

export function handleDeepLink(url: string): void {
  pendingUrl = url;
  const win = getMainWindow();
  if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    win.webContents.send('deep-link', { url });
  }
}

export function getPendingDeepLink(): string | null {
  return pendingUrl;
}

export function clearPendingDeepLink(url?: string): void {
  if (!url || pendingUrl === url) pendingUrl = null;
}
