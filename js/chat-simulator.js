/**
 * Shelby.ai - WhatsApp Media Buyer Simulator Module
 * Features realistic typing, interactive scenario switching, audio voice note simulation, and custom prompt execution
 */
import { t } from './i18n.js';

export function initChatSimulator() {
  const chatStream = document.getElementById('chatMessageStream');
  const chatInput = document.getElementById('chatMockInput');
  const chatForm = document.getElementById('chatSimulatorForm');
  const typingIndicator = document.getElementById('chatTypingIndicator');
  const quickChips = document.querySelectorAll('.chat-quick-chip');
  const scenarioTabs = document.querySelectorAll('.scenario-tab-btn');
  const resetBtn = document.getElementById('resetChatBtn');

  if (!chatStream) return;

  let currentScenarioKey = 'cut';

  function getFormattedTime() {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function scrollChatToBottom() {
    if (!chatStream) return;
    requestAnimationFrame(() => {
      chatStream.scrollTop = chatStream.scrollHeight;
    });
  }

  function getScenarioConversations() {
    return {
      cut: [
        {
          type: 'user',
          time: '03:14',
          text: t('chat.scenarios.cut.user') || 'CPA spiked on broad audience. Is my ad budget leaking right now?'
        },
        {
          type: 'shelby',
          time: '03:15',
          badge: t('chat.scenarios.cut.badge') || 'Automated Anomaly Radar • 180s Auto-Cut',
          title: t('chat.scenarios.cut.title') || 'Action Executed: Saved €142 overnight',
          text: t('chat.scenarios.cut.text') || 'Paused ad set <strong>"Summer Broad - Lookalike 5%"</strong>. CPA surged +82% (€48.20 vs €26.50 target). No other leaks detected.',
          details: `
            <div style="margin-top: 8px; padding: 8px; border-radius: 8px; background: var(--surface-subtle); font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.cut.lbl_protected') || 'Budget Protected:'}</span><span style="color: var(--color-primary); font-weight: 700;">${t('chat.scenarios.cut.val_protected') || '€142.00 tonight'}</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.cut.lbl_rec') || 'Recommended Action:'}</span><span style="font-weight: 600;">${t('chat.scenarios.cut.val_rec') || 'Shift €60/day to 4.6x ROAS winner'}</span></div>
            </div>
          `
        }
      ],
      scale: [
        {
          type: 'user',
          time: '11:20',
          text: t('chat.scenarios.scale.user') || 'Scale the winning creative +30% before the weekend rush.'
        },
        {
          type: 'shelby',
          time: '11:20',
          badge: t('chat.scenarios.scale.badge') || 'Meta Graph API v20.0 • Budget Scaled',
          title: t('chat.scenarios.scale.title') || 'Scale Live: Retargeting LAL 2% updated',
          text: t('chat.scenarios.scale.text') || 'Daily budget increased from <strong>€140/day to €182/day</strong>. Frequency is 1.34 (healthy ceiling). Meta auction pacing verified.',
          details: `
            <div style="margin-top: 8px; padding: 8px; border-radius: 8px; background: var(--surface-subtle); font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.scale.lbl_roas') || 'Expected ROAS:'}</span><span style="color: var(--color-primary); font-weight: 700;">${t('chat.scenarios.scale.val_roas') || '4.8x pace'}</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.scale.lbl_latency') || 'Auction Latency:'}</span><span style="font-weight: 600;">${t('chat.scenarios.scale.val_latency') || '1.4s synchronized'}</span></div>
            </div>
          `
        }
      ],
      hooks: [
        {
          type: 'user',
          time: '14:05',
          text: t('chat.scenarios.hooks.user') || 'Generate 3 high-converting UGC angles to fight ad fatigue.'
        },
        {
          type: 'shelby',
          time: '14:06',
          badge: t('chat.scenarios.hooks.badge') || 'Creative Angle Synthesizer',
          title: t('chat.scenarios.hooks.title') || '3 Viral Hook Variations Generated:',
          text: t('chat.scenarios.hooks.text') || 'Based on your top 20% historical converting creatives:',
          details: `
            <div style="margin-top: 8px; padding: 8px; border-radius: 8px; background: var(--surface-subtle); font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
              <div><strong style="color: var(--color-primary);">${t('chat.scenarios.hooks.h1_title') || '#1 The Contrarian Hook:'}</strong> ${t('chat.scenarios.hooks.h1_body') || '"Stop throwing money at Meta broad targeting until you do this 1 thing..."'}</div>
              <div><strong style="color: var(--color-primary);">${t('chat.scenarios.hooks.h2_title') || '#2 The Unboxing Regret:'}</strong> ${t('chat.scenarios.hooks.h2_body') || '"The only mistake I made ordering this was not getting the bundle..."'}</div>
              <div><strong style="color: var(--color-primary);">${t('chat.scenarios.hooks.h3_title') || '#3 Social Proof Bomb:'}</strong> ${t('chat.scenarios.hooks.h3_body') || '"Over 4,200 founders made the switch this month alone."'}</div>
            </div>
          `
        }
      ],
      espresso: [
        {
          type: 'shelby',
          time: '09:00',
          badge: t('chat.scenarios.espresso.badge') || '09:00 AM Espresso Briefing',
          title: t('chat.scenarios.espresso.title') || 'Yesterday\'s Full Telemetry Digest',
          text: t('chat.scenarios.espresso.text') || 'Good morning Alex! Here is your 60-second WhatsApp ad digest for yesterday:',
          details: `
            <div style="margin-top: 8px; padding: 8px; border-radius: 8px; background: var(--surface-subtle); font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.espresso.lbl_spend') || 'Ad Spend:'}</span><span style="font-weight: 700;">${t('chat.scenarios.espresso.val_spend') || '€412.50'}</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.espresso.lbl_rev') || 'Revenue / ROAS:'}</span><span style="color: var(--color-primary); font-weight: 700;">${t('chat.scenarios.espresso.val_rev') || '€1,894 (4.6x ROAS)'}</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.espresso.lbl_orders') || 'Orders:'}</span><span style="font-weight: 600;">${t('chat.scenarios.espresso.val_orders') || '34 Orders (CPA €12.13)'}</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.espresso.lbl_status') || 'Status:'}</span><span style="color: var(--color-primary); font-weight: 700;">${t('chat.scenarios.espresso.val_status') || 'All 4 active ad sets healthy'}</span></div>
            </div>
          `
        }
      ]
    };
  }

  function renderScenario(scenarioKey, animate = true) {
    currentScenarioKey = scenarioKey;
    const conversations = getScenarioConversations();
    const messages = conversations[scenarioKey];
    if (!messages) return;

    // Clear existing bubbles except typing indicator and voice note
    const currentBubbles = chatStream.querySelectorAll('.chat-bubble-user, .chat-bubble-shelby');
    currentBubbles.forEach(b => b.remove());

    if (!animate) {
      messages.forEach((msg) => {
        if (msg.type === 'user') {
          appendUserMessage(msg.text, msg.time);
        } else {
          appendShelbyResponse(msg.badge, msg.title, msg.text, msg.details, msg.time);
        }
      });
      return;
    }

    if (typingIndicator) typingIndicator.style.display = 'flex';

    // Stagger render for realistic messaging feel
    let delay = 150;
    messages.forEach((msg, idx) => {
      setTimeout(() => {
        if (msg.type === 'user') {
          appendUserMessage(msg.text, msg.time);
        } else {
          appendShelbyResponse(msg.badge, msg.title, msg.text, msg.details, msg.time);
        }

        if (idx === messages.length - 1 && typingIndicator) {
          typingIndicator.style.display = 'none';
        }
      }, delay);
      delay += 350;
    });
  }

  function appendUserMessage(text, customTime) {
    const time = customTime || getFormattedTime();
    const div = document.createElement('div');
    div.className = 'chat-bubble-user animate-msg-in';
    div.innerHTML = `
      <p style="margin: 0; line-height: 1.4; font-size: 14px;">${escapeHTML(text)}</p>
      <div class="chat-meta">
        <span>${time}</span>
        <span class="material-symbols-outlined" style="font-size: 14px; color: #004b1f;">done_all</span>
      </div>
    `;
    if (typingIndicator) {
      chatStream.insertBefore(div, typingIndicator);
    } else {
      chatStream.appendChild(div);
    }
    scrollChatToBottom();
  }

  function appendShelbyResponse(badge, title, text, details, customTime) {
    const time = customTime || getFormattedTime();
    const div = document.createElement('div');
    div.className = 'chat-bubble-shelby animate-msg-in';
    div.innerHTML = `
      <div class="flex items-center gap-1" style="margin-bottom: 4px;">
        <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-primary);">verified</span>
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-primary); letter-spacing: 0.04em;">${badge}</span>
      </div>
      <p style="margin: 0; line-height: 1.4; font-size: 14px; color: var(--color-text-primary);">
        ${text}
      </p>
      ${details}
      <div class="chat-meta">
        <span>${time}</span>
      </div>
    `;
    if (typingIndicator) {
      chatStream.insertBefore(div, typingIndicator);
    } else {
      chatStream.appendChild(div);
    }
    scrollChatToBottom();
  }

  // Voice Note Simulation Interactive Player
  function setupVoiceNotePlayer() {
    const voiceNoteBtn = document.getElementById('playVoiceNoteBtn');
    const voiceBars = document.querySelectorAll('.waveform-bar');
    const voiceTimer = document.getElementById('voiceNoteTimer');
    const voiceIcon = document.getElementById('voiceNotePlayIcon');

    if (!voiceNoteBtn) return;

    let isPlaying = false;
    let secondsLeft = 14;
    let timerInterval = null;

    voiceNoteBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;

      if (isPlaying) {
        if (voiceIcon) voiceIcon.textContent = 'pause';
        voiceBars.forEach(b => b.classList.add('playing'));
        
        timerInterval = setInterval(() => {
          secondsLeft--;
          if (secondsLeft <= 0) {
            clearInterval(timerInterval);
            isPlaying = false;
            secondsLeft = 14;
            if (voiceIcon) voiceIcon.textContent = 'play_arrow';
            voiceBars.forEach(b => b.classList.remove('playing'));
          }
          const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
          const secs = String(secondsLeft % 60).padStart(2, '0');
          if (voiceTimer) voiceTimer.textContent = `${mins}:${secs}`;
        }, 1000);
      } else {
        clearInterval(timerInterval);
        if (voiceIcon) voiceIcon.textContent = 'play_arrow';
        voiceBars.forEach(b => b.classList.remove('playing'));
      }
    });
  }

  // Hook Scenario Tabs
  scenarioTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      scenarioTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const scenarioKey = tab.getAttribute('data-scenario');
      renderScenario(scenarioKey);
    });
  });

  // Quick Chips
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (chatInput) {
        chatInput.value = prompt;
        chatInput.focus();
      }
      handleChatSubmit(prompt);
    });
  });

  // Custom Form Submission
  function handleChatSubmit(text) {
    if (!text || text.trim() === '') return;
    appendUserMessage(text);
    if (chatInput) chatInput.value = '';

    if (typingIndicator) typingIndicator.style.display = 'flex';
    scrollChatToBottom();

    setTimeout(() => {
      if (typingIndicator) typingIndicator.style.display = 'none';
      const parsed = parsePrompt(text);
      appendShelbyResponse(parsed.badge, parsed.title, parsed.text, parsed.details);
    }, 750);
  }

  function parsePrompt(userInput) {
    const text = userInput.toLowerCase();
    if (text.includes('pause') || text.includes('cut') || text.includes('leak') || text.includes('пауз') || text.includes('останов') || text.includes('слив') || text.includes('pauz') || text.includes('aptur') || text.includes('noplūd')) {
      return {
        badge: t('chat.scenarios.cut.badge') || 'Anomaly Radar • Auto-Cut Executed',
        title: t('chat.scenarios.cut.title') || 'Wasted spend paused immediately',
        text: t('chat.scenarios.cut.text') || 'Paused 2 bleeding ad sets exceeding €28 CPA guardrails. Saved €84/day.',
        details: `
          <div style="margin-top: 8px; padding: 8px; border-radius: 8px; background: var(--surface-subtle); font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.cut.lbl_protected') || 'Protected Daily:'}</span><span style="color: var(--color-primary); font-weight: 700;">€84.00</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.cut.lbl_rec') || 'Reallocation:'}</span><span style="font-weight: 600;">Shifted to Retargeting 4.6x</span></div>
          </div>
        `
      };
    } else if (text.includes('scale') || text.includes('winner') || text.includes('budget') || text.includes('масштаб') || text.includes('бюджет') || text.includes('mērog') || text.includes('merog') || text.includes('budžet') || text.includes('budzet')) {
      return {
        badge: t('chat.scenarios.scale.badge') || 'Scale Trigger • Meta API 200 OK',
        title: t('chat.scenarios.scale.title') || 'Budget increased +25%',
        text: t('chat.scenarios.scale.text') || 'Scale command received. Budget updated to <strong>€180/day</strong>. Pacing optimal.',
        details: `
          <div style="margin-top: 8px; padding: 8px; border-radius: 8px; background: var(--surface-subtle); font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.scale.lbl_roas') || 'New Pacing:'}</span><span style="color: var(--color-primary); font-weight: 700;">4.8x ROAS Pace</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">${t('chat.scenarios.scale.lbl_latency') || 'Latency:'}</span><span style="font-weight: 600;">1.2 seconds</span></div>
          </div>
        `
      };
    } else {
      return {
        badge: 'Meta Cloud Assistant Active',
        title: 'Ad account synchronized',
        text: `Command analyzed: <em>"${escapeHTML(userInput)}"</em>. Shelby has queued this action with your account guardrails intact.`,
        details: `
          <div style="margin-top: 8px; padding: 8px; border-radius: 8px; background: var(--surface-subtle); font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--color-text-muted);">Status:</span><span style="color: var(--color-primary); font-weight: 700;">Confirmed in WhatsApp</span></div>
          </div>
        `
      };
    }
  }

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = chatInput ? chatInput.value : '';
      handleChatSubmit(val);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      renderScenario('cut');
      if (scenarioTabs.length) {
        scenarioTabs.forEach(t => t.classList.remove('active'));
        scenarioTabs[0].classList.add('active');
      }
    });
  }

  window.addEventListener('languageChanged', () => {
    // If a scenario tab is currently selected, re-render it in new language
    renderScenario(currentScenarioKey, false);
  });

  setupVoiceNotePlayer();
}
