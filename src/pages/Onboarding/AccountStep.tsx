import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';

export function AccountStep() {
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
          : t('onboarding.account.signIn');

  return (
    <div className="onb-screen onb-account">
      <h1 className="onb-title">{t('onboarding.account.title')}</h1>
      <p className="onb-subtitle">{t('onboarding.account.subtitle')}</p>

      <button
        type="button"
        className="btn-primary onb-cta onb-google-btn"
        onClick={startWebLogin}
        disabled={isBusy}
      >
        {isBusy ? (
          <span className="login-spinner" aria-hidden="true" />
        ) : (
          <GoogleGlyph />
        )}
        {buttonLabel}
      </button>

      {(loginStatus === 'authenticating' || loginStatus === 'redirecting') && (
        <button type="button" className="btn-link onb-retry-link" onClick={startWebLogin}>
          {t('auth.tryAgain')}
        </button>
      )}

      {error && (
        <p className="onb-error">
          {error === 'invalidToken' ? t('auth.invalidToken') : t('auth.connectionError')}
        </p>
      )}

      <p className="onb-account-microcopy">
        {t('onboarding.account.microcopy')}
      </p>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8L6.2 33C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2c-.4.4 6.6-4.8 6.6-14.9 0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
