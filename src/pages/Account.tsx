import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { urls } from '../lib/urls';

export function Account() {
  const { t } = useTranslation();
  const { userInfo, logout } = useAuth();

  if (!userInfo) return null;

  const isPro = userInfo.plan === 'pro';
  const initial = (userInfo.name || userInfo.email || '?').trim().charAt(0).toUpperCase();

  const handleLogout = () => {
    if (window.confirm(t('account.confirmLogout'))) {
      void logout();
    }
  };

  const openBilling = () => {
    void window.bisbi?.openExternal(urls.billing);
  };
  const openUpgrade = () => {
    void window.bisbi?.openExternal(urls.upgrade);
  };

  return (
    <div className="account">
      <header className="account-header">
        <div className="account-avatar" aria-hidden="true">
          {userInfo.avatarUrl ? (
            <img src={userInfo.avatarUrl} alt="" />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="account-identity">
          <h1 className="account-name">{userInfo.name || t('account.title')}</h1>
          <p className="account-email">{userInfo.email}</p>
        </div>
        <span className={`plan-badge plan-${userInfo.plan}`}>
          {isPro ? t('account.planPro') : t('account.planFree')}
        </span>
      </header>

      <section className="account-card">
        <Field label={t('account.name')} value={userInfo.name || '—'} />
        <Field label={t('account.email')} value={userInfo.email} />
        <Field label={t('account.plan')} value={isPro ? t('account.planPro') : t('account.planFree')} />
        <Field label={t('account.userId')} value={userInfo.userId} mono />
      </section>

      <div className="account-actions">
        {isPro ? (
          <button type="button" className="btn-secondary" onClick={openBilling}>
            {t('account.manageSubscription')}
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={openUpgrade}>
            {t('account.upgradeToPro')}
          </button>
        )}
        <button type="button" className="btn-danger" onClick={handleLogout}>
          {t('account.logout')}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="account-field">
      <span className="account-field-label">{label}</span>
      <span className={`account-field-value${mono ? ' mono' : ''}`}>{value}</span>
    </div>
  );
}
