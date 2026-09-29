/**
 * Shelby.ai - Onboarding Modal & Netlify Form Handler
 */
import { t } from './i18n.js';

export function initModal() {
  const modal = document.getElementById('launchModal');
  const openButtons = document.querySelectorAll('[data-open-modal="launch"]');
  const closeButton = document.getElementById('closeModalBtn');
  const launchForm = document.getElementById('launchAccessForm');
  const formSuccessState = document.getElementById('formSuccessState');

  if (!modal) return;

  function openModal(e) {
    if (e) e.preventDefault();
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    modal.querySelector('input')?.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  openButtons.forEach(btn => btn.addEventListener('click', openModal));
  closeButton?.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Handle lead capture form (Netlify forms ready)
  if (launchForm) {
    launchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(launchForm);
      const submitBtn = launchForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = t('modal.connecting') || 'Connecting...';
      }

      // Check if deployed on Netlify or running locally
      fetch('/', {
        method: 'POST',
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
      })
      .then(() => {
        showSuccess();
      })
      .catch(() => {
        // Even if local/offline test, show seamless success state
        showSuccess();
      });
    });
  }

  function showSuccess() {
    if (launchForm && formSuccessState) {
      launchForm.style.display = 'none';
      formSuccessState.style.display = 'block';

      const email = document.getElementById('leadEmail')?.value || '';
      const phone = document.getElementById('leadPhone')?.value || '';
      const thankYouUrl = new URL('https://my.shelbyapp.ai/onboard');
      if (email) thankYouUrl.searchParams.set('email', email);
      if (phone) thankYouUrl.searchParams.set('phone', phone);

      const redirectBtn = document.getElementById('thankYouRedirectBtn');
      if (redirectBtn) {
        redirectBtn.href = thankYouUrl.toString();
      }

      setTimeout(() => {
        window.location.href = thankYouUrl.toString();
      }, 1500);
    }
  }
}
