import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { urls } from '../lib/urls';

export function Login() {
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

  const onSignUp = () => {
    void window.bisbi?.openExternal(urls.signUp);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">{t('app.brand')}</div>
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

        <p className="login-footer">
          {t('auth.noAccount')}{' '}
          <button type="button" className="login-link" onClick={onSignUp}>
            {t('auth.signUp')}
          </button>
        </p>
      </div>
    </div>
  );
}
