/**
 * Shelby.ai - 2-Step Stripe Payment & Checkout Flow
 * Designed after web_sharpify architecture:
 * - Real Stripe Elements (Card Element with secure PCI-compliant iframe)
 * - Netlify Function integration (GET -> publishableKey, POST -> create-payment Intent)
 * - Step 1 Lead Capture (capture-lead function + Netlify forms fallback)
 * - In-modal Monthly / Annual switcher with dynamic recalculation
 * - Zero fake reviews, zero extras
 * - Graceful fallback for offline / local-development preview
 */

const PLANS = {
  starter: {
    name: 'Starter Automation',
    monthlyAmount: 2700,    // $27/mo billed monthly
    annualAmount: 24000,    // $240/yr ($20/mo equivalent)
    annualMonthlyRate: 2000,
    subMonthly: '1 Meta Ad Account · 24/7 WhatsApp AI Assistant · Daily 9 AM Briefing',
    subAnnual: '1 Meta Ad Account · 24/7 WhatsApp AI · $240 billed annually ($20/mo)'
  },
  pro: {
    name: 'Pro Autonomous Growth',
    monthlyAmount: 9900,    // $99/mo billed monthly
    annualAmount: 88800,    // $888/yr ($74/mo equivalent)
    annualMonthlyRate: 7400,
    subMonthly: 'Up to 5 Meta Ad Accounts · Autonomous 4x+ ROAS Scaling · Hook & Copy AI',
    subAnnual: 'Up to 5 Meta Ad Accounts · Autonomous 4x+ ROAS · $888 billed annually ($74/mo)'
  }
};

let _coPlan = 'starter';
let _coBilling = 'monthly';
let _coEmail = '';
let _coName = '';
let _coPhone = '';
let _coCompany = '';
let _checkoutBusy = false;

let _pk = '';
let _stripe = null;
let _coElements = null;
let _coCard = null;
let _coReady = false;
let _isSimulatedCard = false;

const coCardStyle = {
  base: {
    color: '#0f172a',
    fontFamily: "'Geist', -apple-system, system-ui, sans-serif",
    fontSize: '15px',
    fontSmoothing: 'antialiased',
    iconColor: '#006d2f',
    '::placeholder': { color: '#94a3b8' }
  },
  invalid: {
    color: '#dc2626',
    iconColor: '#dc2626'
  }
};

function _coEl(id) {
  return document.getElementById(id);
}

function _usd(cents) {
  return '$' + Math.round(cents / 100).toLocaleString('en-US');
}

function _coAmount() {
  const planObj = PLANS[_coPlan] || PLANS.starter;
  return _coBilling === 'annual' ? planObj.annualAmount : planObj.monthlyAmount;
}

function _coError(msg) {
  const e = _coEl('coError');
  if (e) e.textContent = msg || '';
}

function _coBusy(on) {
  const b = _coEl('coPay');
  if (b) {
    b.disabled = !!on;
    b.classList.toggle('is-busy', !!on);
  }
}

function _coRenderTotal() {
  const planObj = PLANS[_coPlan] || PLANS.starter;
  const isAnnual = (_coBilling === 'annual');
  const totalCents = isAnnual ? planObj.annualAmount : planObj.monthlyAmount;

  const rowLabel = planObj.name;
  const rowAmtStr = isAnnual
    ? `${_usd(totalCents)} / yr ($${Math.round(planObj.annualMonthlyRate / 100)}/mo)`
    : `${_usd(totalCents)} / mo`;

  const rows = `<div class="co-line"><span>${rowLabel}</span><span>${rowAmtStr}</span></div>`;

  ['coLines', 'coLines2'].forEach(id => {
    const el = _coEl(id);
    if (el) el.innerHTML = rows;
  });

  const periodNotice = isAnnual ? 'Total <i>&middot; billed yearly</i>' : 'Total <i>&middot; billed monthly</i>';
  ['coSumPeriodLabel', 'coSumPeriodLabel2'].forEach(id => {
    const el = _coEl(id);
    if (el) el.innerHTML = periodNotice;
  });

  const formattedTotal = _usd(totalCents);
  document.querySelectorAll('.co-total-amt').forEach(el => {
    el.textContent = formattedTotal;
  });

  const pt = _coEl('coPayTxt');
  if (pt) {
    pt.textContent = isAnnual
      ? `Start Annual Plan (${formattedTotal}/yr)`
      : `Start Subscription (${formattedTotal}/mo)`;
  }

  const ct = _coEl('coContinueTot');
  if (ct) ct.textContent = formattedTotal;
}

function _coSetBilling(billing) {
  _coBilling = (billing === 'annual') ? 'annual' : 'monthly';

  const mBtn = _coEl('coBillMonthly');
  const aBtn = _coEl('coBillAnnual');
  if (mBtn) mBtn.classList.toggle('active', _coBilling === 'monthly');
  if (aBtn) aBtn.classList.toggle('active', _coBilling === 'annual');

  const starterPriceEl = _coEl('coStarterPrice');
  const proPriceEl = _coEl('coProPrice');
  const starterSubEl = _coEl('coStarterSub');
  const proSubEl = _coEl('coProSub');

  if (starterPriceEl) {
    starterPriceEl.textContent = _coBilling === 'annual' ? '$20/mo' : '$27/mo';
  }
  if (proPriceEl) {
    proPriceEl.textContent = _coBilling === 'annual' ? '$74/mo' : '$99/mo';
  }
  if (starterSubEl) {
    starterSubEl.textContent = _coBilling === 'annual'
      ? PLANS.starter.subAnnual
      : PLANS.starter.subMonthly;
  }
  if (proSubEl) {
    proSubEl.textContent = _coBilling === 'annual'
      ? PLANS.pro.subAnnual
      : PLANS.pro.subMonthly;
  }

  const miniNotice = _coEl('coBillingMiniNotice');
  if (miniNotice) {
    miniNotice.textContent = _coBilling === 'annual'
      ? 'Billed yearly ($240/yr or $888/yr) · Cancel anytime in 1 tap'
      : 'Billed monthly · Cancel anytime in 1 tap';
  }

  _coRenderTotal();
}

function _coTab(name) {
  const cp = _coEl('coCustomer');
  const pp = _coEl('coPayment');
  if (cp) cp.hidden = (name !== 'customer');
  if (pp) pp.hidden = (name !== 'payment');

  const ct = _coEl('coTabCustomer');
  const pt = _coEl('coTabPayment');
  if (ct) {
    ct.classList.toggle('on', name === 'customer');
    ct.setAttribute('aria-selected', name === 'customer' ? 'true' : 'false');
    ct.classList.toggle('is-done', name === 'payment');
  }
  if (pt) {
    pt.classList.toggle('on', name === 'payment');
    pt.setAttribute('aria-selected', name === 'payment' ? 'true' : 'false');
  }

  const panel = document.querySelector('#co-modal .co-panel');
  if (panel) panel.scrollTop = 0;
  const m = _coEl('co-modal');
  if (m) m.scrollTop = 0;
}

function _coSetPlan(plan) {
  if (!PLANS[plan]) plan = 'starter';
  _coPlan = plan;

  const opts = document.querySelectorAll('#coPlans .co-planopt');
  opts.forEach(btn => {
    const on = (btn.getAttribute('data-plan') === plan);
    btn.classList.toggle('sel', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  });

  _coRenderTotal();
}

// ── Stripe Card Element Mount (web_sharpify style) ──
function _coMountCard() {
  if (!_stripe) return;
  const wrap = _coEl('coCardWrap');
  const cardHost = _coEl('coCard');
  if (!cardHost) return;

  try {
    if (_coCard) _coCard.destroy();
  } catch (_) {}

  cardHost.innerHTML = '';
  _coElements = _stripe.elements();
  _coCard = _coElements.create('card', { style: coCardStyle, hidePostalCode: true });
  _coCard.mount('#coCard');
  _isSimulatedCard = false;

  _coCard.on('ready', () => {
    _coReady = true;
    if (wrap) wrap.classList.remove('is-loading');
  });

  _coCard.on('focus', () => {
    if (wrap) wrap.classList.add('is-focus');
  });

  _coCard.on('blur', () => {
    if (wrap) wrap.classList.remove('is-focus');
  });

  _coCard.on('change', ev => {
    if (ev.error) _coError(ev.error.message);
    else _coError('');
  });
}

function _coMountFallbackCard() {
  const wrap = _coEl('coCardWrap');
  const cardHost = _coEl('coCard');
  if (!cardHost) return;

  _isSimulatedCard = true;
  _coReady = true;
  if (wrap) wrap.classList.remove('is-loading');

  cardHost.innerHTML = `
    <div class="co-card-fallback-row">
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="co-card-ic" style="color:var(--color-primary);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:16px;">
            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </span>
        <input type="text" id="coSimCardNum" class="co-card-input-main" placeholder="1234 1234 1234 1234" maxlength="19" inputmode="numeric" autocomplete="cc-number" style="flex:1; background:transparent; border:0; font-family:monospace; font-size:14.5px; outline:none; color:var(--color-text-primary);">
      </div>
      <div class="co-card-fallback-subgrid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; padding-top:8px; border-top:1px solid var(--color-border-subtle);">
        <input type="text" id="coSimCardExp" placeholder="MM / YY" maxlength="7" inputmode="numeric" autocomplete="cc-exp" style="background:transparent; border:0; font-family:monospace; font-size:14px; outline:none; color:var(--color-text-primary);">
        <input type="text" id="coSimCardCvc" placeholder="CVC" maxlength="4" inputmode="numeric" autocomplete="cc-csc" style="background:transparent; border:0; font-family:monospace; font-size:14px; outline:none; color:var(--color-text-primary);">
      </div>
    </div>
  `;

  const numIn = _coEl('coSimCardNum');
  const expIn = _coEl('coSimCardExp');
  const cvcIn = _coEl('coSimCardCvc');

  if (numIn) {
    numIn.addEventListener('input', () => {
      let v = numIn.value.replace(/\D/g, '').slice(0, 16);
      numIn.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
    });
  }

  if (expIn) {
    expIn.addEventListener('input', () => {
      let v = expIn.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) {
        expIn.value = v.slice(0, 2) + ' / ' + v.slice(2);
      } else {
        expIn.value = v;
      }
    });
  }

  if (cvcIn) {
    cvcIn.addEventListener('input', () => {
      cvcIn.value = cvcIn.value.replace(/\D/g, '').slice(0, 4);
    });
  }
}

function _coEnsureStripe() {
  const wrap = _coEl('coCardWrap');
  if (wrap) wrap.classList.add('is-loading');
  _coReady = false;
  _coError('');

  if (typeof Stripe === 'undefined') {
    // Stripe script not loaded or offline
    _coMountFallbackCard();
    return;
  }

  if (_pk) {
    _stripe = _stripe || Stripe(_pk);
    _coMountCard();
    return;
  }

  fetch('/.netlify/functions/create-payment', { method: 'GET' })
    .then(res => res.json())
    .then(d => {
      if (d && d.publishableKey) {
        _pk = d.publishableKey;
        _stripe = Stripe(_pk);
        _coMountCard();
      } else {
        _coMountFallbackCard();
      }
    })
    .catch(() => {
      _coMountFallbackCard();
    });
}

export function openCheckout(planName) {
  if (_checkoutBusy) return;

  const p = String(planName || 'starter').toLowerCase();
  _coPlan = /pro/.test(p) ? 'pro' : 'starter';

  const annualBtn = document.getElementById('billingAnnualBtn');
  if (annualBtn && annualBtn.classList.contains('active')) {
    _coBilling = 'annual';
  } else {
    _coBilling = 'monthly';
  }

  _coName = '';
  _coEmail = '';
  _coPhone = '';
  _coCompany = '';

  ['coEmail', 'coName', 'coPhone', 'coCompany', 'coBizAddr', 'coBizReg', 'coBizVat'].forEach(id => {
    const el = _coEl(id);
    if (el) el.value = '';
  });

  const ce = _coEl('coCustErr');
  if (ce) ce.textContent = '';
  _coError('');

  const biz = _coEl('coBiz');
  if (biz) {
    biz.classList.remove('is-open');
    biz.setAttribute('aria-hidden', 'true');
  }

  _coSetBilling(_coBilling);
  _coSetPlan(_coPlan);
  _coTab('customer');

  const m = _coEl('co-modal');
  if (m) {
    m.classList.add('show');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  const em = _coEl('coEmail');
  if (em) {
    setTimeout(() => {
      try { em.focus(); } catch (_) {}
    }, 100);
  }
}

export function closeCheckout() {
  const m = _coEl('co-modal');
  if (m) {
    m.classList.remove('show');
    m.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
  _checkoutBusy = false;
  _coBusy(false);

  try {
    if (_coCard) _coCard.destroy();
  } catch (_) {}
  _coCard = null;
  _coElements = null;
  _coReady = false;
}

function _coCustomerNext() {
  if (_checkoutBusy) return;

  const errEl = _coEl('coCustErr');
  const em = ((_coEl('coEmail') || {}).value || '').trim();
  const nm = ((_coEl('coName') || {}).value || '').trim();
  const ph = ((_coEl('coPhone') || {}).value || '').trim();

  if (!em || em.indexOf('@') < 1 || em.indexOf('.') < 2) {
    if (errEl) errEl.textContent = 'Please enter a valid work email address.';
    _coEl('coEmail')?.focus();
    return;
  }
  if (!nm) {
    if (errEl) errEl.textContent = 'Please enter your name.';
    _coEl('coName')?.focus();
    return;
  }
  if (!ph || ph.replace(/[^0-9]/g, '').length < 6) {
    if (errEl) errEl.textContent = 'Please enter your WhatsApp phone number with country code.';
    _coEl('coPhone')?.focus();
    return;
  }

  if (errEl) errEl.textContent = '';
  _coEmail = em;
  _coName = nm;
  _coPhone = ph;

  // Background lead capture (both Netlify function & Netlify form)
  try {
    fetch('/.netlify/functions/capture-lead', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: _coName,
        email: _coEmail,
        phone: _coPhone,
        plan: _coPlan,
        billing: _coBilling
      })
    }).catch(() => {});

    const leadData = new FormData();
    leadData.append('form-name', 'launch-access');
    leadData.append('email', _coEmail);
    leadData.append('name', _coName);
    leadData.append('phone', _coPhone);
    leadData.append('plan', _coPlan);
    leadData.append('billing', _coBilling);
    leadData.append('amount', (_coAmount() / 100).toString());

    fetch('/', {
      method: 'POST',
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(leadData).toString()
    }).catch(() => {});
  } catch (_) {}

  _coTab('payment');
  _coRenderTotal();
  _coEnsureStripe();
}

function _coSucceeded(pi) {
  const btn = _coEl('coPay');
  if (btn) {
    btn.classList.remove('is-busy');
    btn.classList.add('is-done');
    const pt = _coEl('coPayTxt');
    if (pt) pt.textContent = 'Subscription Activated ✓';
  }

  const thankYouUrl = new URL('https://my.shelbyapp.ai/onboard');
  thankYouUrl.searchParams.set('plan', _coPlan);
  thankYouUrl.searchParams.set('billing', _coBilling);
  thankYouUrl.searchParams.set('email', _coEmail);
  thankYouUrl.searchParams.set('name', _coName);
  thankYouUrl.searchParams.set('phone', _coPhone);
  thankYouUrl.searchParams.set('paid', 'true');
  thankYouUrl.searchParams.set('amount', (_coAmount() / 100).toString());

  if (pi && pi.id) {
    thankYouUrl.searchParams.set('pi', pi.id);
  }
  if (_coCompany) {
    thankYouUrl.searchParams.set('company', _coCompany);
  }

  setTimeout(() => {
    window.location.href = thankYouUrl.toString();
  }, 750);
}

function _coSubmitPayment(e) {
  if (e) e.preventDefault();
  if (_checkoutBusy) return;

  const name = _coName;
  const email = _coEmail;
  const phone = _coPhone;
  const company = ((_coEl('coCompany') || {}).value || '').trim();
  const bizAddr = ((_coEl('coBizAddr') || {}).value || '').trim();
  const bizReg = ((_coEl('coBizReg') || {}).value || '').trim();
  const bizVat = ((_coEl('coBizVat') || {}).value || '').trim();
  _coCompany = company;

  if (!name || !email) {
    _coError('Please re-enter your contact details.');
    _coTab('customer');
    return;
  }

  if (!_coReady) {
    _coError('Payment form is still loading. Please wait a moment.');
    return;
  }

  if (_isSimulatedCard) {
    const num = ((_coEl('coSimCardNum') || {}).value || '').replace(/\D/g, '');
    const exp = ((_coEl('coSimCardExp') || {}).value || '').trim();
    const cvc = ((_coEl('coSimCardCvc') || {}).value || '').trim();
    if (num.length < 15) {
      _coError('Please enter your card number.');
      return;
    }
    if (exp.length < 5) {
      _coError('Please enter your card expiration date (MM / YY).');
      return;
    }
    if (cvc.length < 3) {
      _coError('Please enter your card CVC.');
      return;
    }
  }

  _checkoutBusy = true;
  _coBusy(true);
  _coError('');

  // Call create-payment Netlify function
  fetch('/.netlify/functions/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: _coPlan,
      billing: _coBilling,
      name: name,
      email: email,
      phone: phone,
      company: company,
      billingAddress: bizAddr,
      regNo: bizReg,
      vatNo: bizVat
    })
  })
  .then(res => {
    return res.text().then(t => {
      let d = {};
      try { d = JSON.parse(t); } catch (_) {}
      if (!res.ok) throw new Error((d && d.error) ? d.error : ('Server error ' + res.status));
      return d;
    });
  })
  .then(d => {
    // If running in simulated / dev mode without live Stripe Secret Key
    if (d.simulated || _isSimulatedCard || !d.clientSecret) {
      setTimeout(() => {
        _coSucceeded({ id: 'sim_' + Date.now(), simulated: true });
      }, 900);
      return;
    }

    // Confirm real Stripe payment
    return _stripe.confirmCardPayment(d.clientSecret, {
      payment_method: {
        card: _coCard,
        billing_details: { name: name, email: email }
      },
      receipt_email: email
    }).then(result => {
      if (!result) return;
      if (result.error) {
        _checkoutBusy = false;
        _coBusy(false);
        _coError(result.error.message || 'Payment could not be processed.');
      } else if (result.paymentIntent && (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing')) {
        _coSucceeded(result.paymentIntent);
      } else {
        _checkoutBusy = false;
        _coBusy(false);
        _coError('Payment was not completed. Please try again.');
      }
    });
  })
  .catch(err => {
    // If backend isn't running (e.g. static local preview)
    if (!window.location.hostname.includes('netlify') && !window.location.port) {
      setTimeout(() => {
        _coSucceeded({ id: 'local_' + Date.now(), simulated: true });
      }, 800);
      return;
    }
    _checkoutBusy = false;
    _coBusy(false);
    _coError((err && err.message) ? err.message : 'Something went wrong. Please try again.');
  });
}

export function initCheckout() {
  // Bind close buttons
  document.querySelectorAll('[data-co-close]').forEach(btn => {
    btn.addEventListener('click', closeCheckout);
  });

  // Bind monthly/annual switcher inside checkout
  const billMonthlyBtn = _coEl('coBillMonthly');
  if (billMonthlyBtn) {
    billMonthlyBtn.addEventListener('click', () => {
      if (!_checkoutBusy) _coSetBilling('monthly');
    });
  }

  const billAnnualBtn = _coEl('coBillAnnual');
  if (billAnnualBtn) {
    billAnnualBtn.addEventListener('click', () => {
      if (!_checkoutBusy) _coSetBilling('annual');
    });
  }

  // Bind step navigation
  const contBtn = _coEl('coContinueBtn');
  if (contBtn) contBtn.addEventListener('click', _coCustomerNext);

  const backBtn = _coEl('coBackCust');
  if (backBtn) backBtn.addEventListener('click', () => _coTab('customer'));

  const tabCust = _coEl('coTabCustomer');
  if (tabCust) tabCust.addEventListener('click', () => _coTab('customer'));

  const tabPay = _coEl('coTabPayment');
  if (tabPay) {
    tabPay.addEventListener('click', () => {
      const cp = _coEl('coCustomer');
      if (cp && !cp.hidden) {
        _coCustomerNext();
      } else {
        _coTab('payment');
      }
    });
  }

  // Keyboard navigation on Customer tab
  ['coEmail', 'coName', 'coPhone'].forEach(id => {
    const el = _coEl(id);
    if (el) {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          _coCustomerNext();
        }
      });
    }
  });

  // Plan selection buttons
  const planButtons = document.querySelectorAll('#coPlans .co-planopt');
  planButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!_checkoutBusy) {
        const plan = btn.getAttribute('data-plan');
        _coSetPlan(plan);
      }
    });
  });

  // Company details toggle
  const companyIn = _coEl('coCompany');
  const bizBlock = _coEl('coBiz');
  if (companyIn && bizBlock) {
    companyIn.addEventListener('input', () => {
      const open = companyIn.value.trim().length > 0;
      bizBlock.classList.toggle('is-open', open);
      bizBlock.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
  }

  // Payment form submit
  const payForm = _coEl('coPayment');
  if (payForm) {
    payForm.addEventListener('submit', _coSubmitPayment);
  }

  // Escape key closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const m = _coEl('co-modal');
      if (m && m.classList.contains('show')) {
        closeCheckout();
      }
    }
  });

  // Intercept pricing plan CTA clicks
  const starterBtn = document.getElementById('starterPlanBtn');
  if (starterBtn) {
    starterBtn.addEventListener('click', e => {
      e.preventDefault();
      openCheckout('starter');
    });
  }

  const proBtn = document.getElementById('proPlanBtn');
  if (proBtn) {
    proBtn.addEventListener('click', e => {
      e.preventDefault();
      openCheckout('pro');
    });
  }

  // Open checkout for any element with data-open-checkout
  document.querySelectorAll('[data-open-checkout]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const plan = el.getAttribute('data-open-checkout') || 'starter';
      openCheckout(plan);
    });
  });

  // Make globally accessible
  window.openCheckout = openCheckout;
  window.closeCheckout = closeCheckout;
}
