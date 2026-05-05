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
  setLevel as setRecordingWindowLevel,
} from './recordingWindow';
import {
  checkForUpdatesManual,
  getUpdateStatus,
  initUpdater,
  installUpdateAndRestart,
} from './updater';
import { getSystemLocale, resolveUiLanguage, tBackend } from './i18n';
import { rebuildTrayLabels } from './tray';
import type { RecordingState, AppSettings, TranscriptionResult } from './types';

interface BackendOptions {
  onOpenSettings: () => void;
  onQuit: () => void;
}

let registered = false;
let recordingState: RecordingState = 'idle';
let activeMainWindowOpener: (() => void) | null = null;

// Recording state is split from transcription work so the user can start a
// new recording while a previous one is still being transcribed. Jobs run
// serially in the order they were captured (FIFO) so pasted output keeps
// the user's intended sequence even when later clips are shorter and would
// otherwise finish first.
let isRecording = false;
let workerRunning = false;
interface TranscriptionJob {
  pcm: Buffer;
  sampleRate: number;
  channels: number;
}
const transcriptionQueue: TranscriptionJob[] = [];

function broadcast(channel: string, payload?: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  }
}

function computeState(): RecordingState {
  if (isRecording) return 'recording';
  if (workerRunning || transcriptionQueue.length > 0) return 'transcribing';
  return 'idle';
}

function syncState(): void {
  const next = computeState();
  if (next === recordingState) return;
  recordingState = next;
  setTrayState(next);
  setRecordingWindowState(next);
  broadcast('recording:state', next);
  if (next === 'idle') {
    hideRecordingWindow();
  }
}

async function processQueue(): Promise<void> {
  if (workerRunning) return;
  workerRunning = true;
  syncState();
  try {
    while (transcriptionQueue.length > 0) {
      const job = transcriptionQueue.shift()!;
      try {
        const cfg = getSettings();
        const out = await transcribePcm(job.pcm, job.sampleRate, job.channels, {
          language: cfg.language,
          precision: cfg.precision,
        });
        const meaningful = out.text.replace(/\s/g, '').length >= 2;
        if (meaningful) {
          await deliverText(out.text, cfg.pasteMode);
        }
        if (cfg.saveHistory && meaningful) {
          insertTranscription({
            id: randomUUID(),
            createdAt: Date.now(),
            text: out.text,
            language: out.language,
            durationMs: out.durationMs,
            model: out.modelFile.replace(/\.bin$/, ''),
          });
          broadcast('history:changed');
        }
      } catch (err) {
        console.error('[backend] transcription job failed:', err);
      }
    }
  } finally {
    workerRunning = false;
    syncState();
  }
}

function applyHotkey(settings: AppSettings): boolean {
  return registerHotkey(
    { accelerator: settings.hotkey, handsFreeMode: settings.handsFreeMode },
    {
      onStartRecording: handleStartRecording,
      onStopRecording: handleStopRecording,
    }
  );
}

export async function registerBackend(opts: BackendOptions): Promise<void> {
  if (registered) return;
  registered = true;
  activeMainWindowOpener = opts.onOpenSettings;

  initUpdater(broadcast);

  const settings = getSettings();
  initTray({
    uiLanguage: resolveUiLanguage(settings.uiLanguage),
    onOpenSettings: opts.onOpenSettings,
    onShowHistory: () => {
      opts.onOpenSettings();
      broadcast('navigate', { to: '/history' });
    },
    onCheckForUpdates: () => checkForUpdatesManual(),
    onQuit: opts.onQuit,
  });

  applyHotkey(settings);

  // ---------- IPC: settings ----------
  ipcMain.handle('settings:get', (): AppSettings => getSettings());
  ipcMain.handle(
    'settings:update',
    (_e, patch: Partial<AppSettings>): AppSettings => {
      const prev = getSettings();
      const next = updateSettings(patch);
      const hotkeyChanged = patch.hotkey !== undefined && patch.hotkey !== prev.hotkey;
      const handsFreeChanged =
        patch.handsFreeMode !== undefined && patch.handsFreeMode !== prev.handsFreeMode;
      if (hotkeyChanged || handsFreeChanged) {
        const ok = applyHotkey(next);
        if (!ok) {
          // Revert to previous values if the new accelerator couldn't register.
          const reverted = updateSettings({
            hotkey: prev.hotkey,
            handsFreeMode: prev.handsFreeMode,
          });
          applyHotkey(reverted);
          const lang = resolveUiLanguage(next.uiLanguage);
          throw new Error(tBackend(lang, 'errors.hotkeyRegister', { accel: next.hotkey }));
        }
      }
      if (
        patch.uiLanguage !== undefined &&
        patch.uiLanguage !== prev.uiLanguage
      ) {
        rebuildTrayLabels(resolveUiLanguage(next.uiLanguage));
      }
      broadcast('settings:changed', next);
      return next;
    }
  );
  ipcMain.handle('settings:reset', (): AppSettings => {
    const next = resetSettings();
    applyHotkey(next);
    rebuildTrayLabels(resolveUiLanguage(next.uiLanguage));
    broadcast('settings:changed', next);
    return next;
  });

  // ---------- IPC: recording state ----------
  ipcMain.handle('recording:getState', () => recordingState);

  // Mic levels arrive ~12 fps from the renderer; we forward them to the
  // floating recording window so the waveform reacts to the user's voice.
  ipcMain.on('recording:level', (_e, level: number) => {
    if (!isRecording) return;
    setRecordingWindowLevel(typeof level === 'number' ? level : 0);
  });

  // The renderer captures audio via getUserMedia and sends the raw PCM here
  // when the user toggles the hotkey off. The job is enqueued and processed
  // serially in the background; the renderer doesn't block on the result so
  // a new recording can start immediately while older clips finish.
  ipcMain.handle(
    'recording:submitAudio',
    (
      _e,
      payload: { pcm: ArrayBuffer; sampleRate: number; channels: number }
    ): void => {
      transcriptionQueue.push({
        pcm: Buffer.from(payload.pcm),
        sampleRate: payload.sampleRate,
        channels: payload.channels,
      });
      void processQueue();
      syncState();
    }
  );

  // Cancel only the current recording capture. Anything already queued for
  // transcription keeps processing — the user already committed to those clips.
  ipcMain.handle('recording:cancel', () => {
    isRecording = false;
    syncState();
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
  ipcMain.handle('resources:check', () => checkResources(getSettings().precision));
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getPlatform', () => process.platform);
  ipcMain.handle('app:getSystemLocale', () => getSystemLocale());
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

function handleStartRecording(): void {
  if (isRecording) return; // mic already open
  isRecording = true;
  showRecordingWindow('recording');
  syncState();
  broadcast('recording:start');
}

function handleStopRecording(): void {
  if (!isRecording) return;
  // Flip the flag now so a quick re-tap can immediately start a new mic
  // session even before the renderer ships the audio buffer back.
  isRecording = false;
  // Don't downgrade the recording window yet; if the queue is non-empty
  // syncState() will switch it to the transcribing variant. The renderer's
  // submitAudio call is what actually enqueues the clip for processing.
  syncState();
  broadcast('recording:stop');
}
