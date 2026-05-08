import { BrowserWindow, ipcMain, app, shell } from 'electron';
import { randomUUID } from 'crypto';
import {
  insertTranscription,
  listTranscriptions,
  deleteTranscription,
  clearTranscriptions,
  getStatsTotals,
  countWords,
  getMonthlyWordUsage,
  addMonthlyWordUsage,
  getMonthlyWordLimit,
} from './db';
import {
  flushUsageQueue,
  recordUsage,
  setUsageEventHandlers,
  startUsageSync,
  stopUsageSync,
} from './usageSync';
import {
  getSession,
  loginWithToken,
  logout as authLogout,
  refreshSession,
  startCheckout,
  openBillingPortal,
  canTranscribe,
  startPeriodicAuthRefresh,
  stopPeriodicAuthRefresh,
  type AuthSession,
} from './auth';
import {
  getPendingDeepLink,
  clearPendingDeepLink,
} from './deepLink';
import { getSettings, updateSettings, resetSettings } from './settings';
import { registerHotkey, unregisterAll, notifyExternalKeyup, notifyExternalKeydown } from './hotkey';
import { transcribePcm, checkResources, cancelActiveTranscription } from './transcriber';
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
  setState as setRecordingWindowState,
  setLevel as setRecordingWindowLevel,
  hideRecordingWindow,
} from './recordingWindow';
import {
  muteSystemAudio,
  restoreSystemAudio,
  type MuteSnapshot,
} from './mediaControl';
import { getSystemLocale, resolveUiLanguage, tBackend } from './i18n';
import { rebuildTrayLabels } from './tray';
import { getReleaseState } from './release';
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
        const out = await transcribePcm(job.pcm, job.sampleRate, job.channels, {
          language: cfg.language,
          vocabulary: cfg.vocabulary,
        });
        const meaningful = out.text.replace(/\s/g, '').length >= 2;
        const wordCount = meaningful ? countWords(out.text) : 0;
        if (meaningful) {
          await deliverText(out.text);
        }
        if (cfg.saveHistory && meaningful) {
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
        if (meaningful && wordCount > 0) {
          addMonthlyWordUsage(wordCount);
          recordUsage({
            words: wordCount,
            audioSeconds: Math.round((out.audioDurationMs ?? 0) / 1000),
          });
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
  warmUpRecordingWindow();

  setUsageEventHandlers({
    onLimitReached: (info) => broadcast('usage:limitReached', info),
  });
  startUsageSync();
  startPeriodicAuthRefresh();

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
      const gate = canTranscribe(readLocalUsage);
      if (!gate.allowed) {
        if (gate.reason === 'limit-reached' && gate.info) {
          broadcast('usage:limitReached', gate.info);
        } else {
          broadcast('transcription:blocked', { reason: gate.reason });
        }
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
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getPlatform', () => process.platform);
  ipcMain.handle('app:getSystemLocale', () => getSystemLocale());
  ipcMain.handle('app:openSettings', () => activeMainWindowOpener?.());

  ipcMain.handle('release:getState', () => getReleaseState());

  ipcMain.handle('auth:getSession', (): AuthSession => getSession());
  ipcMain.handle(
    'auth:loginWithToken',
    async (_e, token: string): Promise<AuthSession> => {
      const session = await loginWithToken(token);
      broadcast('auth:changed', session);
      return session;
    }
  );
  ipcMain.handle('auth:logout', async (): Promise<AuthSession> => {
    const session = await authLogout();
    broadcast('auth:changed', session);
    return session;
  });
  ipcMain.handle('auth:refresh', async (): Promise<AuthSession> => {
    const session = await refreshSession();
    broadcast('auth:changed', session);
    return session;
  });
  ipcMain.handle('auth:checkout', async (_e, billingPeriod: 'monthly' | 'annual'): Promise<string> => {
    return startCheckout(billingPeriod);
  });
  ipcMain.handle('auth:billingPortal', async (): Promise<string> => {
    return openBillingPortal();
  });

  ipcMain.handle('usage:getMonthly', () => ({
    used: getMonthlyWordUsage(),
    limit: getMonthlyWordLimit(),
  }));
  ipcMain.handle('usage:flush', async () => {
    await flushUsageQueue(true);
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
      const out = await transcribePcm(pcm, payload.sampleRate, payload.channels, {
        language: cfg.language,
        vocabulary: cfg.vocabulary,
      });
      return out.text;
    }
  );

  ipcMain.handle('deepLink:getPending', () => getPendingDeepLink());
  ipcMain.handle('deepLink:clearPending', (_e, url?: string) => {
    clearPendingDeepLink(url);
  });
  ipcMain.handle('app:openExternal', (_e, url: string) => shell.openExternal(url));

  app.on('before-quit', () => {
    unregisterAll();
    destroyTray();
    void flushUsageQueue(true);
    stopUsageSync();
    stopPeriodicAuthRefresh();
  });
}

function readLocalUsage(): { used: number; limit: number } {
  return { used: getMonthlyWordUsage(), limit: getMonthlyWordLimit() };
}

function handleStartRecording(): void {
  if (isRecording) return;
  if (!recordingArmed) return;
  if (getSession().isAuthenticated) {
    const gate = canTranscribe(readLocalUsage);
    if (!gate.allowed) {
      if (gate.reason === 'limit-reached' && gate.info) {
        broadcast('usage:limitReached', gate.info);
      } else {
        broadcast('transcription:blocked', { reason: gate.reason });
      }
      return;
    }
  }
  isRecording = true;
  showRecordingWindow('recording');
  syncState();
  broadcast('recording:start');
  const cfg = getSettings();
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
