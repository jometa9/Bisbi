// NOTE: do not use `as const` here. `Translations` is the structural shape of
// the dictionary; widening the values to plain `string` is what lets the other
// locales (es, zh, hi, ar) satisfy the same interface with their own copy.
export const en: {
  app: {
    brand: string;
    tabs: { home: string; history: string; settings: string; account: string };
    status: { idle: string; recording: string; transcribing: string };
    loading: string;
    notElectron: { body: string; devHint: string };
    resourcesMissing: string;
    micError: string;
  };
  auth: {
    welcome: string;
    tagline: string;
    signIn: string;
    authenticating: string;
    redirecting: string;
    validating: string;
    tryAgain: string;
    invalidToken: string;
    connectionError: string;
    noAccount: string;
    signUp: string;
  };
  account: {
    title: string;
    plan: string;
    planFree: string;
    planPro: string;
    email: string;
    name: string;
    userId: string;
    manageSubscription: string;
    upgradeToPro: string;
    logout: string;
    confirmLogout: string;
    profileSection: { title: string; description: string };
    subscriptionSection: { title: string; description: string };
    sessionSection: { title: string; description: string };
  };
  home: {
    greeting: { lateNight: string; morning: string; afternoon: string; evening: string };
    statusTitle: { idle: string; recording: string; transcribing: string };
    titleHint: string;
    hotkeyLabel: string;
    hotkeyHintPaste: string;
    hotkeyHintClipboard: string;
    activitySection: string;
    transcriptionsOne: string;
    transcriptionsOther: string;
    dictated: string;
    wordsOne: string;
    wordsOther: string;
    wpmLabel: string;
    recentSection: string;
    empty: string;
    seeMore: string;
  };
  dateGroups: { today: string; yesterday: string };
  history: {
    title: string;
    clearAll: string;
    confirmClear: string;
    empty: string;
    copy: string;
    copied: string;
    delete: string;
    savingDisabledTitle: string;
    savingDisabledHint: string;
    savingDisabledCta: string;
  };
  settings: {
    hotkey: { title: string; description: string; change: string; cancel: string; waiting: string };
    handsFree: {
      title: string;
      description: string;
      pushToTalk: { label: string; hint: string };
      tapToToggle: { label: string; hint: string };
    };
    microphone: {
      title: string;
      description: string;
      systemDefault: string;
      unnamed: string;
    };
    transcriptionLanguage: { title: string; description: string };
    uiLanguage: { title: string; description: string; system: string };
    pasteMode: { title: string; description: string; paste: string; clipboard: string };
    saveHistory: {
      title: string;
      description: string;
      enabled: { label: string; hint: string };
      disabled: { label: string; hint: string };
    };
    precision: {
      title: string;
      description: string;
      fast: { label: string; hint: string };
      balanced: { label: string; hint: string };
      high: { label: string; hint: string };
    };
    suppressNonSpeech: {
      title: string;
      description: string;
      enabled: { label: string; hint: string };
      disabled: { label: string; hint: string };
    };
    vocabulary: {
      title: string;
      description: string;
      placeholder: string;
      hint: string;
    };
    dangerZone: { title: string; description: string };
    reset: string;
    clearHistory: string;
    confirmReset: string;
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
  update: {
    downloading: string;
    ready: string;
    restart: string;
  };
  errors: { hotkeyRegister: string };
  common: { yes: string; no: string };
} = {
  app: {
    brand: 'Bisbi',
    tabs: {
      home: 'Home',
      history: 'History',
      settings: 'Settings',
      account: 'Account',
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
  auth: {
    welcome: 'Welcome to Bisbi',
    tagline: 'The fastest way to dictate anywhere.',
    signIn: 'Sign in with Google',
    authenticating: 'Authenticating in browser…',
    redirecting: 'Redirecting back to the app…',
    validating: 'Validating session…',
    tryAgain: 'Try again',
    invalidToken: 'We could not validate that session. Please sign in again.',
    connectionError: 'Connection error. Check your internet and try again.',
    noAccount: "Don't have an account?",
    signUp: 'Sign up',
  },
  account: {
    title: 'Account',
    plan: 'Plan',
    planFree: 'Free',
    planPro: 'Pro',
    email: 'Email',
    name: 'Name',
    userId: 'User ID',
    manageSubscription: 'Manage subscription',
    upgradeToPro: 'Upgrade to Pro',
    logout: 'Log out',
    confirmLogout: 'Log out of Bisbi?',
    profileSection: {
      title: 'Profile',
      description: 'How Bisbi identifies you across devices.',
    },
    subscriptionSection: {
      title: 'Subscription',
      description: 'Manage your plan and billing.',
    },
    sessionSection: {
      title: 'Session',
      description: 'Sign out of this device.',
    },
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
    activitySection: 'Your activity',
    transcriptionsOne: 'transcription',
    transcriptionsOther: 'transcriptions',
    dictated: 'dictated',
    wordsOne: 'word transcribed',
    wordsOther: 'words transcribed',
    wpmLabel: 'words per minute',
    recentSection: 'Recent transcriptions',
    empty: 'No transcriptions yet. Try your hotkey.',
    seeMore: 'See all in History',
  },
  dateGroups: {
    today: 'Today',
    yesterday: 'Yesterday',
  },
  history: {
    title: 'History',
    clearAll: 'Clear all',
    confirmClear: 'Clear the entire history?',
    empty: 'No transcriptions yet. Try your hotkey.',
    copy: 'Copy',
    copied: 'Copied',
    delete: 'Delete',
    savingDisabledTitle: 'History saving is turned off',
    savingDisabledHint:
      'Your transcriptions are not being saved, so they cannot show up here. Turn the history back on in Settings to see them again.',
    savingDisabledCta: 'Open settings',
  },
  settings: {
    hotkey: {
      title: 'Keyboard shortcut',
      description: 'Press it from any app to start and stop recording.',
      change: 'Change',
      cancel: 'Cancel',
      waiting: 'Press the keys you want to use…',
    },
    handsFree: {
      title: 'Recording mode',
      description:
        'Choose how the shortcut starts and stops a recording.',
      pushToTalk: {
        label: 'Hold to talk',
        hint: 'Hold the shortcut down while you speak; release it to stop. Tip: double-tap quickly to lock the recording so you can let go of the key.',
      },
      tapToToggle: {
        label: 'Hands-free',
        hint: 'Tap the shortcut once to start recording, tap again to stop. Best for longer dictations where you do not want to keep a key pressed.',
      },
    },
    microphone: {
      title: 'Microphone',
      description:
        'Pick which input we use to record. Falls back to the system default if your chosen device is not connected.',
      systemDefault: 'System default',
      unnamed: 'Microphone {index}',
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
      description: 'Decide whether your transcriptions are kept so you can review them later.',
      enabled: {
        label: 'Save transcriptions',
        hint: 'Stored locally on your computer only. Find them later in the History tab.',
      },
      disabled: {
        label: 'Do not save',
        hint: 'Each transcription is discarded right after the text is inserted. Nothing is kept.',
      },
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
    suppressNonSpeech: {
      title: 'Non-speech sounds',
      description:
        'Whisper can transcribe annotations like "[Music]", "[Laughter]" or "(sigh)". Choose whether they should appear in your text.',
      enabled: {
        label: 'Hide them (recommended)',
        hint: 'Only spoken words are inserted. Background sounds and noises are ignored.',
      },
      disabled: {
        label: 'Keep them',
        hint: 'Annotations like [Music] or (sigh) are included in the transcription.',
      },
    },
    vocabulary: {
      title: 'Custom vocabulary',
      description:
        'Names, brand terms or jargon Bisbi should recognise better. Used as context for every transcription.',
      placeholder: 'e.g. John, ChatGPT, New York, Excel, sprint, invoice',
      hint: 'Keep it short. Write the terms in the language you mostly dictate in.',
    },
    dangerZone: {
      title: 'Reset & data',
      description: 'These actions are permanent and cannot be undone.',
    },
    reset: 'Reset settings',
    clearHistory: 'Clear history',
    confirmReset: 'Reset all settings to their defaults?',
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
  update: {
    downloading: 'Downloading update… {percent}%',
    ready: 'Update ready: v{version}',
    restart: 'Restart',
  },
  errors: {
    hotkeyRegister: 'Could not register the shortcut "{accel}". Try another one.',
  },
  common: {
    yes: 'Yes',
    no: 'No',
  },
};

export type Translations = typeof en;
