import { useMemo } from 'react';
import { useTranslation } from '../../i18n';
import { Select } from '../../components/Select';
import { WHISPER_LANGUAGES, whisperLanguageLabel } from '../../whisperLanguages';

interface Props {
  language: string;
  onLanguageChange: (language: string) => void;
  onContinue: () => void;
}

export function Welcome({ language, onLanguageChange, onContinue }: Props) {
  const { t } = useTranslation();

  // 'auto' is the default value coming from settings when the OS locale could
  // not be mapped to a known language. We expose it as a placeholder option in
  // this onboarding step (no real auto-detection here) and require the user to
  // pick a real language before they can continue. Auto-detect remains
  // available later from Settings.
  const languageOptions = useMemo(
    () => [
      {
        value: 'auto',
        label: t('onboarding.welcome.languagePlaceholder'),
        searchTerms: '',
      },
      ...WHISPER_LANGUAGES.map((lang) => ({
        value: lang.code,
        label: whisperLanguageLabel(lang),
        searchTerms: `${lang.english} ${lang.endonym} ${lang.code}`,
      })),
    ],
    [t]
  );

  const canContinue = language !== 'auto';

  return (
    <div className="onb-screen onb-welcome">
      <h1 className="onb-title">{t('onboarding.welcome.title')}</h1>
      <p className="onb-subtitle">{t('onboarding.welcome.subtitle')}</p>

      <div className="onb-welcome-language">
        <span className="onb-welcome-language-label">
          {t('onboarding.welcome.languageQuestion')}
        </span>
        <Select<string>
          value={language}
          onChange={onLanguageChange}
          ariaLabel={t('settings.transcriptionLanguage.title')}
          searchPlaceholder={t('settings.transcriptionLanguage.searchPlaceholder')}
          options={languageOptions}
          variant="inline"
        />
      </div>

      <button
        type="button"
        className="btn-primary onb-cta"
        onClick={onContinue}
        disabled={!canContinue}
      >
        {t('onboarding.welcome.cta')}
      </button>
    </div>
  );
}
