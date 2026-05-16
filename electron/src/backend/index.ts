import { BrowserWindow, ipcMain, app, shell, systemPreferences } from 'electron';
import { randomUUID } from 'crypto';
import {
  insertTranscription,
  listTranscriptions,
  deleteTranscription,
  clearTranscriptions,
  getStatsTotals,
  countWords,
} from './db';
import { getSettings, updateSettings, resetSettings } from './settings';
import { registerHotkey, unregisterAll, notifyExternalKeyup, notifyExternalKeydown } from './hotkey';
import { transcribePcm, transcribeCloud, CloudTranscribeError, checkResources, cancelActiveTranscription } from './transcriber';
import { deliverText } from './paster';
import {
  getOnboardingState,
  setOnboardingState,
  getPermissionStatus,
  requestMicrophonePermission,
  requestAccessibilityPermission,
  openSystemSettingsFor,
  validateHotkey,
  type OnboardingState,
  type PermissionStatus,
} from './onboarding';
import {
  initTray,
  setRecordingState as setTrayState,
  destroyTray,
} from './tray';
import {
  warmUpRecordingWindow,
  showRecordingWindow,
  setLevel as setRecordingWindowLevel,
  hideRecordingWindow,
} from './recordingWindow';
import {
  muteSystemAudio,
  restoreSystemAudio,
  prewarmMediaControl,
  shutdownMediaControl,
  type MuteSnapshot,
} from './mediaControl';
import { getSystemLocale, resolveUiLanguage, tBackend } from './i18n';
import { rebuildTrayLabels } from './tray';
import { getReleaseState, startReleasePolling, stopReleasePolling, fetchLatestRelease } from './release';
import { getAppVersion } from './appVersion';
import type { RecordingState, AppSettings } from './types';

interface BackendOptions {
  onOpenSettings: () => void;
  onQuit: () => void;
}

let registered = false;
let recordingState: RecordingState = 'idle';
let activeMainWindowOpener: (() => void) | null = null;

let isRecording = false;
let recordingArmed = false;
let workerRunning = false;
let muteSnapshot: MuteSnapshot | null = null;
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
  broadcast('recording:state', next);
  if (next === 'idle') {
    hideRecordingWindow();
  } else {
    showRecordingWindow(next);
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
        let out;
        if (cfg.mode === 'cloud' && cfg.openaiApiKey) {
          try {
            out = await transcribeCloud(job.pcm, job.sampleRate, job.channels, {
              apiKey: cfg.openaiApiKey,
              model: cfg.openaiModel,
            });
          } catch (err) {
            if (err instanceof CloudTranscribeError && err.reason === 'invalid-key') {
              broadcast('transcription:blocked', { reason: 'invalid-key' });
              out = await transcribePcm(job.pcm, job.sampleRate, job.channels);
            } else if (
              err instanceof CloudTranscribeError &&
              (err.reason === 'network' || err.reason === 'upstream')
            ) {
              console.warn('[backend] cloud transcription failed, falling back to offline:', err.message);
              broadcast('transcription:cloudFallback', { reason: err.message });
              out = await transcribePcm(job.pcm, job.sampleRate, job.channels);
            } else {
              throw err;
            }
          }
        } else {
          out = await transcribePcm(job.pcm, job.sampleRate, job.channels);
        }
        if (!out) continue;
        const meaningful = out.text.replace(/\s/g, '').length >= 2;
        const wordCount = meaningful ? countWords(out.text) : 0;
        if (meaningful) {
          await deliverText(out.text);
          insertTranscription({
            id: randomUUID(),
            createdAt: Date.now(),
            text: out.text,
            language: out.language,
            durationMs: out.durationMs,
            model: out.modelFile,
            audioDurationMs: out.audioDurationMs,
            wordCount,
          });
          broadcast('history:changed');
          broadcast('stats:totals', getStatsTotals());
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
      onCancelRecording: handleCancelRecording,
    }
  );
}

// uiohook-napi creates a CGEventTap with kCGEventTapOptionDefault on macOS,
// which silently produces a dead tap when Accessibility isn't granted to the
// running binary — global hotkeys stop firing while the window-focused fallback
// (DOM keydown forwarded by App.tsx) keeps working, making it look like a
// partial bug. Re-check on every launch and surface the system prompt so the
// user can re-grant after a TCC reset, OS upgrade, or signature change.
function ensureAccessibilityForHotkey(): void {
  if (process.platform !== 'darwin') return;
  const trusted = systemPreferences.isTrustedAccessibilityClient(false);
  if (trusted) {
    console.log('[backend] accessibility: granted — global hotkey active');
    return;
  }
  console.warn(
    '[backend] accessibility: NOT granted — global hotkey will only work while ' +
    'the Bisbi window is focused. Triggering system prompt.'
  );
  systemPreferences.isTrustedAccessibilityClient(true);
  broadcast('permission:accessibilityMissing', { platform: 'darwin' });
}

export async function registerBackend(opts: BackendOptions): Promise<void> {
  if (registered) return;
  registered = true;
  activeMainWindowOpener = opts.onOpenSettings;

  const settings = getSettings();
  initTray({
    uiLanguage: resolveUiLanguage(settings.uiLanguage),
    onOpenSettings: opts.onOpenSettings,
    onShowHistory: () => {
      opts.onOpenSettings();
      broadcast('navigate', { to: '/history' });
    },
    onQuit: opts.onQuit,
  });

  applyHotkey(settings);
  ensureAccessibilityForHotkey();
  warmUpRecordingWindow();
  prewarmMediaControl();
  startReleasePolling();

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
      if (patch.openAtLogin !== undefined && patch.openAtLogin !== prev.openAtLogin) {
        app.setLoginItemSettings({ openAtLogin: next.openAtLogin });
      }
      broadcast('settings:changed', next);
      return next;
    }
  );
  ipcMain.handle('settings:reset', (): AppSettings => {
    const next = resetSettings();
    applyHotkey(next);
    rebuildTrayLabels(resolveUiLanguage(next.uiLanguage));
    app.setLoginItemSettings({ openAtLogin: next.openAtLogin });
    broadcast('settings:changed', next);
    return next;
  });

  ipcMain.handle('recording:getState', () => recordingState);

  ipcMain.on('recording:level', (_e, level: number) => {
    if (!isRecording) return;
    setRecordingWindowLevel(typeof level === 'number' ? level : 0);
  });

  ipcMain.handle(
    'recording:submitAudio',
    (
      _e,
      payload: { pcm: ArrayBuffer; sampleRate: number; channels: number }
    ): void => {
      const pcm = Buffer.from(payload.pcm);
      const bytesPerSample = 2 * Math.max(1, payload.channels);
      const minBytes = Math.floor(payload.sampleRate * 0.1) * bytesPerSample;
      if (pcm.length < minBytes) {
        syncState();
        return;
      }
      transcriptionQueue.push({
        pcm,
        sampleRate: payload.sampleRate,
        channels: payload.channels,
      });
      void processQueue();
      syncState();
    }
  );

  ipcMain.handle('recording:cancel', () => {
    isRecording = false;
    syncState();
  });

  ipcMain.handle('recording:setArmed', (_e, armed: boolean) => {
    recordingArmed = !!armed;
    if (!recordingArmed && isRecording) {
      handleCancelRecording();
    }
  });

  ipcMain.on('hotkey:externalKeyup', () => {
    notifyExternalKeyup();
  });

  ipcMain.on('hotkey:externalKeydown', () => {
    notifyExternalKeydown();
  });

  ipcMain.handle('recording:cancelAll', () => {
    cancelEverything();
  });

  ipcMain.handle('history:list', (_e, limit?: number) => listTranscriptions(limit ?? 100));
  ipcMain.handle('history:delete', (_e, id: string) => {
    deleteTranscription(id);
    broadcast('history:changed');
    broadcast('stats:totals', getStatsTotals());
  });
  ipcMain.handle('history:clear', () => {
    clearTranscriptions();
    broadcast('history:changed');
    broadcast('stats:totals', getStatsTotals());
  });

  ipcMain.handle('stats:totals', () => getStatsTotals());

  ipcMain.handle('resources:check', () => checkResources());
  ipcMain.handle('app:getVersion', () => getAppVersion());
  ipcMain.handle('app:getPlatform', () => process.platform);
  ipcMain.handle('app:getSystemLocale', () => getSystemLocale());
  ipcMain.handle('app:openSettings', () => activeMainWindowOpener?.());

  ipcMain.handle('release:getState', () => getReleaseState());
  ipcMain.handle('release:check', async () => {
    await fetchLatestRelease();
    return getReleaseState();
  });

  ipcMain.handle('onboarding:getState', (): OnboardingState => getOnboardingState());
  ipcMain.handle(
    'onboarding:setState',
    (_e, patch: Partial<OnboardingState>): OnboardingState => {
      const next = setOnboardingState(patch);
      broadcast('onboarding:state', next);
      return next;
    }
  );
  ipcMain.handle('onboarding:getPermissions', (): PermissionStatus => getPermissionStatus());
  ipcMain.handle('onboarding:requestMicrophone', async (): Promise<PermissionStatus> => {
    await requestMicrophonePermission();
    return getPermissionStatus();
  });
  ipcMain.handle('onboarding:requestAccessibility', (): PermissionStatus => {
    requestAccessibilityPermission();
    return getPermissionStatus();
  });
  ipcMain.handle(
    'onboarding:openSystemSettings',
    async (_e, pane: 'microphone' | 'accessibility'): Promise<void> => {
      await openSystemSettingsFor(pane);
    }
  );
  ipcMain.handle(
    'onboarding:validateHotkey',
    (_e, accelerator: string): { ok: boolean; reason?: string } =>
      validateHotkey(accelerator)
  );
  ipcMain.handle(
    'onboarding:transcribePreview',
    async (
      _e,
      payload: { pcm: ArrayBuffer; sampleRate: number; channels: number }
    ): Promise<string> => {
      const pcm = Buffer.from(payload.pcm);
      const cfg = getSettings();
      if (cfg.mode === 'cloud' && cfg.openaiApiKey) {
        try {
          const out = await transcribeCloud(pcm, payload.sampleRate, payload.channels, {
            apiKey: cfg.openaiApiKey,
            model: cfg.openaiModel,
          });
          return out.text;
        } catch (err) {
          if (
            err instanceof CloudTranscribeError &&
            (err.reason === 'network' || err.reason === 'upstream')
          ) {
            console.warn(
              '[onboarding] cloud preview failed, falling back to offline:',
              err.message
            );
            const out = await transcribePcm(pcm, payload.sampleRate, payload.channels);
            return out.text;
          }
          throw err;
        }
      }
      const out = await transcribePcm(pcm, payload.sampleRate, payload.channels);
      return out.text;
    }
  );

  ipcMain.handle('app:openExternal', (_e, url: string) => shell.openExternal(url));

  app.on('before-quit', () => {
    unregisterAll();
    destroyTray();
    stopReleasePolling();
    shutdownMediaControl();
  });
}

function handleStartRecording(): void {
  if (isRecording) return;
  if (!recordingArmed) return;
  const cfg = getSettings();
  if (cfg.mode === 'cloud' && !cfg.openaiApiKey) {
    broadcast('transcription:blocked', { reason: 'no-api-key' });
    return;
  }
  isRecording = true;
  showRecordingWindow('recording');
  syncState();
  broadcast('recording:start');
  if (cfg.muteSystemAudioWhileRecording) {
    void muteSystemAudio().then((snap) => {
      if (!isRecording) {
        void restoreSystemAudio(snap);
        return;
      }
      muteSnapshot = snap;
    });
  }
}

function handleStopRecording(): void {
  if (!isRecording) return;
  isRecording = false;
  syncState();
  broadcast('recording:stop');
  if (muteSnapshot) {
    const snap = muteSnapshot;
    muteSnapshot = null;
    void restoreSystemAudio(snap);
  }
}

function handleCancelRecording(): void {
  if (!isRecording) return;
  isRecording = false;
  syncState();
  broadcast('recording:cancel');
  if (muteSnapshot) {
    const snap = muteSnapshot;
    muteSnapshot = null;
    void restoreSystemAudio(snap);
  }
}

function cancelEverything(): void {
  if (isRecording) handleCancelRecording();
  transcriptionQueue.length = 0;
  cancelActiveTranscription();
}
