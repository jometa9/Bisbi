import { app } from 'electron';
import type { UiLanguage, UiLanguageSetting } from './types';

interface BackendStrings {
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
  errors: {
    hotkeyRegister: string;
  };
}

const en: BackendStrings = {
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

const es: BackendStrings = {
  tray: {
    tooltipIdle: 'Bisbi — listo para dictar',
    tooltipRecording: 'Bisbi — grabando…',
    tooltipTranscribing: 'Bisbi — transcribiendo…',
    openSettings: 'Abrir ajustes',
    history: 'Historial',
    checkUpdates: 'Buscar actualizaciones',
    version: 'Versión {v}',
    quit: 'Salir',
  },
  errors: {
    hotkeyRegister: 'No se pudo registrar el atajo "{accel}". Probá otro.',
  },
};

const zh: BackendStrings = {
  tray: {
    tooltipIdle: 'Bisbi — 准备口述',
    tooltipRecording: 'Bisbi — 录音中…',
    tooltipTranscribing: 'Bisbi — 转写中…',
    openSettings: '打开设置',
    history: '历史记录',
    checkUpdates: '检查更新',
    version: '版本 {v}',
    quit: '退出',
  },
  errors: {
    hotkeyRegister: '无法注册快捷键 “{accel}”。请尝试其他组合。',
  },
};

const hi: BackendStrings = {
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

const ar: BackendStrings = {
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

const DICTS: Record<UiLanguage, BackendStrings> = { en, es, zh, hi, ar };

const SUPPORTED: ReadonlyArray<UiLanguage> = ['en', 'es', 'zh', 'hi', 'ar'];

export function matchUiLanguage(locale: string | null | undefined): UiLanguage | null {
  if (!locale) return null;
  const primary = locale.toLowerCase().replace('_', '-').split('-')[0] ?? '';
  return (SUPPORTED as readonly string[]).includes(primary)
    ? (primary as UiLanguage)
    : null;
}

export function getSystemLocale(): string {
  try {
    return app.getLocale() || '';
  } catch {
    return '';
  }
}

export function resolveUiLanguage(setting: UiLanguageSetting): UiLanguage {
  if (setting !== 'system') return setting;
  return matchUiLanguage(getSystemLocale()) ?? 'en';
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const v = vars[name];
    return v == null ? `{${name}}` : String(v);
  });
}

export function getBackendStrings(lang: UiLanguage): BackendStrings {
  return DICTS[lang] ?? en;
}

export function tBackend(
  lang: UiLanguage,
  // Path through BackendStrings (e.g. 'tray.openSettings'). Kept loose because
  // the surface is small and this is only used in the main process.
  key: string,
  vars?: Record<string, string | number>
): string {
  const dict = DICTS[lang] ?? en;
  const parts = key.split('.');
  let cursor: unknown = dict;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as object)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof cursor === 'string' ? interpolate(cursor, vars) : key;
}
