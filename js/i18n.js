/**
 * Shelby.ai - Internationalization (i18n) Engine
 * Seamlessly manages English and Russian locales, persistent user preferences,
 * DOM updates, and custom reactive event dispatching.
 */

let currentLocale = 'en';
const localeCache = {};

/**
 * Resolve nested object key path (e.g. 'calculator.units.vs_avg')
 */
export function getNestedValue(obj, keyPath) {
  if (!obj || !keyPath) return null;
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
}

/**
 * Fetch and cache locale file from /locales/{lang}.json
 */
export async function loadLocale(lang) {
  if (localeCache[lang]) {
    return localeCache[lang];
  }
  try {
    const res = await fetch(`locales/${lang}.json`);
    if (!res.ok) {
      throw new Error(`Failed to load locale: ${lang} (${res.status})`);
    }
    const data = await res.json();
    localeCache[lang] = data;
    return data;
  } catch (err) {
    console.error(`[i18n] Error loading locale "${lang}":`, err);
    // If ru fails, fallback to en if possible
    if (lang !== 'en' && localeCache['en']) {
      return localeCache['en'];
    }
    return null;
  }
}

/**
 * Get translated text by key path with optional param interpolation
 */
export function t(keyPath, params = {}) {
  const dict = localeCache[currentLocale] || localeCache['en'];
  let val = getNestedValue(dict, keyPath);
  
  // Fallback to English if not found in current locale
  if (val === null || val === undefined) {
    val = getNestedValue(localeCache['en'], keyPath);
  }

  if (val === null || val === undefined) {
    return keyPath;
  }

  if (typeof val === 'string' && params && typeof params === 'object') {
    Object.keys(params).forEach(k => {
      val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
    });
  }
  return val;
}

/**
 * Returns current active language code ('en' | 'ru')
 */
export function getCurrentLanguage() {
  return currentLocale;
}

/**
 * Apply translation dictionary to the current DOM elements
 */
export function applyTranslations() {
  const dict = localeCache[currentLocale];
  if (!dict) return;

  // 1. Update HTML lang attribute
  document.documentElement.lang = currentLocale;

  // 2. Update page title and description
  const metaTitle = getNestedValue(dict, 'meta.title');
  if (metaTitle) {
    document.title = metaTitle;
  }
  const metaDesc = getNestedValue(dict, 'meta.description');
  if (metaDesc) {
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) descEl.setAttribute('content', metaDesc);
    const ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.setAttribute('content', metaDesc);
    const twDescEl = document.querySelector('meta[name="twitter:description"]');
    if (twDescEl) twDescEl.setAttribute('content', metaDesc);
  }

  // 3. Update all data-i18n elements (innerHTML or textContent)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    if (translation && translation !== key) {
      if (/<[a-z][\s\S]*>/i.test(translation)) {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
    }
  });

  // 4. Update data-i18n-html elements specifically
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const translation = t(key);
    if (translation && translation !== key) {
      el.innerHTML = translation;
    }
  });

  // 5. Update data-i18n-placeholder elements
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translation = t(key);
    if (translation && translation !== key) {
      el.placeholder = translation;
    }
  });

  // 6. Update data-i18n-aria elements
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    const translation = t(key);
    if (translation && translation !== key) {
      el.setAttribute('aria-label', translation);
    }
  });

  // 7. Update data-i18n-title elements
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const translation = t(key);
    if (translation && translation !== key) {
      el.setAttribute('title', translation);
    }
  });

  // 8. Update language switcher UI elements
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const lang = btn.getAttribute('data-lang');
    if (lang === currentLocale) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // 9. Dispatch custom event for dynamic JS modules
  window.dispatchEvent(new CustomEvent('languageChanged', {
    detail: { lang: currentLocale, t }
  }));
}

/**
 * Change the active language
 */
export async function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'ru' && lang !== 'lv') {
    lang = 'en';
  }
  currentLocale = lang;
  try {
    localStorage.setItem('shelby_lang', lang);
  } catch (e) {
    // LocalStorage might be restricted
  }

  await loadLocale(lang);
  // Also preload English in background if currently not loaded for fallbacks
  if (lang !== 'en' && !localeCache['en']) {
    loadLocale('en');
  }

  applyTranslations();
}

/**
 * Initialize internationalization on application load
 */
export async function initI18n() {
  // Determine initial language: localStorage -> navigator.language -> default 'en'
  let saved = null;
  try {
    saved = localStorage.getItem('shelby_lang');
  } catch (e) {}

  if (saved === 'en' || saved === 'ru' || saved === 'lv') {
    currentLocale = saved;
  } else {
    const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (navLang.startsWith('lv')) {
      currentLocale = 'lv';
    } else if (navLang.startsWith('ru')) {
      currentLocale = 'ru';
    } else {
      currentLocale = 'en';
    }
  }

  // Attach click listeners to language switchers
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (btn) {
      const targetLang = btn.getAttribute('data-lang');
      if (targetLang && targetLang !== currentLocale) {
        setLanguage(targetLang);
      }
    }
  });

  // Always load en for fallback, then current locale
  await loadLocale('en');
  if (currentLocale !== 'en') {
    await loadLocale(currentLocale);
  }

  applyTranslations();
}
