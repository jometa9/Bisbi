import { useEffect, useState, type ReactNode } from 'react';
import { I18nProvider, type UiLanguageSetting } from './index';

interface Props {
  children: ReactNode;
}

// Bootstraps the i18n layer: pulls the persisted UI language setting and the
// OS locale (via Electron) before rendering the tree. Subscribes to settings
// changes so switching language in the UI re-renders translations live.
//
// While running outside Electron (window.bisbi missing), defaults to system
// language using navigator.language and falls back to English.
export function I18nGate({ children }: Props) {
  const [setting, setSetting] = useState<UiLanguageSetting | null>(null);
  const [systemLocale, setSystemLocale] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const api = window.bisbi;
    if (!api) {
      // Renderer opened directly in the browser (dev fallback). Use the
      // browser locale so the not-Electron warning still gets translated.
      setSetting('system');
      setSystemLocale(typeof navigator !== 'undefined' ? navigator.language : 'en');
      return;
    }

    void Promise.all([api.getSettings(), api.getSystemLocale()]).then(
      ([s, locale]) => {
        if (cancelled) return;
        setSetting(s.uiLanguage);
        setSystemLocale(locale);
      }
    );

    const off = api.onSettingsChange((s) => {
      if (cancelled) return;
      setSetting(s.uiLanguage);
    });

    return () => {
      cancelled = true;
      off();
    };
  }, []);

  if (setting === null) {
    // Tiny loading placeholder; once settings arrive we re-render with the
    // provider in place. Keep this dependency-free so it works without i18n.
    return <div className="loading">…</div>;
  }

  return (
    <I18nProvider setting={setting} systemLocale={systemLocale}>
      {children}
    </I18nProvider>
  );
}
