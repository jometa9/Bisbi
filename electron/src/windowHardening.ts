import { BrowserWindow, app } from 'electron';

// Locks down a BrowserWindow so the user can't reload, open DevTools, navigate
// away, or open a context menu — making the renderer feel like a native app
// rather than a browser surface. Dev builds keep DevTools available so the
// developer can still debug, but everything else (refresh, navigation, menu)
// is blocked everywhere.
export function hardenWindow(win: BrowserWindow): void {
  const wc = win.webContents;
  const allowDevTools = !app.isPackaged;

  wc.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const key = input.key.toLowerCase();
    const mod = input.control || input.meta;

    // Refresh / reload
    if (
      key === 'f5' ||
      (mod && key === 'r') ||
      (mod && input.shift && key === 'r')
    ) {
      event.preventDefault();
      return;
    }

    // DevTools (blocked in packaged builds only)
    if (!allowDevTools) {
      if (
        key === 'f12' ||
        (mod && input.shift && (key === 'i' || key === 'j' || key === 'c')) ||
        (input.meta && input.alt && (key === 'i' || key === 'j' || key === 'c'))
      ) {
        event.preventDefault();
        return;
      }
    }

    // History navigation
    if (mod && (key === '[' || key === ']')) {
      event.preventDefault();
      return;
    }

    // Zoom shortcuts (optional — they reflow the layout in odd ways)
    if (mod && (key === '+' || key === '-' || key === '=' || key === '0')) {
      event.preventDefault();
      return;
    }
  });

  if (!allowDevTools) {
    wc.on('devtools-opened', () => {
      wc.closeDevTools();
    });
  }

  wc.on('context-menu', (e) => {
    e.preventDefault();
  });

  wc.setWindowOpenHandler(() => ({ action: 'deny' }));

  wc.on('will-navigate', (e, url) => {
    if (url !== wc.getURL()) e.preventDefault();
  });
}
