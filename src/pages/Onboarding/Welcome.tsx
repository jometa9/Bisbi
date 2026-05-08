import { useTranslation } from '../../i18n';

interface Props {
  onContinue: () => void;
}

export function Welcome({ onContinue }: Props) {
  const { t } = useTranslation();

  return (
    <div className="onb-screen onb-welcome">
      <h1 className="onb-title">{t('onboarding.welcome.title')}</h1>
      <p className="onb-subtitle">{t('onboarding.welcome.subtitle')}</p>

      <button
        type="button"
        className="btn-primary onb-cta"
        onClick={onContinue}
      >
        {t('onboarding.welcome.cta')}
      </button>
    </div>
  );
}
