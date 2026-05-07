export type RecordingState = 'idle' | 'recording' | 'transcribing';

export type UiLanguage = 'en' | 'es' | 'zh' | 'hi' | 'ar';
export type UiLanguageSetting = UiLanguage | 'system';

export type Precision = 'fast' | 'accurate';

export interface AppSettings {
  hotkey: string;
  handsFreeMode: boolean;
  language: string;
  uiLanguage: UiLanguageSetting;
  saveHistory: boolean;
  precision: Precision;
  vocabulary: string;
  microphoneId: string | null;
  muteSystemAudioWhileRecording: boolean;
}

export interface TranscriptionRow {
  id: string;
  createdAt: number;
  text: string;
  language: string | null;
  durationMs: number | null;
  model: string | null;
  audioDurationMs: number | null;
  wordCount: number | null;
}

export interface StatsTotals {
  totalTranscriptions: number;
  totalAudioMs: number;
  totalWords: number;
}

export interface UpdateStatus {
  kind: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error';
  version?: string;
  percent?: number;
  message?: string;
}

export interface ResourceCheck {
  ok: boolean;
  binaryPath: string;
  modelPath: string;
  missing: string[];
}

export type Plan = 'free' | 'pro';

export interface PricingPlan {
  priceId: string | null;
  amount: number;
  currency: string;
  label: string;
}

export interface PricingPlanAnnual extends PricingPlan {
  monthlyEquivalent: string;
  savings: string;
}

export interface Pricing {
  pro: {
    monthly: PricingPlan;
    annual: PricingPlanAnnual;
  };
}

export interface UserInfo {
  userId: string;
  email: string;
  name: string;
  plan: Plan;
  avatarUrl?: string | null;
  subscriptionStatus?: string | null;
  subscriptionExpiresAt?: string | null;
  subscriptionBillingPeriod?: string | null;
  pricing?: Pricing | null;
}

export interface AuthSession {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
}

export type OnboardingStep = 1 | 2 | 3 | 4;

export interface OnboardingState {
  completed: boolean;
  lastStep: OnboardingStep;
}

export interface PermissionStatus {
  microphone: 'granted' | 'denied' | 'unknown';
  accessibility: 'granted' | 'denied' | 'unknown' | 'not-applicable';
}

declare global {
  interface Window {
    bisbi: {
      getAppVersion: () => Promise<string>;
      getPlatform: () => Promise<NodeJS.Platform>;
      getSystemLocale: () => Promise<string>;
      openSettings: () => Promise<void>;
      getSettings: () => Promise<AppSettings>;
      updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
      resetSettings: () => Promise<AppSettings>;
      onSettingsChange: (cb: (s: AppSettings) => void) => () => void;
      getRecordingState: () => Promise<RecordingState>;
      submitAudio: (
        pcm: ArrayBuffer,
        sampleRate: number,
        channels: number
      ) => Promise<void>;
      cancelRecording: () => Promise<void>;
      setRecordingArmed: (armed: boolean) => Promise<void>;
      onRecordingStart: (cb: () => void) => () => void;
      onRecordingStop: (cb: () => void) => () => void;
      onRecordingCancel: (cb: () => void) => () => void;
      onRecordingState: (cb: (s: RecordingState) => void) => () => void;
      onPillState: (cb: (s: RecordingState) => void) => () => void;
      sendRecordingLevel: (level: number) => void;
      onRecordingLevel: (cb: (level: number) => void) => () => void;
      listHistory: (limit?: number) => Promise<TranscriptionRow[]>;
      deleteHistory: (id: string) => Promise<void>;
      clearHistory: () => Promise<void>;
      onHistoryChange: (cb: () => void) => () => void;
      getStatsTotals: () => Promise<StatsTotals>;
      onStatsTotalsChange: (cb: (s: StatsTotals) => void) => () => void;
      checkResources: () => Promise<ResourceCheck>;
      updater: {
        getState: () => Promise<UpdateStatus>;
        check: () => Promise<void>;
        install: () => Promise<void>;
        onStateChange: (cb: (s: UpdateStatus) => void) => () => void;
      };
      onNavigate: (cb: (payload: { to: string }) => void) => () => void;
      auth: {
        getSession: () => Promise<AuthSession>;
        loginWithToken: (token: string) => Promise<AuthSession>;
        logout: () => Promise<AuthSession>;
        refresh: () => Promise<AuthSession>;
        onChange: (cb: (s: AuthSession) => void) => () => void;
        checkout: (billingPeriod: 'monthly' | 'annual') => Promise<string>;
        billingPortal: () => Promise<string>;
      };
      deepLink: {
        getPending: () => Promise<string | null>;
        clearPending: (url?: string) => Promise<void>;
        onLink: (cb: (payload: { url: string }) => void) => () => void;
      };
      openExternal: (url: string) => Promise<void>;
      usage: {
        getMonthly: () => Promise<{ used: number; limit: number }>;
        onLimitReached: (cb: (payload: { used: number; limit: number }) => void) => () => void;
      };
      onboarding: {
        getState: () => Promise<OnboardingState>;
        setState: (patch: Partial<OnboardingState>) => Promise<OnboardingState>;
        onStateChange: (cb: (s: OnboardingState) => void) => () => void;
        getPermissions: () => Promise<PermissionStatus>;
        requestMicrophone: () => Promise<PermissionStatus>;
        requestAccessibility: () => Promise<PermissionStatus>;
        openSystemSettings: (pane: 'microphone' | 'accessibility') => Promise<void>;
        validateHotkey: (accelerator: string) => Promise<{ ok: boolean; reason?: string }>;
        transcribePreview: (
          pcm: ArrayBuffer,
          sampleRate: number,
          channels: number
        ) => Promise<string>;
      };
    };
  }
}
