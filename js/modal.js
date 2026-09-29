/**
 * Shelby.ai - Onboarding & Checkout Modal Bridge
 */
import { openCheckout, closeCheckout } from './checkout.js';

export function initModal() {
  const openButtons = document.querySelectorAll('[data-open-modal="launch"]');
  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const plan = btn.getAttribute('data-plan') || 'starter';
      openCheckout(plan);
    });
  });
}
