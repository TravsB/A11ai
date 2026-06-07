/**
 * VisionAdapt — Polymorph AI Content Script
 * Runs on every page. Analyzes page accessibility, stores per-site profiles,
 * and applies optimal visual settings.
 */

(function () {
  "use strict";

  // ─── Constants ──────────────────────────────────────────────────────────────
  const CLASS_ACTIVE = "visionadapt-active";
  const STYLE_ID = "visionadapt-styles";
  const SVG_ID = "visionadapt-filters";
  const BADGE_ID = "visionadapt-badge";

  const hostname = location.hostname;

  // ─── SVG Color-Blindness Filters ─────────────────────────────────────────────
  const FILTER_SVG = `<svg id="${SVG_ID}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;">
    <defs>
      <filter id="va-protanopia" color-interpolation-filters="linearRGB">
        <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="va-deuteranopia" color-interpolation-filters="linearRGB">
        <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.700 0.300 0 0 0  0 0.300 0.700 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="va-tritanopia" color-interpolation-filters="linearRGB">
        <feColorMatrix type="matrix" values="0.950 0.050 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="va-achromatopsia" color-interpolation-filters="linearRGB">
        <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"/>
      </filter>
      <filter id="va-low-contrast">
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.6" intercept="-0.04"/>
          <feFuncG type="linear" slope="1.6" intercept="-0.04"/>
          <feFuncB type="linear" slope="1.6" intercept="-0.04"/>
        </feComponentTransfer>
      </filter>
    </defs>
  </svg>`;

  const FILTER_MAP = {
    protanopia: "url(#va-protanopia)",
    deuteranopia: "url(#va-deuteranopia)",
    tritanopia: "url(#va-tritanopia)",
    achromatopsia: "url(#va-achromatopsia)",
    "low-contrast": "url(#va-low-contrast)",
  };

  // ─── State ───────────────────────────────────────────────────────────────────
  let currentSettings = null;
  let analysisRan = false;

  // ─── Inject SVG filters ──────────────────────────────────────────────────────
  function injectFilters() {
    if (!document.getElementById(SVG_ID)) {
      const container = document.createElement("div");
      container.innerHTML = FILTER_SVG;
      document.body.prepend(container.firstElementChild);
    }
  }

  // ─── Polymorph AI: Page Analysis ─────────────────────────────────────────────
  /**
   * Analyzes the page's colors, contrast, and text to recommend
   * the best accessibility settings automatically.
   */
  function analyzePageContrast() {
    const results = {
      lowContrastAreas: 0,
      totalSampled: 0,
      avgLuminanceDiff: 0,
      darkBackground: false,
      smallTextCount: 0,
      verySmallTextCount: 0,
    };

    try {
      // Sample a cross-section of visible text elements
      const selectors = "p, h1, h2, h3, h4, h5, h6, li, td, th, span, a, label, button, div";
      const elements = Array.from(document.querySelectorAll(selectors)).slice(0, 120);
      let lumDiffSum = 0;
      let sampled = 0;

      for (const el of elements) {
        if (!el.innerText?.trim() || el.offsetParent === null) continue;
        const style = window.getComputedStyle(el);
        const color = parseRGBA(style.color);
        const bg = getEffectiveBackground(el);
        const fsize = parseFloat(style.fontSize);

        if (!color || !bg) continue;

        const lumFg = relativeLuminance(color);
        const lumBg = relativeLuminance(bg);
        const contrast = contrastRatio(lumFg, lumBg);
        const diff = Math.abs(lumFg - lumBg);

        lumDiffSum += diff;
        sampled++;

        if (contrast < 4.5) results.lowContrastAreas++;
        if (fsize < 13) results.verySmallTextCount++;
        else if (fsize < 16) results.smallTextCount++;
      }

      results.totalSampled = sampled;
      results.avgLuminanceDiff = sampled > 0 ? lumDiffSum / sampled : 0.5;

      // Check body background darkness
      const bodyBg = parseRGBA(window.getComputedStyle(document.body).backgroundColor);
      if (bodyBg) {
        results.darkBackground = relativeLuminance(bodyBg) < 0.18;
      }
    } catch (_) {}

    return results;
  }

  /**
   * Given page analysis, determine the best accessibility profile.
   */
  function deriveRecommendedProfile(analysis) {
    const profile = {
      mode: "none",
      contrastBoost: 0,
      fontSize: 100,
      lineHeight: 100,
      readableFont: false,
      highReadability: false,
      focusEnhance: true,
      linkUnderline: true,
      aiGenerated: true,
      aiReason: "",
    };

    const lowContrastRatio = analysis.totalSampled > 0
      ? analysis.lowContrastAreas / analysis.totalSampled
      : 0;

    const reasons = [];

    // Contrast issues
    if (lowContrastRatio > 0.35) {
      profile.contrastBoost = 30;
      reasons.push("low contrast detected on " + Math.round(lowContrastRatio * 100) + "% of text");
    } else if (lowContrastRatio > 0.18) {
      profile.contrastBoost = 15;
      reasons.push("moderate contrast issues detected");
    }

    // Very small text
    if (analysis.verySmallTextCount > 8) {
      profile.fontSize = 112;
      profile.readableFont = true;
      reasons.push("very small text detected");
    } else if (analysis.smallTextCount > 12) {
      profile.fontSize = 106;
      reasons.push("small text detected");
    }

    // Dense text / poor spacing
    if (analysis.smallTextCount + analysis.verySmallTextCount > 20) {
      profile.lineHeight = 130;
      profile.highReadability = true;
      reasons.push("dense text layout");
    }

    profile.aiReason = reasons.length > 0
      ? "Applied because: " + reasons.join("; ") + "."
      : "Page appears accessible — minimal adjustments made.";

    return profile;
  }

  // ─── Color helpers ────────────────────────────────────────────────────────────
  function parseRGBA(str) {
    if (!str) return null;
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
  }

  function getEffectiveBackground(el) {
    let node = el;
    while (node && node !== document.body) {
      const bg = window.getComputedStyle(node).backgroundColor;
      const parsed = parseRGBA(bg);
      if (parsed && parsed.a > 0.1 && !(parsed.r === 0 && parsed.g === 0 && parsed.b === 0 && parsed.a === 0)) {
        return parsed;
      }
      node = node.parentElement;
    }
    // Fallback: body background
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    return parseRGBA(bodyBg) || { r: 255, g: 255, b: 255, a: 1 };
  }

  function linearize(c) {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance({ r, g, b }) {
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  }

  function contrastRatio(lum1, lum2) {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // ─── CSS Generation ───────────────────────────────────────────────────────────
  function buildCSS(settings) {
    if (!settings) return "";

    const parts = [];
    const filterParts = [];

    // Color-blindness filter
    if (FILTER_MAP[settings.mode]) {
      filterParts.push(FILTER_MAP[settings.mode]);
    }

    // Contrast boost
    if (settings.contrastBoost && settings.contrastBoost !== 0) {
      const c = 1 + settings.contrastBoost / 100;
      filterParts.push(`contrast(${c.toFixed(2)})`);
      if (c > 1.1) filterParts.push(`brightness(${(1 + (c - 1) * 0.05).toFixed(3)})`);
    }

    const filterValue = filterParts.length ? filterParts.join(" ") : "none";
    parts.push(`html.${CLASS_ACTIVE} body { filter: ${filterValue} !important; transition: filter 250ms ease !important; }`);

    // Typography
    const typoParts = [];
    if (settings.readableFont) {
      typoParts.push(`font-family: Verdana, 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif !important;`);
    }
    if (settings.fontSize && settings.fontSize !== 100) {
      typoParts.push(`font-size: ${settings.fontSize}% !important;`);
    }
    if (settings.lineHeight && settings.lineHeight !== 100) {
      typoParts.push(`line-height: ${(settings.lineHeight / 100) * 1.5} !important;`);
    }
    if (settings.highReadability) {
      typoParts.push(`letter-spacing: 0.04em !important; word-spacing: 0.08em !important;`);
    }
    if (typoParts.length) {
      parts.push(`html.${CLASS_ACTIVE} body, html.${CLASS_ACTIVE} p, html.${CLASS_ACTIVE} li, html.${CLASS_ACTIVE} td, html.${CLASS_ACTIVE} span, html.${CLASS_ACTIVE} div { ${typoParts.join(" ")} }`);
    }

    // Links
    if (settings.linkUnderline !== false) {
      parts.push(`html.${CLASS_ACTIVE} a:not([role=button]):not(.btn) { text-decoration: underline !important; text-underline-offset: 2px !important; }`);
    }

    // Focus enhancement
    if (settings.focusEnhance !== false) {
      parts.push(`html.${CLASS_ACTIVE} :focus-visible { outline: 3px solid #f59e0b !important; outline-offset: 2px !important; border-radius: 3px !important; box-shadow: 0 0 0 5px rgba(245,158,11,0.2) !important; }`);
    }

    // Invalid field highlight
    parts.push(`html.${CLASS_ACTIVE} [aria-invalid="true"], html.${CLASS_ACTIVE} input:invalid { border-color: #dc2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,0.2) !important; }`);

    return parts.join("\n");
  }

  // ─── Apply / Remove ──────────────────────────────────────────────────────────
  function applySettings(settings) {
    currentSettings = settings;
    injectFilters();

    document.documentElement.classList.add(CLASS_ACTIVE);

    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = buildCSS(settings);

    showBadge(settings);
  }

  function removeSettings() {
    document.documentElement.classList.remove(CLASS_ACTIVE);
    const styleEl = document.getElementById(STYLE_ID);
    if (styleEl) styleEl.textContent = "";
    removeBadge();
    currentSettings = null;
  }

  // ─── Status Badge ─────────────────────────────────────────────────────────────
  function showBadge(settings) {
    removeBadge();
    if (!settings.aiGenerated) return;

    const badge = document.createElement("div");
    badge.id = BADGE_ID;
    badge.setAttribute("aria-label", "VisionAdapt Polymorph AI active");
    badge.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 2147483647;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 20px;
      box-shadow: 0 4px 16px rgba(99,102,241,0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.3s ease;
      pointer-events: auto;
      letter-spacing: 0.01em;
    `;
    badge.innerHTML = `<span style="font-size:14px;">✦</span> Polymorph AI`;
    badge.title = settings.aiReason || "VisionAdapt auto-applied accessibility settings";

    // Auto-hide after 4s
    document.body.appendChild(badge);
    setTimeout(() => {
      if (badge.parentNode) {
        badge.style.opacity = "0";
        setTimeout(() => badge.remove(), 350);
      }
    }, 4000);
  }

  function removeBadge() {
    const existing = document.getElementById(BADGE_ID);
    if (existing) existing.remove();
  }

  // ─── Main: handle message from background ────────────────────────────────────
  async function runPolymorphAI(global, existingProfile) {
    if (!global.polymorphAI) return existingProfile;
    if (analysisRan) return existingProfile;
    analysisRan = true;

    // If we already have a saved profile for this site, use it immediately
    if (existingProfile) return existingProfile;

    // Otherwise, analyze the page
    const analysis = analyzePageContrast();
    const profile = deriveRecommendedProfile(analysis);

    // Save the derived profile
    try {
      chrome.runtime.sendMessage({
        type: "AI_ANALYSIS_DONE",
        hostname,
        profile
      });
    } catch (_) {}

    return profile;
  }

  // ─── Listen for messages ─────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
      if (message.type === "APPLY") {
        const { global, siteProfile } = message;

        if (!global.enabled) {
          removeSettings();
          sendResponse({ ok: true });
          return;
        }

        let settings;
        if (global.globalOverride) {
          settings = { ...global.globalSettings, aiGenerated: false };
        } else if (global.polymorphAI) {
          const profile = await runPolymorphAI(global, siteProfile);
          settings = { ...global.globalSettings, ...profile };
        } else {
          settings = siteProfile
            ? { ...global.globalSettings, ...siteProfile }
            : { ...global.globalSettings };
        }

        applySettings(settings);
        sendResponse({ ok: true, settings });
      }

      else if (message.type === "DISABLE") {
        removeSettings();
        sendResponse({ ok: true });
      }

      else if (message.type === "GET_ANALYSIS") {
        const analysis = analyzePageContrast();
        const profile = deriveRecommendedProfile(analysis);
        sendResponse({ analysis, profile, hostname });
      }

      else if (message.type === "APPLY_OVERRIDE") {
        applySettings({ ...message.settings, aiGenerated: false });
        sendResponse({ ok: true });
      }

      else if (message.type === "RESET") {
        removeSettings();
        analysisRan = false;
        sendResponse({ ok: true });
      }
    })();
    return true;
  });

  // ─── Bootstrap: request initial state on page load ───────────────────────────
  async function bootstrap() {
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_STATE", hostname });
      if (!response) return;

      const { global, siteProfile } = response;
      if (!global.enabled) return;

      let settings;
      if (global.globalOverride) {
        settings = { ...global.globalSettings, aiGenerated: false };
      } else if (global.polymorphAI) {
        const profile = await runPolymorphAI(global, siteProfile);
        settings = { ...global.globalSettings, ...profile };
      } else {
        settings = siteProfile
          ? { ...global.globalSettings, ...siteProfile }
          : { ...global.globalSettings };
      }

      applySettings(settings);
    } catch (_) {}
  }

  // Run bootstrap once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
