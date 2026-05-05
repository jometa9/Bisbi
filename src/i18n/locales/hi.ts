import type { Translations } from './en';

export const hi: Translations = {
  app: {
    brand: 'Bisbi',
    tabs: {
      home: 'होम',
      history: 'इतिहास',
      settings: 'सेटिंग्स',
    },
    status: {
      idle: 'तैयार',
      recording: 'रिकॉर्डिंग',
      transcribing: 'ट्रांसक्राइब हो रहा है',
    },
    loading: 'लोड हो रहा है…',
    notElectron: {
      body: 'ग्लोबल हॉटकी, माइक्रोफ़ोन और ट्रांसक्रिप्शन काम करने के लिए यह विंडो Electron से खोली जानी चाहिए।',
      devHint:
        'अगर आप डेवलपमेंट में हैं, तो रेपो की जड़ में {cmd} चलाएँ और Electron को अपनी विंडो खोलने दें। ब्राउज़र में सीधे {url} न खोलें।',
    },
    resourcesMissing:
      'Whisper के संसाधन गायब हैं। बाइनरी और मॉडल को {path} में डाउनलोड करने के लिए README देखें।',
    micError:
      'माइक्रोफ़ोन तक पहुँच नहीं हो सकी। सुनिश्चित करें कि Bisbi को सिस्टम सेटिंग्स में अनुमति प्राप्त है।',
  },
  home: {
    greeting: {
      lateNight: 'शुभ रात्रि',
      morning: 'सुप्रभात',
      afternoon: 'नमस्कार',
      evening: 'शुभ संध्या',
    },
    statusTitle: {
      idle: 'सुनने के लिए तैयार',
      recording: 'अभी रिकॉर्ड हो रहा है',
      transcribing: 'ट्रांसक्राइब हो रहा है',
    },
    titleHint: 'हॉटकी दबाएँ और बोलें।',
    hotkeyLabel: 'हॉटकी',
    hotkeyHintPaste: 'जहाँ आप टाइप कर रहे हैं, वहाँ टेक्स्ट अपने आप पेस्ट हो जाता है।',
    hotkeyHintClipboard: 'टेक्स्ट क्लिपबोर्ड पर कॉपी हो जाता है।',
    todaySection: 'आज',
    transcriptionsOne: 'ट्रांसक्रिप्शन',
    transcriptionsOther: 'ट्रांसक्रिप्शन',
    dictated: 'श्रुतलेख',
    lastLanguage: 'अंतिम भाषा',
    lastTranscriptionSection: 'पिछला ट्रांसक्रिप्शन',
    empty: 'अभी तक कोई ट्रांसक्रिप्शन नहीं। अपनी हॉटकी आज़माएँ।',
    relative: {
      justNow: 'अभी अभी',
      minutes: '{n} मिनट पहले',
      hours: '{n} घंटे पहले',
      days: '{n} दिन पहले',
    },
  },
  history: {
    title: 'हाल ही के ट्रांसक्रिप्शन',
    clearAll: 'सभी हटाएँ',
    confirmClear: 'पूरा इतिहास हटाएँ?',
    empty: 'अभी तक कोई ट्रांसक्रिप्शन नहीं। अपनी हॉटकी आज़माएँ।',
    copy: 'कॉपी',
    delete: 'हटाएँ',
  },
  settings: {
    hotkey: {
      title: 'कीबोर्ड शॉर्टकट',
      description: 'रिकॉर्डिंग शुरू और बंद करने के लिए किसी भी ऐप से इसे दबाएँ।',
      change: 'बदलें',
      cancel: 'रद्द करें',
    },
    transcriptionLanguage: {
      title: 'ट्रांसक्रिप्शन भाषा',
      description: 'Whisper स्वतः भाषा का पता लगाता है। तेज़ी के लिए इसे फ़िक्स करें।',
    },
    uiLanguage: {
      title: 'ऐप भाषा',
      description: 'इंटरफ़ेस की भाषा। डिफ़ॉल्ट रूप से सिस्टम का अनुसरण करती है।',
      system: 'सिस्टम ({detected})',
    },
    pasteMode: {
      title: 'टेक्स्ट सम्मिलन',
      description: 'हम ट्रांसक्राइब किया गया टेक्स्ट कैसे देते हैं।',
      paste: 'सक्रिय ऐप में अपने आप पेस्ट करें (Cmd/Ctrl+V)',
      clipboard: 'सिर्फ़ क्लिपबोर्ड पर कॉपी करें (मैं ख़ुद पेस्ट करूँगा)',
    },
    saveHistory: {
      title: 'इतिहास',
      description: 'ट्रांसक्रिप्शन को स्थानीय डेटाबेस में सहेजता है।',
      label: 'इतिहास में ट्रांसक्रिप्शन सहेजें',
    },
    precision: {
      title: 'ट्रांसक्रिप्शन सटीकता',
      description:
        'अधिक सटीकता बेहतर परिणाम देती है लेकिन इसमें अधिक समय और संसाधन लगते हैं। ग़लतियाँ दिखें तो बदल लें।',
      fast: {
        label: 'तेज़',
        hint: 'कम प्रयास, लगभग तुरंत ट्रांसक्रिप्शन। एक ही भाषा में स्पष्ट बोलने पर आदर्श।',
      },
      balanced: {
        label: 'संतुलित (अनुशंसित)',
        hint: 'दैनिक उपयोग के लिए गति और गुणवत्ता के बीच अच्छा संतुलन।',
      },
      high: {
        label: 'उच्च',
        hint: 'अधिक प्रयास और धीमा, लेकिन मिश्रित भाषाओं, तकनीकी शब्दों या शोर भरे ऑडियो के लिए बेहतर।',
      },
    },
    reset: 'सेटिंग्स रीसेट करें',
  },
  recording: {
    recording: 'रिकॉर्डिंग',
    transcribing: 'ट्रांसक्राइब हो रहा है…',
    idle: 'तैयार',
  },
  languages: {
    auto: 'स्वतः पहचानें',
    en: 'अंग्रेज़ी',
    es: 'स्पेनिश',
    pt: 'पुर्तगाली',
    fr: 'फ़्रेंच',
    it: 'इतालवी',
    de: 'जर्मन',
    zh: 'चीनी',
    hi: 'हिन्दी',
    ar: 'अरबी',
  },
  uiLanguageOption: {
    en: 'English',
    es: 'Español',
    zh: '中文',
    hi: 'हिन्दी',
    ar: 'العربية',
  },
  tray: {
    tooltipIdle: 'Bisbi — श्रुतलेख के लिए तैयार',
    tooltipRecording: 'Bisbi — रिकॉर्डिंग…',
    tooltipTranscribing: 'Bisbi — ट्रांसक्राइब हो रहा है…',
    openSettings: 'सेटिंग्स खोलें',
    history: 'इतिहास',
    checkUpdates: 'अपडेट देखें',
    version: 'संस्करण {v}',
    quit: 'बाहर निकलें',
  },
  errors: {
    hotkeyRegister: 'शॉर्टकट "{accel}" को रजिस्टर नहीं किया जा सका। कोई और आज़माएँ।',
  },
};
