import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { en, type Translations } from './locales/en';
import { es } from './locales/es';
import { zh } from './locales/zh';
import { hi } from './locales/hi';
import { ar } from './locales/ar';

export const SUPPORTED_UI_LANGUAGES = ['en', 'es', 'zh', 'hi', 'ar'] as const;
export type UiLanguage = (typeof SUPPORTED_UI_LANGUAGES)[number];
export type UiLanguageSetting = UiLanguage | 'system';

const DICTIONARIES: Record<UiLanguage, Translations> = { en, es, zh, hi, ar };

const RTL_LANGUAGES: ReadonlySet<UiLanguage> = new Set(['ar']);

export function isRtl(lang: UiLanguage): boolean {
  return RTL_LANGUAGES.has(lang);
}

export function resolveUiLanguage(
  setting: UiLanguageSetting,
  systemLocale: string | null | undefined
): UiLanguage {
  if (setting !== 'system') return setting;
  return matchLocale(systemLocale ?? '') ?? 'en';
}

export function matchLocale(locale: string): UiLanguage | null {
  if (!locale) return null;
  const lower = locale.toLowerCase().replace('_', '-');
  const primary = lower.split('-')[0] ?? '';
  if ((SUPPORTED_UI_LANGUAGES as readonly string[]).includes(primary)) {
    return primary as UiLanguage;
  }
  return null;
}

type Path<T, P extends string = ''> = T extends string
  ? P
  : {
      [K in keyof T & string]: Path<T[K], P extends '' ? K : `${P}.${K}`>;
    }[keyof T & string];

export type TranslationKey = Path<Translations>;

type Vars = Record<string, string | number>;

function lookup(dict: Translations, key: string): string {
  const parts = key.split('.');
  let cursor: unknown = dict;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as object)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof cursor === 'string' ? cursor : key;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const v = vars[name];
    return v == null ? `{${name}}` : String(v);
  });
}

interface I18nContextValue {
  language: UiLanguage;
  setting: UiLanguageSetting;
  systemLocale: string | null;
  t: (key: TranslationKey, vars?: Vars) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  setting: UiLanguageSetting;
  systemLocale: string | null;
  children: ReactNode;
}

export function I18nProvider({ setting, systemLocale, children }: I18nProviderProps) {
  const language = useMemo(
    () => resolveUiLanguage(setting, systemLocale),
    [setting, systemLocale]
  );
  const dir: 'ltr' | 'rtl' = isRtl(language) ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const t = useCallback(
    (key: TranslationKey, vars?: Vars): string => {
      const dict = DICTIONARIES[language] ?? en;
      const raw = lookup(dict, key);
      return interpolate(raw, vars);
    },
    [language]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, setting, systemLocale, t, dir }),
    [language, setting, systemLocale, t, dir]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used inside <I18nProvider>');
  return ctx;
}
