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
          {isBusy ? (
            <span className="login-spinner" aria-hidden="true" />
          ) : (
            <GoogleIcon />
          )}
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

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
        <path
          fill="currentColor"
          d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
        />
        <path
          fill="currentColor"
          d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
        />
        <path
          fill="currentColor"
          d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
        />
        <path
          fill="currentColor"
          d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
        />
      </g>
    </svg>
  );
}
