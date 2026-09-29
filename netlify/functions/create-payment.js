// create-payment.js — Shelby.ai Stripe Payment Backend
// Handles GET (returns publishableKey) & POST (creates Stripe PaymentIntent)
// Dependency-free: uses Node 18+ built-in fetch.

const PLANS = {
  starter: {
    name: 'Starter Automation',
    monthly: 2700,   // $27/mo
    annual: 24000    // $240/yr ($20/mo)
  },
  pro: {
    name: 'Pro Autonomous Growth',
    monthly: 9900,   // $99/mo
    annual: 88800    // $888/yr ($74/mo)
  }
};

function resp(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}

const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max || 200);

exports.handler = async (event) => {
  const key = process.env.STRIPE_SECRET_KEY;
  const pubKey = process.env.STRIPE_PUBLISHABLE_KEY;

  // GET -> return publishable key for client-side Stripe Elements
  if (event.httpMethod === 'GET') {
    if (!pubKey) {
      return resp(200, { publishableKey: '', testMode: true, message: 'STRIPE_PUBLISHABLE_KEY is not set on Netlify' });
    }
    return resp(200, { publishableKey: pubKey });
  }

  if (event.httpMethod !== 'POST') {
    return resp(405, { error: 'Method not allowed' });
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}

  const plan = String(body.plan || 'starter').toLowerCase();
  const cfg = PLANS[plan] || PLANS.starter;
  const billing = (body.billing === 'annual') ? 'annual' : 'monthly';
  const totalAmount = billing === 'annual' ? cfg.annual : cfg.monthly;

  // If secret key is not set, allow graceful test mode
  if (!key) {
    return resp(200, {
      simulated: true,
      amount: totalAmount,
      plan: plan,
      billing: billing,
      name: cfg.name
    });
  }

  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone, 40);
  const company = str(body.company);
  const billingAddress = str(body.billingAddress, 300);
  const regNo = str(body.regNo, 60);
  const vatNo = str(body.vatNo, 40);

  let customerId = null;
  if (company || vatNo || regNo || email) {
    try {
      const cp = new URLSearchParams();
      cp.append('name', company || name || email);
      if (email) cp.append('email', email);
      if (phone) cp.append('phone', phone);
      if (billingAddress) cp.append('address[line1]', billingAddress);
      cp.append('description', cfg.name + ' (' + billing + ')');
      cp.append('metadata[site]', 'shelby.ai');
      cp.append('metadata[plan]', plan);
      cp.append('metadata[billing]', billing);
      if (company) cp.append('metadata[company]', company);
      if (regNo) cp.append('metadata[reg_no]', regNo);
      if (vatNo) cp.append('metadata[vat_no]', vatNo);

      const cRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: cp.toString(),
      });
      const cData = await cRes.json();
      if (cRes.ok && cData.id) {
        customerId = cData.id;
      }
    } catch (e) {
      console.error('Customer creation failed:', e.message);
    }
  }

  const params = new URLSearchParams();
  params.append('amount', String(totalAmount));
  params.append('currency', 'usd');
  params.append('payment_method_types[0]', 'card');
  if (customerId) params.append('customer', customerId);
  params.append('description', 'Shelby.ai — ' + cfg.name + ' (' + billing + ')');
  if (email && email.indexOf('@') > 0) params.append('receipt_email', email);
  params.append('metadata[site]', 'shelby.ai');
  params.append('metadata[plan]', plan);
  params.append('metadata[billing]', billing);
  if (name) params.append('metadata[name]', name);
  if (email) params.append('metadata[email]', email);
  if (phone) params.append('metadata[phone]', phone);
  if (company) params.append('metadata[company]', company);

  try {
    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      return resp(res.status, { error: (data.error && data.error.message) || 'Stripe error' });
    }
    return resp(200, {
      clientSecret: data.client_secret,
      amount: totalAmount,
      name: cfg.name,
      plan: plan,
      billing: billing
    });
  } catch (err) {
    return resp(500, { error: err.message || 'Request failed' });
  }
};
