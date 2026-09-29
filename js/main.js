/**
 * Shelby.ai - Main Application Entrypoint
 */
import { initI18n } from './i18n.js';
import { initNav } from './nav.js';
import { initChatSimulator } from './chat-simulator.js';
import { initProfitCalculator } from './calculator.js';
import { initAutonomousTimeline } from './timeline.js';
import { initAutopsySlider } from './autopsy-slider.js';
import { initTelemetryHUD } from './telemetry.js';
import { initPricing } from './pricing.js';
import { initFAQ } from './faq.js';
import { initModal } from './modal.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize internationalization before or in parallel with modules
  await initI18n();
  initNav();
  initChatSimulator();
  initProfitCalculator();
  initAutonomousTimeline();
  initAutopsySlider();
  initTelemetryHUD();
  initPricing();
  initFAQ();
  initModal();
});
