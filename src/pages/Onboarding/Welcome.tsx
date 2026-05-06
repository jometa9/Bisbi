import { useTranslation } from '../../i18n';
import owlIdleSvg from '../../../build-resources/owl_head.svg';

interface Props {
  onContinue: () => void;
}

export function Welcome({ onContinue }: Props) {
  const { t } = useTranslation();
  return (
    <div className="onb-screen onb-welcome">
      <img src={owlIdleSvg} alt="" aria-hidden="true" className="onb-welcome-owl" />
      <h1 className="onb-title">{t('onboarding.welcome.title')}</h1>
      <p className="onb-subtitle">{t('onboarding.welcome.subtitle')}</p>
      <button type="button" className="btn-primary onb-cta" onClick={onContinue}>
        {t('onboarding.welcome.cta')}
      </button>
    </div>
  );
}
