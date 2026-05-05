// NOTE: do not use `as const` here. `Translations` is the structural shape of
// the dictionary; widening the values to plain `string` is what lets the other
// locales (es, zh, hi, ar) satisfy the same interface with their own copy.
export const en: {
  app: {
    brand: string;
    tabs: { home: string; history: string; settings: string };
    status: { idle: string; recording: string; transcribing: string };
    loading: string;
    notElectron: { body: string; devHint: string };
    resourcesMissing: string;
    micError: string;
  };
  home: {
    greeting: { lateNight: string; morning: string; afternoon: string; evening: string };
    statusTitle: { idle: string; recording: string; transcribing: string };
    titleHint: string;
    hotkeyLabel: string;
    hotkeyHintPaste: string;
    hotkeyHintClipboard: string;
    todaySection: string;
    transcriptionsOne: string;
    transcriptionsOther: string;
    dictated: string;
    lastLanguage: string;
    lastTranscriptionSection: string;
    empty: string;
    relative: { justNow: string; minutes: string; hours: string; days: string };
  };
  history: {
    title: string;
    clearAll: string;
    confirmClear: string;
    empty: string;
    copy: string;
    delete: string;
  };
  settings: {
    hotkey: { title: string; description: string; change: string; cancel: string };
    transcriptionLanguage: { title: string; description: string };
    uiLanguage: { title: string; description: string; system: string };
    pasteMode: { title: string; description: string; paste: string; clipboard: string };
    saveHistory: { title: string; description: string; label: string };
    precision: {
      title: string;
      description: string;
      fast: { label: string; hint: string };
      balanced: { label: string; hint: string };
      high: { label: string; hint: string };
    };
    reset: string;
  };
  recording: { recording: string; transcribing: string; idle: string };
  languages: {
    auto: string;
    en: string;
    es: string;
    pt: string;
    fr: string;
    it: string;
    de: string;
    zh: string;
    hi: string;
    ar: string;
  };
  uiLanguageOption: { en: string; es: string; zh: string; hi: string; ar: string };
  tray: {
    tooltipIdle: string;
    tooltipRecording: string;
    tooltipTranscribing: string;
    openSettings: string;
    history: string;
    checkUpdates: string;
    version: string;
    quit: string;
  };
  errors: { hotkeyRegister: string };
} = {
  app: {
    brand: 'Bisbi',
    tabs: {
      home: 'Home',
      history: 'History',
      settings: 'Settings',
    },
    status: {
      idle: 'Ready',
      recording: 'Recording',
      transcribing: 'Transcribing',
    },
    loading: 'Loading…',
    notElectron: {
      body: 'This window must be opened from Electron so the global hotkey, the microphone, and transcription work.',
      devHint: 'If you are in development, run {cmd} in the repo root and let Electron open its own window. Do not open {url} directly in the browser.',
    },
    resourcesMissing:
      'Whisper resources are missing. See the README for how to download the binary and the model into {path}.',
    micError:
      'Could not access the microphone. Make sure Bisbi has permission in your system settings.',
  },
  home: {
    greeting: {
      lateNight: 'Good night',
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    statusTitle: {
      idle: 'Ready to listen',
      recording: 'Recording now',
      transcribing: 'Transcribing',
    },
    titleHint: 'Press the hotkey and speak.',
    hotkeyLabel: 'Hotkey',
    hotkeyHintPaste: 'The text is pasted automatically wherever you are typing.',
    hotkeyHintClipboard: 'The text is copied to the clipboard.',
    todaySection: 'Today',
    transcriptionsOne: 'transcription',
    transcriptionsOther: 'transcriptions',
    dictated: 'dictated',
    lastLanguage: 'last language',
    lastTranscriptionSection: 'Last transcription',
    empty: 'No transcriptions yet. Try your hotkey.',
    relative: {
      justNow: 'just now',
      minutes: '{n} min ago',
      hours: '{n} h ago',
      days: '{n} d ago',
    },
  },
  history: {
    title: 'Recent transcriptions',
    clearAll: 'Clear all',
    confirmClear: 'Clear the entire history?',
    empty: 'No transcriptions yet. Try your hotkey.',
    copy: 'Copy',
    delete: 'Delete',
  },
  settings: {
    hotkey: {
      title: 'Keyboard shortcut',
      description: 'Press it from any app to start and stop recording.',
      change: 'Change',
      cancel: 'Cancel',
    },
    transcriptionLanguage: {
      title: 'Transcription language',
      description: 'Whisper auto-detects the language. Pin it for more speed.',
    },
    uiLanguage: {
      title: 'App language',
      description:
        'Language used for the interface. By default it follows your operating system.',
      system: 'System ({detected})',
    },
    pasteMode: {
      title: 'Text insertion',
      description: 'How we deliver the transcribed text.',
      paste: 'Auto-paste (Cmd/Ctrl+V) into the active app',
      clipboard: 'Copy to clipboard only (I will paste it myself)',
    },
    saveHistory: {
      title: 'History',
      description: 'Stores transcriptions in a local database.',
      label: 'Save transcriptions in the history',
    },
    precision: {
      title: 'Transcription accuracy',
      description:
        'Higher accuracy gives better results but takes more time and resources. Change it if you notice errors.',
      fast: {
        label: 'Fast',
        hint: 'Less effort, near-instant transcription. Ideal if you speak clearly in a single language.',
      },
      balanced: {
        label: 'Balanced (recommended)',
        hint: 'Good trade-off between speed and quality for everyday use.',
      },
      high: {
        label: 'High',
        hint: 'More effort and slower, but better with mixed languages, technical terms, or noisy audio.',
      },
    },
    reset: 'Reset settings',
  },
  recording: {
    recording: 'Recording',
    transcribing: 'Transcribing…',
    idle: 'Ready',
  },
  languages: {
    auto: 'Auto-detect',
    en: 'English',
    es: 'Spanish',
    pt: 'Portuguese',
    fr: 'French',
    it: 'Italian',
    de: 'German',
    zh: 'Chinese',
    hi: 'Hindi',
    ar: 'Arabic',
  },
  uiLanguageOption: {
    en: 'English',
    es: 'Español',
    zh: '中文',
    hi: 'हिन्दी',
    ar: 'العربية',
  },
  tray: {
    tooltipIdle: 'Bisbi — ready to dictate',
    tooltipRecording: 'Bisbi — recording…',
    tooltipTranscribing: 'Bisbi — transcribing…',
    openSettings: 'Open settings',
    history: 'History',
    checkUpdates: 'Check for updates',
    version: 'Version {v}',
    quit: 'Quit',
  },
  errors: {
    hotkeyRegister: 'Could not register the shortcut "{accel}". Try another one.',
  },
};

export type Translations = typeof en;
