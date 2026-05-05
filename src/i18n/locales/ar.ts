import type { Translations } from './en';

export const ar: Translations = {
  app: {
    brand: 'Bisbi',
    tabs: {
      home: 'الرئيسية',
      history: 'السجل',
      settings: 'الإعدادات',
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
    todaySection: 'اليوم',
    transcriptionsOne: 'كتابة',
    transcriptionsOther: 'كتابات',
    dictated: 'إملاء',
    lastLanguage: 'آخر لغة',
    lastTranscriptionSection: 'آخر كتابة',
    empty: 'لا توجد كتابات بعد. جرّب الاختصار.',
    relative: {
      justNow: 'الآن',
      minutes: 'منذ {n} دقيقة',
      hours: 'منذ {n} ساعة',
      days: 'منذ {n} يوم',
    },
  },
  history: {
    title: 'الكتابات الأخيرة',
    clearAll: 'مسح الكل',
    confirmClear: 'هل تريد مسح كامل السجل؟',
    empty: 'لا توجد كتابات بعد. جرّب الاختصار.',
    copy: 'نسخ',
    delete: 'حذف',
  },
  settings: {
    hotkey: {
      title: 'اختصار لوحة المفاتيح',
      description: 'اضغطه من أي تطبيق لبدء التسجيل وإيقافه.',
      change: 'تغيير',
      cancel: 'إلغاء',
    },
    handsFree: {
      title: 'وضع التسجيل التلقائي',
      description:
        'عند إيقاف التشغيل، استمر في الضغط على الاختصار للتسجيل (اضغط للتحدث). النقر المزدوج السريع يثبّت التسجيل حتى تنقر مرة أخرى.',
      label: 'انقر للبدء، انقر للإيقاف',
      hintOn: 'مفعّل: انقر الاختصار مرة للبدء، انقر مرة أخرى للإيقاف.',
      hintOff:
        'متوقف: استمر في الضغط على الاختصار للتسجيل. النقر المزدوج السريع يثبّت التسجيل حتى تتمكن من ترك المفتاح.',
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
      description: 'يحفظ الكتابات في قاعدة بيانات محلية.',
      label: 'حفظ الكتابات في السجل',
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
    reset: 'إعادة ضبط الإعدادات',
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
  errors: {
    hotkeyRegister: 'تعذّر تسجيل الاختصار "{accel}". جرّب اختصارًا آخر.',
  },
};
