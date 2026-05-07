import { useEffect, useState, type ReactNode } from 'react';
import { I18nProvider, type UiLanguageSetting } from './index';

interface Props {
  children: ReactNode;
}

export function I18nGate({ children }: Props) {
  const [setting, setSetting] = useState<UiLanguageSetting | null>(null);
  const [systemLocale, setSystemLocale] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const api = window.bisbi;
    if (!api) {
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
    return <div className="loading">…</div>;
  }

  return (
    <I18nProvider setting={setting} systemLocale={systemLocale}>
      {children}
    </I18nProvider>
  );
}
