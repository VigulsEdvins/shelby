/**
 * Shelby.ai - Accessible FAQ Accordion Module
 */
export function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item, index) => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    if (!trigger || !content) return;

    // Set ARIA attributes
    const contentId = `faq-content-${index}`;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', contentId);
    content.setAttribute('id', contentId);

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('open');
          const otherTrigger = otherItem.querySelector('.faq-trigger');
          const otherContent = otherItem.querySelector('.faq-content');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          if (otherContent) otherContent.style.maxHeight = '0px';
        }
      });

      // Toggle clicked item
      if (isOpen) {
        item.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        content.style.maxHeight = '0px';
      } else {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });

    // Support keyboard activation
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.click();
      }
    });
  });

  // Open first item by default for better initial engagement
  if (faqItems.length > 0) {
    const firstItem = faqItems[0];
    const firstTrigger = firstItem.querySelector('.faq-trigger');
    const firstContent = firstItem.querySelector('.faq-content');
    if (firstItem && firstTrigger && firstContent) {
      firstItem.classList.add('open');
      firstTrigger.setAttribute('aria-expanded', 'true');
      firstContent.style.maxHeight = firstContent.scrollHeight + 'px';
    }
  }
}
