/**
 * Shelby.ai - 24-Hour Autonomous Flight Log / Interactive Timeline
 * Replaces static/generic charts with an authentic, interactive day-in-the-life walkthrough.
 */
import { t } from './i18n.js';

export function initAutonomousTimeline() {
  const container = document.getElementById('autonomousTimeline');
  if (!container) return;

  let activeIndex = 0;
  let autoPlayInterval = null;
  let isAutoPlaying = false;
  let isVoicePlaying = false;

  const railEl = document.getElementById('timelineNavRail');
  const tagEl = document.getElementById('timelineStepTag');
  const titleEl = document.getElementById('timelineStepTitle');
  const descEl = document.getElementById('timelineStepDesc');
  const metricsContainer = document.getElementById('timelineMetricsRow');
  const waBubbleBody = document.getElementById('timelineWaBody');
  const waBubbleTime = document.getElementById('timelineWaTime');
  const waButtonsRow = document.getElementById('timelineWaButtons');
  const waVoicePlayer = document.getElementById('timelineVoicePlayer');
  const prevBtn = document.getElementById('timelinePrevBtn');
  const nextBtn = document.getElementById('timelineNextBtn');
  const autoPlayBtn = document.getElementById('timelineAutoPlayBtn');

  // Baseline definitions with fallback
  const baseSteps = [
    {
      id: '03:14am',
      time: '03:14 AM',
      icon: 'dark_mode',
      tagType: 'alert',
      isVoice: false
    },
    {
      id: '09:00am',
      time: '09:00 AM',
      icon: 'coffee',
      tagType: 'info',
      isVoice: true,
      voiceDuration: '0:42'
    },
    {
      id: '01:30pm',
      time: '01:30 PM',
      icon: 'trending_up',
      tagType: 'success',
      isVoice: false
    },
    {
      id: '05:45pm',
      time: '05:45 PM',
      icon: 'palette',
      tagType: 'warning',
      isVoice: false
    },
    {
      id: '11:00pm',
      time: '11:00 PM',
      icon: 'security',
      tagType: 'secure',
      isVoice: false
    }
  ];

  function getStepData(index) {
    const base = baseSteps[index];
    const key = `timeline.steps.${index}`;
    return {
      ...base,
      pillTitle: t(`${key}.pillTitle`),
      tag: t(`${key}.tag`),
      title: t(`${key}.title`),
      desc: t(`${key}.desc`),
      metrics: [
        { label: t(`${key}.m1_label`), value: t(`${key}.m1_val`), sub: t(`${key}.m1_sub`), highlight: false },
        { label: t(`${key}.m2_label`), value: t(`${key}.m2_val`), sub: t(`${key}.m2_sub`), highlight: true },
        { label: t(`${key}.m3_label`), value: t(`${key}.m3_val`), sub: t(`${key}.m3_sub`), highlight: false }
      ],
      waMessage: {
        isVoice: base.isVoice,
        voiceDuration: base.voiceDuration,
        time: base.time,
        body: t(`${key}.body`),
        buttons: t(`${key}.buttons`) || []
      }
    };
  }

  function updateNavRailPills() {
    if (!railEl) return;
    const navBtns = railEl.querySelectorAll('.timeline-nav-btn');
    navBtns.forEach((btn, i) => {
      const step = getStepData(i);
      const labelSpan = btn.querySelector('span:last-child');
      if (labelSpan && step.pillTitle) {
        labelSpan.textContent = step.pillTitle;
      }
    });
  }

  function renderStep(index, animate = true) {
    activeIndex = (index + baseSteps.length) % baseSteps.length;
    const step = getStepData(activeIndex);

    // Update Nav buttons
    const navBtns = railEl ? railEl.querySelectorAll('.timeline-nav-btn') : [];
    navBtns.forEach((btn, i) => {
      if (i === activeIndex) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // Content fade effect
    const narrativeCard = document.querySelector('.timeline-narrative-card');
    const phoneBubble = document.querySelector('.timeline-wa-bubble');
    if (animate && narrativeCard && phoneBubble) {
      narrativeCard.classList.add('timeline-fade');
      phoneBubble.classList.add('timeline-fade');
      setTimeout(() => {
        narrativeCard.classList.remove('timeline-fade');
        phoneBubble.classList.remove('timeline-fade');
      }, 260);
    }

    // Update Tag
    if (tagEl) {
      tagEl.textContent = step.tag;
      tagEl.className = `timeline-tag-badge tag-${step.tagType}`;
    }

    // Update Title & Desc
    if (titleEl) titleEl.textContent = step.title;
    if (descEl) descEl.textContent = step.desc;

    // Update Metrics
    if (metricsContainer) {
      metricsContainer.innerHTML = step.metrics.map(m => `
        <div class="timeline-metric-card ${m.highlight ? 'highlight-primary' : ''}">
          <span class="timeline-metric-label">${m.label}</span>
          <span class="timeline-metric-val ${m.highlight ? 'text-primary' : ''}">${m.value}</span>
          <span class="timeline-metric-sub">${m.sub}</span>
        </div>
      `).join('');
    }

    // Update WhatsApp Bubble
    if (waBubbleBody) waBubbleBody.innerHTML = step.waMessage.body;
    if (waBubbleTime) waBubbleTime.textContent = step.waMessage.time;

    // Voice player toggle
    if (waVoicePlayer) {
      if (step.waMessage.isVoice) {
        waVoicePlayer.style.display = 'flex';
      } else {
        waVoicePlayer.style.display = 'none';
        isVoicePlaying = false;
        updateVoicePlayerUI();
      }
    }

    // Quick-action interactive buttons
    if (waButtonsRow) {
      const btns = Array.isArray(step.waMessage.buttons) ? step.waMessage.buttons : [];
      waButtonsRow.innerHTML = btns.map(bText => `
        <button type="button" class="timeline-wa-action-btn">
          <span>${bText}</span>
        </button>
      `).join('');

      // Add feedback click handler to WhatsApp buttons
      waButtonsRow.querySelectorAll('.timeline-wa-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const originalText = btn.innerHTML;
          btn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">check_circle</span> <span>Action Sent to Meta!</span>`;
          btn.style.background = '#25D366';
          btn.style.color = '#ffffff';
          btn.style.borderColor = '#25D366';
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
          }, 1800);
        });
      });
    }
  }

  // Voice player interaction
  function updateVoicePlayerUI() {
    if (!waVoicePlayer) return;
    const playIcon = waVoicePlayer.querySelector('.voice-play-icon');
    const waveBars = waVoicePlayer.querySelectorAll('.wave-bar');
    if (playIcon) {
      playIcon.textContent = isVoicePlaying ? 'pause' : 'play_arrow';
    }
    waveBars.forEach(b => {
      b.style.animationPlayState = isVoicePlaying ? 'running' : 'paused';
    });
  }

  if (waVoicePlayer) {
    const playBtn = waVoicePlayer.querySelector('.voice-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        isVoicePlaying = !isVoicePlaying;
        updateVoicePlayerUI();
      });
    }
  }

  // Auto-play controls
  function startAutoPlay() {
    isAutoPlaying = true;
    if (autoPlayBtn) {
      autoPlayBtn.classList.add('playing');
      const pauseText = t('timeline.auto_pause') || 'Pause';
      autoPlayBtn.innerHTML = `
        <span class="material-symbols-outlined" style="font-size: 15px;">pause</span>
        <span>${pauseText}</span>
      `;
    }
    autoPlayInterval = setInterval(() => {
      renderStep(activeIndex + 1);
    }, 4500);
  }

  function stopAutoPlay() {
    isAutoPlaying = false;
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    if (autoPlayBtn) {
      autoPlayBtn.classList.remove('playing');
      const playText = t('timeline.auto_play') || 'Auto-Play Day';
      autoPlayBtn.innerHTML = `
        <span class="material-symbols-outlined" style="font-size: 15px;">play_arrow</span>
        <span>${playText}</span>
      `;
    }
  }

  if (autoPlayBtn) {
    autoPlayBtn.addEventListener('click', () => {
      if (isAutoPlaying) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      stopAutoPlay();
      renderStep(activeIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      stopAutoPlay();
      renderStep(activeIndex + 1);
    });
  }

  // Wire Rail Buttons
  if (railEl) {
    const buttons = railEl.querySelectorAll('.timeline-nav-btn');
    buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        stopAutoPlay();
        renderStep(index);
      });
    });
  }

  window.addEventListener('languageChanged', () => {
    updateNavRailPills();
    renderStep(activeIndex, false);
    if (isAutoPlaying) {
      startAutoPlay();
    } else {
      stopAutoPlay();
    }
  });

  // Initial step render
  updateNavRailPills();
  renderStep(0, false);
}
