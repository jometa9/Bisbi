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
      'موارد Bisbi مفقودة. راجع ملف README لمعرفة كيفية تنزيل الملف الثنائي والنموذج إلى {path}.',
    micError:
      'تعذّر الوصول إلى الميكروفون. تأكد من أن Bisbi يملك إذن الوصول في إعدادات النظام.',
    limitReached: 'لقد بلغت حد الخطة المجانية لهذا الشهر.',
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
    takeTour: 'شاهد كيف يعمل',
    backToLogin: 'العودة لتسجيل الدخول',
  },
  account: {
    title: 'الحساب',
    plan: 'الخطة',
    billing: 'الفوترة',
    planFree: 'مجاني',
    planPro: 'Pro',
    planTrial: 'تجريبي',
    planCanceling: 'جارٍ الإلغاء',
    trialEnds: 'تنتهي التجربة {date}',
    renewsOn: 'يتجدد {date}',
    cancelsOn: 'يُلغى {date}',
    refresh: 'تحديث الخطة',
    refreshing: 'جارٍ التحديث…',
    email: 'البريد الإلكتروني',
    name: 'الاسم',
    userId: 'معرّف المستخدم',
    manageSubscription: 'إدارة الاشتراك',
    upgradeToPro: 'الترقية إلى Pro',
    logout: 'تسجيل الخروج',
    confirmLogout: 'تسجيل الخروج من Bisbi؟',
    monthly: 'شهري',
    annual: 'سنوي',
    month: 'شهر',
    forever: 'للأبد',
    currentPlan: 'الخطة الحالية',
    billingPeriod: 'دورة الفوترة',
    opening: 'جارٍ الفتح…',
    features: {
      dictation2k: '2,000 كلمة/شهر على سطح المكتب',
      unlimited: 'كلمات غير محدودة على جميع الأجهزة',
      allDevices: 'Mac وWindows',
      languages: 'أكثر من 100 لغة',
      zeroRetention: 'عدم الاحتفاظ بالبيانات',
      priority: 'دعم ذو أولوية',
    },
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
    watermark: {
      listening: 'يستمع',
      transcribing: 'يكتب',
    },
    titleHint: 'اضغط الاختصار وتحدّث.',
    hotkeyLabel: 'الاختصار',
    hotkeyHintPaste: 'يتم لصق النص تلقائيًا حيث تكتب.',
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
        hint: 'استمر في الضغط على الاختصار أثناء التحدث، واتركه ليتوقف.',
      },
      tapToToggle: {
        label: 'وضع حر اليدين',
        hint: 'انقر الاختصار مرة لبدء التسجيل، وانقر مرة أخرى لإيقافه. مناسب للإملاءات الطويلة عندما لا تريد إبقاء أي مفتاح مضغوطًا.',
      },
      doubleTapNotice:
        'هل تريد التبديل إلى وضع حر اليدين أثناء العمل؟ انقر نقرًا مزدوجًا سريعًا على {hotkey} ليبقى التسجيل مستمرًا فتتمكن من ترك المفتاح.',
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
      description: 'يكتشف Bisbi اللغة تلقائيًا. ثبّتها لمزيد من السرعة.',
      searchPlaceholder: 'ابحث عن لغة…',
    },
    uiLanguage: {
      title: 'لغة التطبيق',
      description: 'اللغة المستخدمة في الواجهة. تتبع نظام التشغيل افتراضيًا.',
      system: 'النظام ({detected})',
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
        hint: 'كتابة شبه فورية بنموذج أخف. مثالي إذا كنت تتحدث بوضوح وبلغة واحدة.',
      },
      accurate: {
        label: 'دقيق (موصى به)',
        hint: 'الخيار الأكثر دقة. أبطأ وأثقل، لكنه الأفضل مع لغات مختلطة أو مصطلحات تقنية أو صوت مزعج أو تعدد المتحدثين.',
      },
    },
    muteAudio: {
      title: 'كتم صوت النظام أثناء التسجيل',
      description:
        'كتم صوت مخرجات الكمبيوتر طوال مدة التسجيل لمنع تسرب الأصوات الخلفية إلى الغرفة.',
      enabled: {
        label: 'كتم عند التسجيل',
        hint: 'يتم كتم صوت النظام أثناء الإملاء واستعادة المستوى السابق عند التوقف.',
      },
      disabled: {
        label: 'إبقاء الصوت',
        hint: 'يبقى مستوى الصوت كما هو. استخدمه إذا كنت تحتاج إلى سماع الصوت أثناء التحدث.',
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
  onboarding: {
    progress: '{current} من {total}',
    back: 'رجوع',
    welcome: {
      title: 'مرحبًا بك في Bisbi.',
      subtitle:
        'أسرع طريقة للكتابة هي ألّا تكتب. سأريك ذلك في أقل من دقيقتين.',
      cta: 'لنبدأ',
    },
    permissions: {
      title: 'يحتاج Bisbi إلى صلاحيتين.',
      subtitle: 'لا يمكنه العمل بدونهما.',
      grant: 'منح الصلاحيات',
      continue: 'متابعة',
      openSettings: 'فتح إعدادات النظام',
      microphone: {
        title: 'الميكروفون',
        description:
          'لنسمعك عندما تتحدث. لا يغادر صوتك جهازك أبدًا.',
        deniedHint: 'تعذّر الوصول إلى الميكروفون.',
      },
      accessibility: {
        title: 'إمكانية الوصول',
        description:
          'كي يستطيع Bisbi كتابة النص حيث يوجد المؤشر، في أي تطبيق.',
        deniedHint: 'تعذّر الحصول على إذن إمكانية الوصول.',
      },
    },
    hotkey: {
      title: 'بأي مفتاح تريد تشغيل Bisbi؟',
      subtitle: 'اضغط مع الاستمرار للتحدث. حرّر المفتاح عند الانتهاء.',
      recommended: 'موصى به',
      custom: 'تخصيص…',
      pickOne: 'اختر اختصارًا',
      confirm: 'تأكيد',
      conflictInUse: 'هذا التركيب مستخدم بالفعل. جرّب آخر.',
      conflictInvalid: 'هذا التركيب غير مدعوم. جرّب آخر.',
    },
    dictation: {
      title: 'لنجرّب.',
      subtitle: 'اضغط مع الاستمرار',
      waiting: 'في انتظار صوتك…',
      listening: 'جارٍ الاستماع…',
      transcribing: 'جارٍ التفريغ…',
      silenceError: 'لا نسمعك. هل الميكروفون متصل؟',
      failedError: 'تعذّر التفريغ. حاول مرة أخرى.',
      retry: 'حاول مجددًا',
      continue: 'متابعة',
      skip: 'تخطّي والإعداد لاحقًا',
    },
    account: {
      title: 'نجح الأمر، أليس كذلك؟',
      subtitle:
        'أنشئ حسابك لحفظ إعداداتك والبدء باستخدام Bisbi.',
      signIn: 'المتابعة باستخدام Google',
      microcopy: 'مجاني للبدء. لا حاجة إلى بطاقة ائتمان.',
    },
  },
};
