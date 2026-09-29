/**
 * Shelby.ai - Interactive Before & After Ad Set Autopsy Comparison
 * Draggable split slider with touch, mouse, and tab controls
 */

export function initAutopsySlider() {
  const container = document.getElementById('autopsyCompareContainer');
  const sliderHandle = document.getElementById('autopsyHandle');
  const afterClip = document.getElementById('autopsyAfterClip');
  const tabBefore = document.getElementById('autopsyTabBefore');
  const tabAfter = document.getElementById('autopsyTabAfter');
  const tabSplit = document.getElementById('autopsyTabSplit');

  if (!container || !afterClip || !sliderHandle) return;

  let isDragging = false;

  function updateSliderPosition(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    afterClip.style.width = clamped + '%';
    sliderHandle.style.left = clamped + '%';
    sliderHandle.setAttribute('aria-valuenow', Math.round(clamped));
  }

  function handlePointerMove(e) {
    if (!isDragging) return;
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    const percent = (offsetX / rect.width) * 100;
    updateSliderPosition(percent);
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', handlePointerMove);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', handlePointerMove);
    document.removeEventListener('touchend', stopDrag);
  }

  function startDrag(e) {
    isDragging = true;
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', handlePointerMove, { passive: true });
    document.addEventListener('touchend', stopDrag);
    e.preventDefault();
  }

  sliderHandle.addEventListener('mousedown', startDrag);
  sliderHandle.addEventListener('touchstart', startDrag, { passive: false });

  // Container click/tap to jump
  container.addEventListener('click', (e) => {
    if (e.target.closest('#autopsyHandle')) return;
    const rect = container.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    updateSliderPosition(percent);
  });

  // Tab controls
  if (tabBefore) {
    tabBefore.addEventListener('click', () => {
      setActiveTab(tabBefore);
      smoothTransitionTo(5);
    });
  }

  if (tabAfter) {
    tabAfter.addEventListener('click', () => {
      setActiveTab(tabAfter);
      smoothTransitionTo(95);
    });
  }

  if (tabSplit) {
    tabSplit.addEventListener('click', () => {
      setActiveTab(tabSplit);
      smoothTransitionTo(50);
    });
  }

  function setActiveTab(activeBtn) {
    [tabBefore, tabAfter, tabSplit].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    if (activeBtn) activeBtn.classList.add('active');
  }

  function smoothTransitionTo(targetPercent) {
    afterClip.style.transition = 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    sliderHandle.style.transition = 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    updateSliderPosition(targetPercent);
    setTimeout(() => {
      afterClip.style.transition = '';
      sliderHandle.style.transition = '';
    }, 450);
  }

  // Initial position: 50% split
  updateSliderPosition(50);
}
