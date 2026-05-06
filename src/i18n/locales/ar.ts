import type { Translations } from './en';

export const ar: Translations = {
  app: {
    brand: 'Bisbi',
    tabs: {
      home: 'الرئيسية',
      history: 'السجل',
      settings: 'الإعدادات',
      account: 'الحساب',
    },
    status: {
      idle: 'جاهز',
      recording: 'يسجل',
      transcribing: 'يكتب',
    },
    loading: 'جارٍ التحميل…',
    notElectron: {
      body: 'يجب فتح هذه النافذة من خلال Electron حتى يعمل اختصار لوحة المفاتيح العام، والميكروفون، والكتابة.',
      devHint:
        'إذا كنت في وضع التطوير، شغّل {cmd} في جذر المستودع ودع Electron يفتح نافذته الخاصة. لا تفتح {url} مباشرة في المتصفح.',
    },
    resourcesMissing:
      'موارد Whisper مفقودة. راجع ملف README لمعرفة كيفية تنزيل الملف الثنائي والنموذج إلى {path}.',
    micError:
      'تعذّر الوصول إلى الميكروفون. تأكد من أن Bisbi يملك إذن الوصول في إعدادات النظام.',
  },
  auth: {
    welcome: 'مرحبًا بك في Bisbi',
    tagline: 'أسرع طريقة للإملاء في أي تطبيق.',
    signIn: 'تسجيل الدخول بحساب Google',
    authenticating: 'جارٍ المصادقة في المتصفح…',
    redirecting: 'العودة إلى التطبيق…',
    validating: 'جارٍ التحقق من الجلسة…',
    tryAgain: 'إعادة المحاولة',
    invalidToken: 'تعذّر التحقق من الجلسة. يرجى تسجيل الدخول مرة أخرى.',
    connectionError: 'خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
    noAccount: 'ليس لديك حساب؟',
    signUp: 'إنشاء حساب',
  },
  account: {
    title: 'الحساب',
    plan: 'الخطة',
    planFree: 'مجاني',
    planPro: 'Pro',
    email: 'البريد الإلكتروني',
    name: 'الاسم',
    userId: 'معرّف المستخدم',
    manageSubscription: 'إدارة الاشتراك',
    upgradeToPro: 'الترقية إلى Pro',
    logout: 'تسجيل الخروج',
    confirmLogout: 'تسجيل الخروج من Bisbi؟',
    profileSection: {
      title: 'الملف الشخصي',
      description: 'كيف يتعرّف Bisbi عليك عبر الأجهزة.',
    },
    subscriptionSection: {
      title: 'الاشتراك',
      description: 'إدارة خطتك والفوترة.',
    },
    sessionSection: {
      title: 'الجلسة',
      description: 'تسجيل الخروج من هذا الجهاز.',
    },
  },
  home: {
    greeting: {
      lateNight: 'تصبح على خير',
      morning: 'صباح الخير',
      afternoon: 'مساء الخير',
      evening: 'مساء الخير',
    },
    statusTitle: {
      idle: 'جاهز للاستماع',
      recording: 'يسجل الآن',
      transcribing: 'يكتب',
    },
    titleHint: 'اضغط الاختصار وتحدّث.',
    hotkeyLabel: 'الاختصار',
    hotkeyHintPaste: 'يتم لصق النص تلقائيًا حيث تكتب.',
    hotkeyHintClipboard: 'يتم نسخ النص إلى الحافظة.',
    activitySection: 'نشاطك',
    transcriptionsOne: 'كتابة',
    transcriptionsOther: 'كتابات',
    dictated: 'إملاء',
    wordsOne: 'كلمة مكتوبة',
    wordsOther: 'كلمة مكتوبة',
    wpmLabel: 'كلمة في الدقيقة',
    recentSection: 'الكتابات الأخيرة',
    empty: 'لا توجد كتابات بعد. جرّب الاختصار.',
    seeMore: 'عرض الكل في السجل',
  },
  dateGroups: {
    today: 'اليوم',
    yesterday: 'أمس',
  },
  history: {
    title: 'السجل',
    clearAll: 'مسح الكل',
    confirmClear: 'هل تريد مسح كامل السجل؟',
    empty: 'لا توجد كتابات بعد. جرّب الاختصار.',
    copy: 'نسخ',
    copied: 'تم النسخ',
    delete: 'حذف',
    savingDisabledTitle: 'حفظ السجل متوقف',
    savingDisabledHint: 'لا يتم حفظ كتاباتك، لذلك لا يمكن أن تظهر هنا. أعد تفعيل السجل من الإعدادات لرؤيتها مرة أخرى.',
    savingDisabledCta: 'فتح الإعدادات',
  },
  settings: {
    hotkey: {
      title: 'اختصار لوحة المفاتيح',
      description: 'اضغطه من أي تطبيق لبدء التسجيل وإيقافه.',
      change: 'تغيير',
      cancel: 'إلغاء',
      waiting: 'اضغط على المفاتيح التي تريد استخدامها…',
    },
    handsFree: {
      title: 'وضع التسجيل',
      description: 'اختر كيف يبدأ الاختصار التسجيل ويوقفه.',
      pushToTalk: {
        label: 'اضغط مع الاستمرار للتحدث',
        hint: 'استمر في الضغط على الاختصار أثناء التحدث، واتركه ليتوقف. نصيحة: انقر نقرتين سريعتين لتثبيت التسجيل حتى تتمكن من ترك المفتاح.',
      },
      tapToToggle: {
        label: 'وضع حر اليدين',
        hint: 'انقر الاختصار مرة لبدء التسجيل، وانقر مرة أخرى لإيقافه. مناسب للإملاءات الطويلة عندما لا تريد إبقاء أي مفتاح مضغوطًا.',
      },
    },
    microphone: {
      title: 'الميكروفون',
      description:
        'اختر جهاز الإدخال المستخدم للتسجيل. إذا لم يكن الجهاز المختار متصلًا، نعود إلى الافتراضي للنظام.',
      systemDefault: 'افتراضي النظام',
      unnamed: 'ميكروفون {index}',
    },
    transcriptionLanguage: {
      title: 'لغة الكتابة',
      description: 'يكتشف Whisper اللغة تلقائيًا. ثبّتها لمزيد من السرعة.',
    },
    uiLanguage: {
      title: 'لغة التطبيق',
      description: 'اللغة المستخدمة في الواجهة. تتبع نظام التشغيل افتراضيًا.',
      system: 'النظام ({detected})',
    },
    pasteMode: {
      title: 'إدراج النص',
      description: 'كيف نُسلّم النص المكتوب.',
      paste: 'لصق تلقائي (Cmd/Ctrl+V) في التطبيق النشط',
      clipboard: 'النسخ إلى الحافظة فقط (سألصقه بنفسي)',
    },
    saveHistory: {
      title: 'السجل',
      description: 'حدّد ما إذا كنا سنحتفظ بكتاباتك لتراجعها لاحقًا.',
      enabled: {
        label: 'حفظ الكتابات',
        hint: 'تُخزَّن محليًا على جهازك فقط. يمكنك العثور عليها لاحقًا في تبويب السجل.',
      },
      disabled: {
        label: 'عدم الحفظ',
        hint: 'تُهمل كل كتابة بمجرد إدراج النص. لا يبقى أي سجل.',
      },
    },
    precision: {
      title: 'دقة الكتابة',
      description:
        'الدقة الأعلى تعطي نتائج أفضل لكنها تستغرق وقتًا وموارد أكثر. غيّرها إذا لاحظت أخطاء.',
      fast: {
        label: 'سريع',
        hint: 'جهد أقل وكتابة شبه فورية. مثالي إذا كنت تتحدث بوضوح وبلغة واحدة.',
      },
      balanced: {
        label: 'متوازن (موصى به)',
        hint: 'توازن جيد بين السرعة والجودة للاستخدام اليومي.',
      },
      high: {
        label: 'عالٍ',
        hint: 'جهد أكبر وأبطأ، لكن أفضل مع لغات مختلطة أو مصطلحات تقنية أو صوت مزعج.',
      },
    },
    suppressNonSpeech: {
      title: 'الأصوات غير الكلامية',
      description:
        'يمكن لـ Whisper نسخ تعليقات مثل "[موسيقى]" أو "[ضحك]" أو "(تنهيدة)". اختر ما إذا كنت تريد ظهورها في النص.',
      enabled: {
        label: 'إخفاؤها (موصى به)',
        hint: 'يتم إدراج الكلمات المنطوقة فقط. يتم تجاهل الأصوات والضوضاء في الخلفية.',
      },
      disabled: {
        label: 'الاحتفاظ بها',
        hint: 'تظهر التعليقات مثل [موسيقى] أو (تنهيدة) ضمن النص المنسوخ.',
      },
    },
    vocabulary: {
      title: 'مفردات مخصصة',
      description:
        'أسماء أو علامات تجارية أو مصطلحات تقنية ينبغي أن يتعرف عليها Bisbi بشكل أفضل. تُستخدم كسياق لكل عملية نسخ.',
      placeholder: 'مثال: محمد، ChatGPT، القاهرة، Excel، سبرينت، فاتورة',
      hint: 'اجعلها قصيرة. اكتب المصطلحات باللغة التي تُملي بها في الغالب.',
    },
    dangerZone: {
      title: 'إعادة الضبط والبيانات',
      description: 'هذه الإجراءات نهائية ولا يمكن التراجع عنها.',
    },
    reset: 'إعادة ضبط الإعدادات',
    clearHistory: 'مسح السجل',
    confirmReset: 'إعادة جميع الإعدادات إلى قيمها الافتراضية؟',
  },
  recording: {
    recording: 'يسجل',
    transcribing: 'يكتب…',
    idle: 'جاهز',
  },
  languages: {
    auto: 'كشف تلقائي',
    en: 'الإنجليزية',
    es: 'الإسبانية',
    pt: 'البرتغالية',
    fr: 'الفرنسية',
    it: 'الإيطالية',
    de: 'الألمانية',
    zh: 'الصينية',
    hi: 'الهندية',
    ar: 'العربية',
  },
  uiLanguageOption: {
    en: 'English',
    es: 'Español',
    zh: '中文',
    hi: 'हिन्दी',
    ar: 'العربية',
  },
  tray: {
    tooltipIdle: 'Bisbi — جاهز للإملاء',
    tooltipRecording: 'Bisbi — يسجل…',
    tooltipTranscribing: 'Bisbi — يكتب…',
    openSettings: 'فتح الإعدادات',
    history: 'السجل',
    checkUpdates: 'البحث عن تحديثات',
    version: 'الإصدار {v}',
    quit: 'خروج',
  },
  update: {
    downloading: 'جارٍ تنزيل التحديث… {percent}%',
    ready: 'التحديث جاهز: v{version}',
    restart: 'إعادة التشغيل',
  },
  errors: {
    hotkeyRegister: 'تعذّر تسجيل الاختصار "{accel}". جرّب اختصارًا آخر.',
  },
  common: {
    yes: 'نعم',
    no: 'لا',
  },
};
