import { useState } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { urls } from '../lib/urls';
import { ConfirmButton } from '../components/ConfirmButton';
import type { Pricing } from '../types';

export function Account() {
  const { t } = useTranslation();
  const { userInfo, logout, isRefreshing, refreshSession } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!userInfo) return null;

  const isPro = userInfo.plan === 'pro';
  const initial = (userInfo.name || userInfo.email || '?').trim().charAt(0).toUpperCase();

  const subStatus = userInfo.subscriptionStatus;
  const subExpiresAt = userInfo.subscriptionExpiresAt
    ? new Date(userInfo.subscriptionExpiresAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const planLabel = () => {
    if (!isPro) return t('account.planFree');
    if (subStatus === 'trialing') return t('account.planTrial');
    if (subStatus === 'canceling') return t('account.planCanceling');
    return t('account.planPro');
  };

  const planDetail = () => {
    if (!isPro || !subExpiresAt) return null;
    if (subStatus === 'trialing') return t('account.trialEnds', { date: subExpiresAt });
    if (subStatus === 'canceling') return t('account.cancelsOn', { date: subExpiresAt });
    if (subStatus === 'active') return t('account.renewsOn', { date: subExpiresAt });
    return null;
  };

  const openBilling = () => void window.bisbi?.openExternal(urls.billing);

  const handleCheckout = async () => {
    if (!window.bisbi || isCheckingOut) return;
    setIsCheckingOut(true);
    try {
      const url = await window.bisbi.auth.checkout(billingPeriod);
      await window.bisbi.openExternal(url);
    } catch {
    } finally {
      setIsCheckingOut(false);
    }
  };

  const pricing: Pricing | null = userInfo.pricing ?? null;
  const monthlyLabel = pricing?.pro.monthly.label ?? 'US$ 10 / month';
  const annualLabel = pricing?.pro.annual.label ?? 'US$ 96 / year';
  const annualMonthly = pricing?.pro.annual.monthlyEquivalent ?? 'US$ 8 / month';
  const annualSavings = pricing?.pro.annual.savings ?? '20% off';
  const detail = planDetail();

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
        <span className={`plan-badge plan-${userInfo.plan}${subStatus === 'trialing' ? ' plan-trial' : ''}${subStatus === 'canceling' ? ' plan-canceling' : ''}`}>
          {planLabel()}
        </span>
      </header>

      {!isPro && (
        <Section title={t('account.subscriptionSection.title')} description={t('account.subscriptionSection.description')}>
          <div className="billing-toggle">
            <button
              type="button"
              className={`billing-toggle-btn${billingPeriod === 'monthly' ? ' active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              {t('account.monthly')}
            </button>
            <button
              type="button"
              className={`billing-toggle-btn${billingPeriod === 'annual' ? ' active' : ''}`}
              onClick={() => setBillingPeriod('annual')}
            >
              {t('account.annual')}
              {billingPeriod === 'annual' && (
                <span className="billing-savings-badge">{annualSavings}</span>
              )}
            </button>
          </div>

          <div className="plan-cards">
            <div className="plan-card plan-card-free">
              <div className="plan-card-header">
                <span className="plan-card-name">{t('account.planFree')}</span>
                <span className="plan-card-price">US$ 0</span>
                <span className="plan-card-period">{t('account.forever')}</span>
              </div>
              <ul className="plan-card-features">
                <li><CheckIcon />{t('account.features.dictation2k')}</li>
                <li><CheckIcon />{t('account.features.languages')}</li>
                <li><CheckIcon />{t('account.features.zeroRetention')}</li>
              </ul>
              <div className="plan-card-footer">
                <span className="plan-card-current">{t('account.currentPlan')}</span>
              </div>
            </div>

            <div className="plan-card plan-card-pro">
              <div className="plan-card-header">
                <span className="plan-card-name">Pro</span>
                {billingPeriod === 'monthly' ? (
                  <>
                    <span className="plan-card-price">{monthlyLabel.split('/')[0].trim()}</span>
                    <span className="plan-card-period">/ {t('account.month')}</span>
                  </>
                ) : (
                  <>
                    <span className="plan-card-price">{annualMonthly.split('/')[0].trim()}</span>
                    <span className="plan-card-period">/ {t('account.month')} · {annualLabel}</span>
                  </>
                )}
              </div>
              <ul className="plan-card-features">
                <li><CheckIcon />{t('account.features.unlimited')}</li>
                <li><CheckIcon />{t('account.features.allDevices')}</li>
                <li><CheckIcon />{t('account.features.languages')}</li>
                <li><CheckIcon />{t('account.features.zeroRetention')}</li>
                <li><CheckIcon />{t('account.features.priority')}</li>
              </ul>
              <div className="plan-card-footer">
                <button
                  type="button"
                  className="btn-primary plan-card-cta"
                  onClick={() => void handleCheckout()}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? t('account.opening') : t('account.upgradeToPro')}
                </button>
              </div>
            </div>
          </div>
        </Section>
      )}

      {isPro && (
        <Section title={t('account.subscriptionSection.title')} description={t('account.subscriptionSection.description')}>
          <div className="account-card">
            <Field label={t('account.plan')} value={planLabel()} />
            {userInfo.subscriptionBillingPeriod && (
              <Field label={t('account.billingPeriod')} value={userInfo.subscriptionBillingPeriod === 'annual' ? t('account.annual') : t('account.monthly')} />
            )}
            {detail && <Field label={t('account.billing')} value={detail} />}
          </div>
          <div className="actions">
            <button type="button" className="btn-secondary" onClick={openBilling}>
              {t('account.manageSubscription')}
            </button>
            <button
              type="button"
              className="tx-icon-btn"
              onClick={() => void refreshSession()}
              disabled={isRefreshing}
              title={t('account.refresh')}
              aria-label={t('account.refresh')}
            >
              <RefreshIcon spinning={isRefreshing} />
            </button>
          </div>
        </Section>
      )}

      <Section title={t('account.profileSection.title')} description={t('account.profileSection.description')}>
        <div className="account-card">
          <Field label={t('account.name')} value={userInfo.name || '—'} />
          <Field label={t('account.email')} value={userInfo.email} />
        </div>
        <div className="actions">
          <button
            type="button"
            className="tx-icon-btn"
            onClick={() => void refreshSession()}
            disabled={isRefreshing}
            title={t('account.refresh')}
            aria-label={t('account.refresh')}
          >
            <RefreshIcon spinning={isRefreshing} />
          </button>
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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={spinning ? { animation: 'spin 1s linear infinite' } : undefined}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
