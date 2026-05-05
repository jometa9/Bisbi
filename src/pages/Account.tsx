import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { urls } from '../lib/urls';
import { ConfirmButton } from '../components/ConfirmButton';

export function Account() {
  const { t } = useTranslation();
  const { userInfo, logout } = useAuth();

  if (!userInfo) return null;

  const isPro = userInfo.plan === 'pro';
  const initial = (userInfo.name || userInfo.email || '?').trim().charAt(0).toUpperCase();

  const openBilling = () => {
    void window.bisbi?.openExternal(urls.billing);
  };
  const openUpgrade = () => {
    void window.bisbi?.openExternal(urls.upgrade);
  };

  return (
    <div className="settings">
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

      <Section title={t('account.profileSection.title')} description={t('account.profileSection.description')}>
        <div className="account-card">
          <Field label={t('account.name')} value={userInfo.name || '—'} />
          <Field label={t('account.email')} value={userInfo.email} />
          <Field label={t('account.userId')} value={userInfo.userId} mono />
        </div>
      </Section>

      <Section title={t('account.subscriptionSection.title')} description={t('account.subscriptionSection.description')}>
        <div className="account-card">
          <Field label={t('account.plan')} value={isPro ? t('account.planPro') : t('account.planFree')} />
        </div>
        <div className="actions">
          {isPro ? (
            <button type="button" className="btn-secondary" onClick={openBilling}>
              {t('account.manageSubscription')}
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={openUpgrade}>
              {t('account.upgradeToPro')}
            </button>
          )}
        </div>
      </Section>

      <Section title={t('account.sessionSection.title')} description={t('account.sessionSection.description')}>
        <div className="actions">
          <ConfirmButton
            label={t('account.logout')}
            question={t('account.confirmLogout')}
            onConfirm={() => logout()}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <header>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>
      <div className="section-body">{children}</div>
    </section>
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
