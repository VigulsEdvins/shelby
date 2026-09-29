/**
 * Shelby.ai - Pricing & Billing Toggle Module
 */
import { t } from './i18n.js';

export function initPricing() {
  const monthlyBtn = document.getElementById('billingMonthlyBtn');
  const annualBtn = document.getElementById('billingAnnualBtn');
  const starterPrice = document.getElementById('starterPriceDisplay');
  const proPrice = document.getElementById('proPriceDisplay');
  const starterPeriod = document.getElementById('starterPeriodDisplay');
  const proPeriod = document.getElementById('proPeriodDisplay');
  const starterNotice = document.getElementById('starterBillingNotice');
  const proNotice = document.getElementById('proBillingNotice');
  const starterCta = document.getElementById('starterCtaText');
  const proCta = document.getElementById('proCtaText');
  const starterPlanBtn = document.getElementById('starterPlanBtn');
  const proPlanBtn = document.getElementById('proPlanBtn');

  if (!monthlyBtn || !annualBtn) return;

  let isAnnual = false;

  function renderPricing() {
    const billing = isAnnual ? 'annual' : 'monthly';

    if (starterPlanBtn) {
      starterPlanBtn.href = `https://my.shelbyapp.ai/onboard?plan=starter&billing=${billing}`;
    }
    if (proPlanBtn) {
      proPlanBtn.href = `https://my.shelbyapp.ai/onboard?plan=pro&billing=${billing}`;
    }

    if (isAnnual) {
      annualBtn.classList.add('active');
      monthlyBtn.classList.remove('active');

      if (starterPrice) starterPrice.textContent = t('pricing.starter_annual_price') || '$20';
      if (proPrice) proPrice.textContent = t('pricing.pro_annual_price') || '$74';
      if (starterPeriod) starterPeriod.textContent = t('pricing.starter_annual_period') || '/ mo (billed yearly)';
      if (proPeriod) proPeriod.textContent = t('pricing.pro_annual_period') || '/ mo (billed yearly)';
      if (starterNotice) starterNotice.textContent = t('pricing.starter_annual_notice') || 'Save $84/year • Full 30-day money-back guarantee';
      if (proNotice) proNotice.textContent = t('pricing.pro_annual_notice') || 'Save $300/year + Free Strategy Audit Included';
      if (starterCta) starterCta.textContent = t('pricing.starter_annual_cta') || 'Claim Launch Access ($20/mo)';
      if (proCta) proCta.textContent = t('pricing.pro_annual_cta') || 'Claim Pro Access ($74/mo)';
    } else {
      monthlyBtn.classList.add('active');
      annualBtn.classList.remove('active');

      if (starterPrice) starterPrice.textContent = t('pricing.starter_monthly_price') || '$27';
      if (proPrice) proPrice.textContent = t('pricing.pro_monthly_price') || '$99';
      if (starterPeriod) starterPeriod.textContent = t('pricing.starter_monthly_period') || '/ month';
      if (proPeriod) proPeriod.textContent = t('pricing.pro_monthly_period') || '/ month';
      if (starterNotice) starterNotice.textContent = t('pricing.starter_monthly_notice') || 'Billed monthly • Cancel anytime in 1 tap';
      if (proNotice) proNotice.textContent = t('pricing.pro_monthly_notice') || 'Billed monthly • Cancel anytime in 1 tap';
      if (starterCta) starterCta.textContent = t('pricing.starter_monthly_cta') || 'Get Started for $27';
      if (proCta) proCta.textContent = t('pricing.pro_monthly_cta') || 'Claim Pro Access ($99/mo)';
    }
  }

  monthlyBtn.addEventListener('click', () => {
    isAnnual = false;
    renderPricing();
  });

  annualBtn.addEventListener('click', () => {
    isAnnual = true;
    renderPricing();
  });

  window.addEventListener('languageChanged', () => {
    renderPricing();
  });

  renderPricing();
}
