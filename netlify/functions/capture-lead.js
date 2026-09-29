// capture-lead.js — Shelby.ai Lead Capture Backend
// Captures Step-1 leads (email, name, phone, plan, billing) before payment
// Dependency-free: uses Node 18+ built-in fetch.

const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max || 200);
function resp(code, obj) {
  return {
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj || { ok: true })
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return resp(405, { error: 'Method not allowed' });
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}

  const name = str(body.name, 120);
  const email = str(body.email, 160);
  const phone = str(body.phone, 60);
  const plan = str(body.plan, 40) || 'starter';
  const billing = str(body.billing, 40) || 'monthly';

  if (!email || email.indexOf('@') < 1) {
    return resp(200, { ok: false, skipped: 'no email' });
  }

  // If Slack token configured on Netlify, relay notification
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SF_LEADS_CHANNEL || process.env.SLACK_CHANNEL;

  if (token && channel) {
    try {
      const text = [
        '🚀 *New Shelby.ai Checkout Lead (Step 1)*',
        '• *Plan:* ' + plan + ' (' + billing + ')',
        '• *Name:* ' + name,
        '• *Email:* ' + email,
        '• *WhatsApp:* ' + phone,
      ].filter(Boolean).join('\n');

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ channel, text, unfurl_links: false })
      });
    } catch (e) {
      console.error('Slack notify failed:', e.message);
    }
  }

  return resp(200, { ok: true, name, email, plan, billing });
};
