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
    invoke<import('./backend/types').TranscriptionResult>('recording:submitAudio', {
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

  // History
  listHistory: (limit?: number) =>
    invoke<import('./backend/db').TranscriptionRow[]>('history:list', limit ?? 100),
  deleteHistory: (id: string) => invoke<void>('history:delete', id),
  clearHistory: () => invoke<void>('history:clear'),
  onHistoryChange: (cb: () => void) => listen<void>('history:changed', () => cb()),

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
};

contextBridge.exposeInMainWorld('bisbi', bisbi);

export type BisbiApi = typeof bisbi;
