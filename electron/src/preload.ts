import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

type Unsubscribe = () => void;

const invoke = <T = unknown>(channel: string, ...args: unknown[]): Promise<T> =>
  ipcRenderer.invoke(channel, ...args) as Promise<T>;

const listen = <T>(channel: string, cb: (payload: T) => void): Unsubscribe => {
  const handler = (_event: IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

const bisbi = {
  // App
  getAppVersion: () => invoke<string>('app:getVersion'),
  getPlatform: () => invoke<NodeJS.Platform>('app:getPlatform'),
  getSystemLocale: () => invoke<string>('app:getSystemLocale'),
  openSettings: () => invoke<void>('app:openSettings'),

  // Settings
  getSettings: () => invoke<import('./backend/types').AppSettings>('settings:get'),
  updateSettings: (patch: Partial<import('./backend/types').AppSettings>) =>
    invoke<import('./backend/types').AppSettings>('settings:update', patch),
  resetSettings: () =>
    invoke<import('./backend/types').AppSettings>('settings:reset'),
  onSettingsChange: (cb: (s: import('./backend/types').AppSettings) => void) =>
    listen<import('./backend/types').AppSettings>('settings:changed', cb),

  // Recording
  getRecordingState: () =>
    invoke<import('./backend/types').RecordingState>('recording:getState'),
  submitAudio: (pcm: ArrayBuffer, sampleRate: number, channels: number) =>
    invoke<void>('recording:submitAudio', {
      pcm,
      sampleRate,
      channels,
    }),
  cancelRecording: () => invoke<void>('recording:cancel'),
  onRecordingStart: (cb: () => void) =>
    listen<void>('recording:start', () => cb()),
  onRecordingStop: (cb: () => void) =>
    listen<void>('recording:stop', () => cb()),
  onRecordingState: (cb: (s: import('./backend/types').RecordingState) => void) =>
    listen<import('./backend/types').RecordingState>('recording:state', cb),
  onPillState: (cb: (s: import('./backend/types').RecordingState) => void) =>
    listen<import('./backend/types').RecordingState>('recording:pillState', cb),
  sendRecordingLevel: (level: number) => ipcRenderer.send('recording:level', level),
  onRecordingLevel: (cb: (level: number) => void) =>
    listen<number>('recording:level', cb),

  // History
  listHistory: (limit?: number) =>
    invoke<import('./backend/db').TranscriptionRow[]>('history:list', limit ?? 100),
  deleteHistory: (id: string) => invoke<void>('history:delete', id),
  clearHistory: () => invoke<void>('history:clear'),
  onHistoryChange: (cb: () => void) => listen<void>('history:changed', () => cb()),

  // Stats
  getStatsTotals: () =>
    invoke<import('./backend/db').StatsTotals>('stats:totals'),
  onStatsTotalsChange: (cb: (s: import('./backend/db').StatsTotals) => void) =>
    listen<import('./backend/db').StatsTotals>('stats:totals', cb),

  // Resources / diagnostics
  checkResources: () =>
    invoke<{ ok: boolean; binaryPath: string; modelPath: string; missing: string[] }>(
      'resources:check'
    ),

  // Updater
  updater: {
    getState: () =>
      invoke<import('./backend/updater').UpdateStatus>('updater:getState'),
    check: () => invoke<void>('updater:check'),
    install: () => invoke<void>('updater:install'),
    onStateChange: (
      cb: (s: import('./backend/updater').UpdateStatus) => void
    ) => listen<import('./backend/updater').UpdateStatus>('updater:state', cb),
  },

  // Routing helper for tray-driven navigation
  onNavigate: (cb: (payload: { to: string }) => void) =>
    listen<{ to: string }>('navigate', cb),

  // Auth
  auth: {
    getSession: () =>
      invoke<import('./backend/auth').AuthSession>('auth:getSession'),
    loginWithToken: (token: string) =>
      invoke<import('./backend/auth').AuthSession>('auth:loginWithToken', token),
    logout: () => invoke<import('./backend/auth').AuthSession>('auth:logout'),
    refresh: () => invoke<import('./backend/auth').AuthSession>('auth:refresh'),
    onChange: (cb: (s: import('./backend/auth').AuthSession) => void) =>
      listen<import('./backend/auth').AuthSession>('auth:changed', cb),
    checkout: (billingPeriod: 'monthly' | 'annual') =>
      invoke<string>('auth:checkout', billingPeriod),
  },

  // Deep link / external links
  deepLink: {
    getPending: () => invoke<string | null>('deepLink:getPending'),
    clearPending: (url?: string) => invoke<void>('deepLink:clearPending', url),
    onLink: (cb: (payload: { url: string }) => void) =>
      listen<{ url: string }>('deep-link', cb),
  },
  openExternal: (url: string) => invoke<void>('app:openExternal', url),

  // Onboarding (first-run flow shown before login)
  onboarding: {
    getState: () =>
      invoke<import('./backend/onboarding').OnboardingState>('onboarding:getState'),
    setState: (patch: Partial<import('./backend/onboarding').OnboardingState>) =>
      invoke<import('./backend/onboarding').OnboardingState>('onboarding:setState', patch),
    onStateChange: (
      cb: (s: import('./backend/onboarding').OnboardingState) => void
    ) => listen<import('./backend/onboarding').OnboardingState>('onboarding:state', cb),
    getPermissions: () =>
      invoke<import('./backend/onboarding').PermissionStatus>('onboarding:getPermissions'),
    requestMicrophone: () =>
      invoke<import('./backend/onboarding').PermissionStatus>(
        'onboarding:requestMicrophone'
      ),
    requestAccessibility: () =>
      invoke<import('./backend/onboarding').PermissionStatus>(
        'onboarding:requestAccessibility'
      ),
    openSystemSettings: (pane: 'microphone' | 'accessibility') =>
      invoke<void>('onboarding:openSystemSettings', pane),
    validateHotkey: (accelerator: string) =>
      invoke<{ ok: boolean; reason?: string }>('onboarding:validateHotkey', accelerator),
    transcribePreview: (pcm: ArrayBuffer, sampleRate: number, channels: number) =>
      invoke<string>('onboarding:transcribePreview', { pcm, sampleRate, channels }),
  },

  // Usage / quota — free plan monthly word cap, tracked locally.
  usage: {
    getMonthly: () =>
      invoke<{ used: number; limit: number }>('usage:getMonthly'),
    onLimitReached: (cb: (payload: { used: number; limit: number }) => void) =>
      listen<{ used: number; limit: number }>('usage:limitReached', cb),
  },
};

contextBridge.exposeInMainWorld('bisbi', bisbi);

export type BisbiApi = typeof bisbi;
