import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import owlIdleSvg from '../../build-resources/owl_head.svg';

interface Props {
  onStartTour?: () => void;
}

export function Login({ onStartTour }: Props) {
  const { t } = useTranslation();
  const { startWebLogin, loginStatus, error } = useAuth();

  const isBusy = loginStatus !== 'idle';
  const buttonLabel =
    loginStatus === 'authenticating'
      ? t('auth.authenticating')
      : loginStatus === 'redirecting'
        ? t('auth.redirecting')
        : loginStatus === 'validating'
          ? t('auth.validating')
          : t('auth.signIn');

  return (
    <div className="login-screen">
      <img
        src={owlIdleSvg}
        alt=""
        aria-hidden="true"
        className="login-owl login-owl--left"
      />

      <div className="onb-progress">
        <span className="onb-progress-text">
          {t('onboarding.progress', { current: 3, total: 3 })}
        </span>
      </div>

      <div className="login-card">
        <div className="login-brand-top">{t('app.brand')}</div>
        <h1 className="login-title">{t('auth.welcome')}</h1>
        <p className="login-tagline">{t('auth.tagline')}</p>

        <button
          type="button"
          className="btn-primary login-btn"
          onClick={startWebLogin}
          disabled={isBusy}
        >
          {isBusy && <span className="login-spinner" aria-hidden="true" />}
          {buttonLabel}
        </button>

        {(loginStatus === 'authenticating' || loginStatus === 'redirecting') && (
          <button
            type="button"
            className="btn-link login-retry"
            onClick={startWebLogin}
          >
            {t('auth.tryAgain')}
          </button>
        )}

        {error && (
          <p className="login-error">
            {error === 'invalidToken'
              ? t('auth.invalidToken')
              : t('auth.connectionError')}
          </p>
        )}
      </div>

      {onStartTour && (
        <div className="login-tour-footer">
          <button type="button" className="login-tour" onClick={onStartTour}>
            {t('auth.takeTour')}
          </button>
        </div>
      )}
    </div>
  );
}
