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
    missingApiKey: string;
    invalidApiKey: string;
    updateAvailable: string;
    updateAction: string;
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
    openaiKey: {
      title: string;
      description: string;
      show: string;
      hide: string;
      save: string;
      saved: string;
      clear: string;
      hint: string;
    };
    openaiModel: {
      title: string;
      description: string;
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
    skip: string;
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
    resourcesMissing: 'Something went wrong loading local resources. Try reinstalling Bisbi.',
    micError:
      'Could not access the microphone. Make sure Bisbi has permission in your system settings.',
    missingApiKey: 'Add your OpenAI API key in Settings to use online transcription.',
    invalidApiKey: 'OpenAI rejected your API key. Check it in Settings.',
    updateAvailable: 'A new version of Bisbi is available.',
    updateAction: 'Download',
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
    wordsOne: 'word',
    wordsOther: 'words',
    wpmLabel: 'wpm',
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
        hint: 'Runs entirely on this computer with a lightweight model — your voice never leaves the device. Quality is lower than the online OpenAI models.',
      },
      cloud: {
        label: 'Online (OpenAI)',
        hint: 'Sends audio directly to OpenAI using your own API key. Best quality. You are billed by OpenAI; Bisbi never sees your audio or key.',
      },
    },
    openaiKey: {
      title: 'OpenAI API key',
      description: 'Stored locally on this device and used only to call OpenAI.',
      show: 'Show',
      hide: 'Hide',
      save: 'Save',
      saved: 'Saved',
      clear: 'Clear',
      hint: 'Create one at',
    },
    openaiModel: {
      title: 'OpenAI transcription model',
      description: 'Which OpenAI model to send your audio to.',
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
    skip: 'Skip',
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
