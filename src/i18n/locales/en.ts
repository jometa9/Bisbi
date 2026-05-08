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
    limitReached: string;
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
    takeTour: string;
    backToLogin: string;
  };
  account: {
    title: string;
    plan: string;
    billing: string;
    planFree: string;
    planPro: string;
    planTrial: string;
    planCanceling: string;
    trialEnds: string;
    renewsOn: string;
    cancelsOn: string;
    refresh: string;
    refreshing: string;
    email: string;
    name: string;
    userId: string;
    manageSubscription: string;
    upgradeToPro: string;
    logout: string;
    confirmLogout: string;
    monthly: string;
    annual: string;
    month: string;
    forever: string;
    currentPlan: string;
    billingPeriod: string;
    opening: string;
    features: {
      dictation2k: string;
      unlimited: string;
      allDevices: string;
      languages: string;
      zeroRetention: string;
      priority: string;
    };
    profileSection: { title: string; description: string };
    subscriptionSection: { title: string; description: string };
    sessionSection: { title: string; description: string };
  };
  home: {
    greeting: { lateNight: string; morning: string; afternoon: string; evening: string };
    statusTitle: { idle: string; recording: string; transcribing: string };
    watermark: { idle: string; listening: string; transcribing: string };
    titleHint: string;
    hotkeyLabel: string;
    hotkeyHintPaste: string;
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
      doubleTapNotice: string;
    };
    microphone: {
      title: string;
      description: string;
      systemDefault: string;
      unnamed: string;
    };
    transcriptionLanguage: { title: string; description: string; searchPlaceholder: string };
    uiLanguage: { title: string; description: string; system: string };
    saveHistory: {
      title: string;
      description: string;
      enabled: { label: string; hint: string };
      disabled: { label: string; hint: string };
    };
    muteAudio: {
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
  keys: {
    command: string;
    leftCommand: string;
    rightCommand: string;
    control: string;
    leftControl: string;
    rightControl: string;
    option: string;
    leftOption: string;
    rightOption: string;
    alt: string;
    leftAlt: string;
    rightAlt: string;
    shift: string;
    leftShift: string;
    rightShift: string;
    win: string;
    leftWin: string;
    rightWin: string;
    ctrl: string;
    leftCtrl: string;
    rightCtrl: string;
    space: string;
    capsLock: string;
    shortLeft: string;
    shortRight: string;
  };
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
  onboarding: {
    progress: string;
    back: string;
    welcome: { title: string; subtitle: string; cta: string };
    permissions: {
      title: string;
      subtitle: string;
      grant: string;
      continue: string;
      openSettings: string;
      microphone: { title: string; description: string; deniedHint: string };
      accessibility: { title: string; description: string; deniedHint: string };
    };
    hotkey: {
      title: string;
      subtitle: string;
      recommended: string;
      custom: string;
      pickOne: string;
      confirm: string;
      conflictInUse: string;
      conflictInvalid: string;
    };
    dictation: {
      title: string;
      subtitle: string;
      samplePhrase: string;
      waiting: string;
      listening: string;
      transcribing: string;
      silenceError: string;
      failedError: string;
      continue: string;
    };
  };
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
    resourcesMissing: 'Something went wrong. Please contact support.',
    micError:
      'Could not access the microphone. Make sure Bisbi has permission in your system settings.',
    limitReached: 'You’ve hit your free plan limit for this month.',
  },
  auth: {
    welcome: 'One step away from dictating',
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
    takeTour: 'Take a tour',
    backToLogin: 'Go to login',
  },
  account: {
    title: 'Account',
    plan: 'Plan',
    billing: 'Billing',
    planFree: 'Free',
    planPro: 'Pro',
    planTrial: 'Trial',
    planCanceling: 'Canceling',
    trialEnds: 'Trial ends {date}',
    renewsOn: 'Renews {date}',
    cancelsOn: 'Cancels {date}',
    refresh: 'Refresh plan',
    refreshing: 'Refreshing…',
    email: 'Email',
    name: 'Name',
    userId: 'User ID',
    manageSubscription: 'Manage subscription',
    upgradeToPro: 'Upgrade to Pro',
    logout: 'Log out',
    confirmLogout: 'Log out of Bisbi?',
    monthly: 'Monthly',
    annual: 'Annual',
    month: 'month',
    forever: 'forever',
    currentPlan: 'Current plan',
    billingPeriod: 'Billing period',
    opening: 'Opening…',
    features: {
      dictation2k: '2,000 words / month on desktop',
      unlimited: 'Unlimited words on all devices',
      allDevices: 'Mac & Windows',
      languages: '100+ languages',
      zeroRetention: 'Zero data retention',
      priority: 'Priority support',
    },
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
    watermark: {
      idle: "I'm ready to listen",
      listening: 'Listening',
      transcribing: 'Transcribing',
    },
    titleHint: 'Press the hotkey and speak.',
    hotkeyLabel: 'Hotkey',
    hotkeyHintPaste: 'The text is pasted automatically wherever you are typing.',
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
        hint: 'Hold the shortcut down while you speak; release it to stop.',
      },
      tapToToggle: {
        label: 'Hands-free',
        hint: 'Tap the shortcut once to start recording, tap again to stop. Best for longer dictations where you do not want to keep a key pressed.',
      },
      doubleTapNotice:
        'Want to switch to hands-free on the fly? Double-tap {hotkey} quickly and the recording stays on so you can let go of the key.',
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
      description:
        'Pick the language you dictate in. Auto-detect is slower and may pick wrong on short clips.',
      searchPlaceholder: 'Search a language…',
    },
    uiLanguage: {
      title: 'App language',
      description:
        'Language used for the interface. By default it follows your operating system.',
      system: 'System ({detected})',
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
    muteAudio: {
      title: 'Mute system audio while recording',
      description:
        'Mute your computer output for the duration of the recording so background sounds do not bleed into the room.',
      enabled: {
        label: 'Mute on record',
        hint: 'The system output is muted while you dictate and the previous level is restored on stop.',
      },
      disabled: {
        label: 'Keep audio on',
        hint: 'Your output stays at the same level. Use this if you rely on hearing the audio while you talk.',
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
  keys: {
    command: 'Command',
    leftCommand: 'Left Command',
    rightCommand: 'Right Command',
    control: 'Control',
    leftControl: 'Left Control',
    rightControl: 'Right Control',
    option: 'Option',
    leftOption: 'Left Option',
    rightOption: 'Right Option',
    alt: 'Alt',
    leftAlt: 'Left Alt',
    rightAlt: 'Right Alt',
    shift: 'Shift',
    leftShift: 'Left Shift',
    rightShift: 'Right Shift',
    win: 'Win',
    leftWin: 'Left Win',
    rightWin: 'Right Win',
    ctrl: 'Ctrl',
    leftCtrl: 'Left Ctrl',
    rightCtrl: 'Right Ctrl',
    space: 'Space',
    capsLock: 'Caps Lock',
    shortLeft: 'L',
    shortRight: 'R',
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
  onboarding: {
    progress: '{current} of {total}',
    back: 'Back',
    welcome: {
      title: 'Welcome to Bisbi.',
      subtitle:
        'The fastest way to write is not to type. Let me show you in under 2 minutes.',
      cta: 'Start',
    },
    permissions: {
      title: 'Bisbi needs two permissions.',
      subtitle: "Without these, it can't work.",
      grant: 'Grant permissions',
      continue: 'Next',
      openSettings: 'Open System Settings',
      microphone: {
        title: 'Microphone',
        description:
          'So we can hear you when you speak. Your audio never leaves your computer.',
        deniedHint: "We couldn't access the mic.",
      },
      accessibility: {
        title: 'Accessibility',
        description:
          'So Bisbi can type the text wherever your cursor is, in any app.',
        deniedHint: "We couldn't get accessibility access.",
      },
    },
    hotkey: {
      title: 'Pick your shortcut.',
      subtitle: 'Hold it down to speak. Let go when you are done.',
      recommended: 'Recommended',
      custom: 'Custom…',
      pickOne: 'Pick a shortcut',
      confirm: 'Next',
      conflictInUse: 'That combination is already in use. Try another.',
      conflictInvalid: "That combination isn't supported. Try another.",
    },
    dictation: {
      title: "Let's try it.",
      subtitle: 'Hold down {hotkey} and read the phrase below out loud to try your first dictation.',
      samplePhrase:
        'Hi Bisbi, this is my first dictation. Speaking is faster than typing.',
      waiting: 'Waiting for your voice…',
      listening: 'Listening…',
      transcribing: 'Transcribing…',
      silenceError: "We can't hear you. Is your microphone connected?",
      failedError: "We couldn't transcribe. Try again.",
      continue: 'Continue',
    },
  },
};

export type Translations = typeof en;
