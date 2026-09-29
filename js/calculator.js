/**
 * Shelby.ai - Unified Ad Spend Profit Leak & Real-Time ROAS Simulator Engine
 * High-definition SVG dynamic curve with milestone badges, pulsing radar beacons, and telemetry feedback.
 */
import { t } from './i18n.js';

export function initProfitCalculator() {
  const spendSlider = document.getElementById('calcSpendSlider');
  const spendDisplay = document.getElementById('calcSpendDisplay');
  const nicheSelect = document.getElementById('calcNicheSelect');
  const presetBtns = document.querySelectorAll('.preset-btn');
  
  const savedMonthlyEl = document.getElementById('calcSavedMonthly');
  const extraRevenueEl = document.getElementById('calcExtraRevenue');
  const roasValEl = document.getElementById('telemetryRoasVal');
  const roasDiffEl = document.getElementById('telemetryRoasDiff');
  const timeSavedEl = document.getElementById('calcTimeSaved');
  const leaksKilledEl = document.getElementById('calcLeaksKilled');
  const ctaAmountEl = document.getElementById('calcCtaAmount');
  const ctaBtn = document.getElementById('calcCtaBtn');

  if (!spendSlider) return;

  // Niche benchmark multipliers for overnight CPA volatility & avg winning ROAS
  const nicheBenchmarks = {
    fashion: { wasteRate: 0.17, targetRoas: 4.4 },
    beauty: { wasteRate: 0.19, targetRoas: 4.6 },
    supplements: { wasteRate: 0.21, targetRoas: 4.2 },
    tech: { wasteRate: 0.15, targetRoas: 3.9 },
    home: { wasteRate: 0.16, targetRoas: 4.0 }
  };

  let currentPreset = 'autonomous'; // baseline | radar | autonomous
  let animationFrameId = null;
  let currentValues = {
    saved: 0,
    revenue: 0,
    roas: 0,
    time: 0,
    leaks: 0
  };

  function formatCurrency(amount) {
    return '€' + Math.round(amount).toLocaleString('en-US');
  }

  function animateValue(targetSaved, targetRevenue, targetRoas, targetTime, targetLeaks) {
    const duration = 280;
    const startTime = performance.now();
    const startSaved = currentValues.saved;
    const startRevenue = currentValues.revenue;
    const startRoas = currentValues.roas;
    const startTimeSaved = currentValues.time;
    const startLeaks = currentValues.leaks;

    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const curSaved = startSaved + (targetSaved - startSaved) * easeProgress;
      const curRevenue = startRevenue + (targetRevenue - startRevenue) * easeProgress;
      const curRoas = startRoas + (targetRoas - startRoas) * easeProgress;
      const curTime = startTimeSaved + (targetTime - startTimeSaved) * easeProgress;
      const curLeaks = startLeaks + (targetLeaks - startLeaks) * easeProgress;

      currentValues = {
        saved: curSaved,
        revenue: curRevenue,
        roas: curRoas,
        time: curTime,
        leaks: curLeaks
      };

      const hrsUnit = t('calculator.units.hrs_month') || 'hrs/mo';
      const setsUnit = t('calculator.units.ad_sets') || 'ad sets';

      if (savedMonthlyEl) savedMonthlyEl.textContent = formatCurrency(curSaved);
      if (extraRevenueEl) extraRevenueEl.textContent = formatCurrency(curRevenue);
      if (roasValEl) roasValEl.textContent = curRoas.toFixed(1) + 'x';
      if (timeSavedEl) timeSavedEl.textContent = Math.round(curTime) + ' ' + hrsUnit;
      if (leaksKilledEl) leaksKilledEl.textContent = Math.round(curLeaks) + ' ' + setsUnit;
      if (ctaAmountEl) ctaAmountEl.textContent = formatCurrency(curSaved);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    }

    animationFrameId = requestAnimationFrame(step);
  }

  function updateSimulation() {
    const spend = parseFloat(spendSlider.value) || 12500;
    const nicheKey = nicheSelect ? nicheSelect.value : 'fashion';
    const benchmark = nicheBenchmarks[nicheKey] || nicheBenchmarks.fashion;

    // Display formatted spend
    if (spendDisplay) {
      const perMonthText = t('calculator.per_month') || '/ mo';
      spendDisplay.textContent = formatCurrency(spend) + ' ' + perMonthText;
    }

    let roas = benchmark.targetRoas;
    let roasDiffText = t('calculator.units.vs_avg') || '+18% vs 7D Avg';
    let isPositiveDiff = true;
    let reclaimedFactor = 1.0;

    if (currentPreset === 'baseline') {
      roas = 2.4;
      roasDiffText = t('calculator.units.manual_drift') || '-4% (Manual Drift)';
      isPositiveDiff = false;
      reclaimedFactor = 0.20;
    } else if (currentPreset === 'radar') {
      roas = parseFloat((benchmark.targetRoas * 0.82).toFixed(1));
      roasDiffText = t('calculator.units.vs_baseline') || '+11% vs Baseline';
      isPositiveDiff = true;
      reclaimedFactor = 0.72;
    }

    // Calculations
    const wastedSaved = spend * benchmark.wasteRate * reclaimedFactor;
    const extraRevenue = wastedSaved * (roas - 1);
    const hoursSaved = Math.round((14 + (spend / 2500)) * reclaimedFactor);
    const leaksKilled = Math.max(2, Math.round((spend / 1400) * reclaimedFactor));

    // Animate stats
    animateValue(wastedSaved, extraRevenue, roas, hoursSaved, leaksKilled);

    // Update ROAS diff indicator
    if (roasDiffEl) {
      roasDiffEl.innerHTML = `
        <span class="material-symbols-outlined" style="font-size: 14px;">${isPositiveDiff ? 'arrow_upward' : 'arrow_downward'}</span>
        <span>${roasDiffText}</span>
      `;
      roasDiffEl.style.color = isPositiveDiff ? 'var(--color-primary)' : 'var(--color-error)';
    }
  }

  spendSlider.addEventListener('input', updateSimulation);
  if (nicheSelect) {
    nicheSelect.addEventListener('change', updateSimulation);
  }

  // Handle Preset Buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPreset = btn.getAttribute('data-preset') || 'autonomous';
      updateSimulation();
    });
  });

  // Pre-fill calculation immediately on load
  updateSimulation();

  // If user clicks the CTA in calculator, scroll to pricing plans heading
  if (ctaBtn) {
    ctaBtn.addEventListener('click', (e) => {
      const cardsTarget = document.getElementById('pricing-plans') || document.getElementById('pricing-cards') || document.getElementById('offers');
      if (cardsTarget) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = cardsTarget.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  }

  window.addEventListener('languageChanged', () => {
    updateSimulation();
  });
}
