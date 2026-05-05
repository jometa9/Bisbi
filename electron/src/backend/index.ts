import { BrowserWindow, ipcMain, app } from 'electron';
import { randomUUID } from 'crypto';
import {
  insertTranscription,
  listTranscriptions,
  deleteTranscription,
  clearTranscriptions,
} from './db';
import { getSettings, updateSettings, resetSettings } from './settings';
import { registerHotkey, unregisterAll } from './hotkey';
import { transcribePcm, checkResources } from './transcriber';
import { deliverText } from './paster';
import {
  initTray,
  setRecordingState as setTrayState,
  destroyTray,
} from './tray';
import {
  showRecordingWindow,
  hideRecordingWindow,
  setState as setRecordingWindowState,
} from './recordingWindow';
import {
  checkForUpdatesManual,
  getUpdateStatus,
  initUpdater,
  installUpdateAndRestart,
} from './updater';
import type { RecordingState, AppSettings, TranscriptionResult } from './types';

interface BackendOptions {
  onOpenSettings: () => void;
  onQuit: () => void;
}

let registered = false;
let recordingState: RecordingState = 'idle';
let activeMainWindowOpener: (() => void) | null = null;

function broadcast(channel: string, payload?: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  }
}

function setRecordingState(next: RecordingState): void {
  recordingState = next;
  setTrayState(next);
  setRecordingWindowState(next);
  broadcast('recording:state', next);
}

function applyHotkey(accelerator: string, onTrigger: () => void): boolean {
  return registerHotkey(accelerator, onTrigger);
}

export async function registerBackend(opts: BackendOptions): Promise<void> {
  if (registered) return;
  registered = true;
  activeMainWindowOpener = opts.onOpenSettings;

  initUpdater(broadcast);

  initTray({
    onOpenSettings: opts.onOpenSettings,
    onShowHistory: () => {
      opts.onOpenSettings();
      broadcast('navigate', { to: '/history' });
    },
    onCheckForUpdates: () => checkForUpdatesManual(),
    onQuit: opts.onQuit,
  });

  const settings = getSettings();
  applyHotkey(settings.hotkey, onHotkeyPressed);

  // ---------- IPC: settings ----------
  ipcMain.handle('settings:get', (): AppSettings => getSettings());
  ipcMain.handle(
    'settings:update',
    (_e, patch: Partial<AppSettings>): AppSettings => {
      const prev = getSettings();
      const next = updateSettings(patch);
      if (patch.hotkey && patch.hotkey !== prev.hotkey) {
        const ok = applyHotkey(next.hotkey, onHotkeyPressed);
        if (!ok) {
          // Revert to previous hotkey if the new one couldn't register.
          const reverted = updateSettings({ hotkey: prev.hotkey });
          applyHotkey(reverted.hotkey, onHotkeyPressed);
          throw new Error(`No se pudo registrar el atajo "${next.hotkey}". Probá otro.`);
        }
      }
      broadcast('settings:changed', next);
      return next;
    }
  );
  ipcMain.handle('settings:reset', (): AppSettings => {
    const next = resetSettings();
    applyHotkey(next.hotkey, onHotkeyPressed);
    broadcast('settings:changed', next);
    return next;
  });

  // ---------- IPC: recording state ----------
  ipcMain.handle('recording:getState', () => recordingState);

  // The renderer captures audio via getUserMedia and sends the raw PCM here
  // when the user toggles the hotkey off.
  ipcMain.handle(
    'recording:submitAudio',
    async (
      _e,
      payload: { pcm: ArrayBuffer; sampleRate: number; channels: number }
    ): Promise<TranscriptionResult> => {
      setRecordingState('transcribing');
      try {
        const buf = Buffer.from(payload.pcm);
        const cfg = getSettings();
        const out = await transcribePcm(buf, payload.sampleRate, payload.channels, {
          language: cfg.language,
        });
        const result: TranscriptionResult = {
          id: randomUUID(),
          text: out.text,
          language: out.language,
          durationMs: out.durationMs,
          createdAt: Date.now(),
        };

        if (out.text) {
          await deliverText(out.text, cfg.pasteMode);
        }
        if (cfg.saveHistory && out.text) {
          insertTranscription({
            id: result.id,
            createdAt: result.createdAt,
            text: result.text,
            language: result.language,
            durationMs: result.durationMs,
            model: 'ggml-base-q5_1',
          });
          broadcast('history:changed');
        }

        return result;
      } catch (err) {
        console.error('[backend] transcription failed:', err);
        throw err;
      } finally {
        setRecordingState('idle');
        hideRecordingWindow();
      }
    }
  );

  ipcMain.handle('recording:cancel', () => {
    setRecordingState('idle');
    hideRecordingWindow();
  });

  // ---------- IPC: history ----------
  ipcMain.handle('history:list', (_e, limit?: number) => listTranscriptions(limit ?? 100));
  ipcMain.handle('history:delete', (_e, id: string) => {
    deleteTranscription(id);
    broadcast('history:changed');
  });
  ipcMain.handle('history:clear', () => {
    clearTranscriptions();
    broadcast('history:changed');
  });

  // ---------- IPC: resources / system ----------
  ipcMain.handle('resources:check', () => checkResources());
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getPlatform', () => process.platform);
  ipcMain.handle('app:openSettings', () => activeMainWindowOpener?.());

  // ---------- IPC: updater ----------
  ipcMain.handle('updater:getState', () => getUpdateStatus());
  ipcMain.handle('updater:check', () => checkForUpdatesManual());
  ipcMain.handle('updater:install', () => installUpdateAndRestart());

  app.on('before-quit', () => {
    unregisterAll();
    destroyTray();
  });
}

function onHotkeyPressed(): void {
  if (recordingState === 'transcribing') return; // ignore while busy
  if (recordingState === 'recording') {
    // Ask the renderer to stop and send the audio buffer.
    broadcast('recording:stop');
    return;
  }
  // Idle → start recording.
  setRecordingState('recording');
  showRecordingWindow('recording');
  broadcast('recording:start');
}
