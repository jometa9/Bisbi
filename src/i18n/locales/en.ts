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
    updateAvailable: string;
    updateAction: string;
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
    transcriptionMode: {
      title: string;
      description: string;
      offline: { label: string; hint: string };
      cloud: { label: string; hint: string };
    };
    uiLanguage: { title: string; description: string; system: string };
    openAtLogin: {
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
    dangerZone: { title: string; description: string };
    reset: string;
    clearHistory: string;
    confirmReset: string;
  };
  recording: { recording: string; transcribing: string; idle: string };
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
    quit: string;
  };
  errors: { hotkeyRegister: string };
  common: { yes: string; no: string };
  onboarding: {
    progress: string;
    back: string;
    welcome: {
      title: string;
      subtitle: string;
      cta: string;
    };
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
    updateAvailable: 'A new version of Bisbi is available.',
    updateAction: 'Download',
  },
  auth: {
    welcome: 'You know how it works now.',
    tagline: 'Create your free account or sign in.',
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
      languages: '99 languages',
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
  },
  settings: {
    hotkey: {
      title: 'Keyboard shortcut',
      description: 'Global shortcut to record.',
      change: 'Change',
      cancel: 'Cancel',
      waiting: 'Press the keys you want to use…',
    },
    handsFree: {
      title: 'Recording mode',
      description: 'How the shortcut behaves.',
      pushToTalk: {
        label: 'Push to talk',
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
      description: 'Audio input. Falls back to the system default.',
      systemDefault: 'System default',
      unnamed: 'Microphone {index}',
    },
    transcriptionMode: {
      title: 'Transcription mode',
      description: 'Where transcription runs.',
      offline: {
        label: 'Offline',
        hint: 'Runs entirely on this computer with a lightweight model — your voice never leaves the device. Quality is noticeably lower than online, especially with accents, names and noisy audio. Use online for better results.',
      },
      cloud: {
        label: 'Online',
        hint: 'Best quality transcription using our servers. Requires internet. We do not store your audio or transcripts — we process them and return the result.',
      },
    },
    uiLanguage: {
      title: 'App language',
      description: 'Interface language.',
      system: 'System ({detected})',
    },
    openAtLogin: {
      title: 'Launch at startup',
      description: 'Open Bisbi at system startup.',
      enabled: {
        label: 'On',
        hint: 'Bisbi starts in the background when you log in.',
      },
      disabled: {
        label: 'Off',
        hint: 'You will need to open Bisbi manually.',
      },
    },
    muteAudio: {
      title: 'Mute system audio while recording',
      description: 'Mute system output while recording.',
      enabled: {
        label: 'On',
        hint: 'Output is muted while dictating; restored on stop.',
      },
      disabled: {
        label: 'Off',
        hint: 'Output stays at the same level.',
      },
    },
    dangerZone: {
      title: 'Reset & data',
      description: 'Permanent actions.',
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
    quit: 'Quit',
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
      title: 'You type slow. Talking is 3× faster.',
      subtitle:
        'Bisbi turns your voice into text in any app — in under 2 seconds.',
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
      title: 'Your first dictation.',
      subtitle: 'Hold {hotkey} down and read this out loud:',
      samplePhrase:
        'Meeting with the team on Monday at 10. Bring the sales deck.',
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
