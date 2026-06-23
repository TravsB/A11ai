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

  // ─── Self-interference prevention ─────────────────────────────────────────────
  // Exit early if running on A11ai web app domains to prevent interference
  const EXCLUDED_DOMAINS = ["a11ai.lovable.app", "lovable.app", "lovable.dev"];
  if (EXCLUDED_DOMAINS.some(domain => hostname === domain || hostname.endsWith("." + domain))) {
    console.log("[VisionAdapt] Skipping excluded domain:", hostname);
    return;
  }

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
  let mutationObserver = null;
  let analysisDebounceTimer = null;
  let globalState = null;

  // ─── Inject SVG filters ──────────────────────────────────────────────────────
  function injectFilters() {
    if (!document.getElementById(SVG_ID)) {
      const container = document.createElement("div");
      container.innerHTML = FILTER_SVG;
      document.body.prepend(container.firstElementChild);
    }
  }

  // ─── MutationObserver for dynamic content ─────────────────────────────────────
  function setupMutationObserver() {
    if (mutationObserver) return;

    mutationObserver = new MutationObserver((mutations) => {
      // Check if significant content changes occurred
      const hasContentChanges = mutations.some(mutation => {
        return mutation.type === 'childList' &&
               (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) &&
               Array.from(mutation.addedNodes).some(node =>
                 node.nodeType === Node.ELEMENT_NODE &&
                 (node.tagName === 'DIV' || node.tagName === 'P' || node.tagName === 'SPAN' ||
                  node.tagName === 'A' || node.tagName === 'BUTTON' || node.tagName === 'H1' ||
                  node.tagName === 'H2' || node.tagName === 'H3' || node.tagName === 'LI')
               );
      });

      if (hasContentChanges) {
        // Debounce re-analysis
        if (analysisDebounceTimer) clearTimeout(analysisDebounceTimer);
        analysisDebounceTimer = setTimeout(() => {
          if (currentSettings && globalState?.polymorphAI) {
            analysisRan = false; // Allow re-analysis
            // Re-request state and re-apply
            chrome.runtime.sendMessage({ type: "GET_STATE", hostname })
              .then(response => {
                if (response?.global?.enabled) {
                  const profile = runPolymorphAI(response.global, response.siteProfile);
                  const settings = { ...response.global.globalSettings, ...profile };
                  applySettings(settings);
                }
              })
              .catch(err => console.error("[VisionAdapt] Re-analysis error:", err));
          }
        }, 1000); // Wait 1 second after content changes before re-analyzing
      }
    });

    // Start observing the document body
    if (document.body) {
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });
    }
  }

  function cleanupMutationObserver() {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    if (analysisDebounceTimer) {
      clearTimeout(analysisDebounceTimer);
      analysisDebounceTimer = null;
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
      // Ensure document and body exist
      if (!document || !document.body) {
        console.warn("[VisionAdapt] Document or body not available for analysis");
        return results;
      }

      // Sample a cross-section of visible text elements
      const selectors = "p, h1, h2, h3, h4, h5, h6, li, td, th, span, a, label, button, div";
      const elements = Array.from(document.querySelectorAll(selectors)).slice(0, 120);
      let lumDiffSum = 0;
      let sampled = 0;

      for (const el of elements) {
        try {
          if (!el.innerText?.trim() || el.offsetParent === null) continue;
          const style = window.getComputedStyle(el);
          const color = parseRGBA(style.color);
          const bg = getEffectiveBackground(el);
          const fsize = parseFloat(style.fontSize);

          if (!color || !bg || isNaN(fsize)) continue;

          const lumFg = relativeLuminance(color);
          const lumBg = relativeLuminance(bg);
          const contrast = contrastRatio(lumFg, lumBg);
          const diff = Math.abs(lumFg - lumBg);

          lumDiffSum += diff;
          sampled++;

          if (contrast < 4.5) results.lowContrastAreas++;
          if (fsize < 13) results.verySmallTextCount++;
          else if (fsize < 16) results.smallTextCount++;
        } catch (elError) {
          // Skip problematic elements but continue analysis
          continue;
        }
      }

      results.totalSampled = sampled;
      results.avgLuminanceDiff = sampled > 0 ? lumDiffSum / sampled : 0.5;

      // Check body background darkness
      try {
        const bodyBg = parseRGBA(window.getComputedStyle(document.body).backgroundColor);
        if (bodyBg) {
          results.darkBackground = relativeLuminance(bodyBg) < 0.18;
        }
      } catch (bgError) {
        // Use default if background detection fails
        results.darkBackground = false;
      }
    } catch (error) {
      console.error("[VisionAdapt] Page analysis error:", error);
    }

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

    // Handle edge case: insufficient sample data
    if (analysis.totalSampled < 5) {
      profile.aiReason = "Insufficient content to analyze — using default settings.";
      return profile;
    }

    const lowContrastRatio = analysis.totalSampled > 0
      ? analysis.lowContrastAreas / analysis.totalSampled
      : 0;

    const reasons = [];

    // Contrast issues - more nuanced thresholds
    if (lowContrastRatio > 0.40) {
      profile.contrastBoost = 35;
      reasons.push("significant low contrast on " + Math.round(lowContrastRatio * 100) + "% of text");
    } else if (lowContrastRatio > 0.25) {
      profile.contrastBoost = 25;
      reasons.push("low contrast on " + Math.round(lowContrastRatio * 100) + "% of text");
    } else if (lowContrastRatio > 0.15) {
      profile.contrastBoost = 15;
      reasons.push("moderate contrast issues detected");
    }

    // Dark background detection - adjust contrast strategy
    if (analysis.darkBackground && profile.contrastBoost > 0) {
      profile.contrastBoost = Math.min(profile.contrastBoost + 10, 50);
      reasons.push("dark background detected");
    }

    // Very small text - adjusted thresholds based on total sampled
    const smallTextRatio = analysis.verySmallTextCount / analysis.totalSampled;
    if (smallTextRatio > 0.30) {
      profile.fontSize = 115;
      profile.readableFont = true;
      reasons.push("very small text prevalent");
    } else if (analysis.verySmallTextCount > 10) {
      profile.fontSize = 110;
      profile.readableFont = true;
      reasons.push("very small text detected");
    } else if (analysis.smallTextCount > 15) {
      profile.fontSize = 105;
      reasons.push("small text detected");
    }

    // Dense text / poor spacing - improved detection
    const denseTextRatio = (analysis.smallTextCount + analysis.verySmallTextCount) / analysis.totalSampled;
    if (denseTextRatio > 0.50) {
      profile.lineHeight = 135;
      profile.highReadability = true;
      reasons.push("dense text layout");
    } else if (denseTextRatio > 0.35) {
      profile.lineHeight = 125;
      profile.highReadability = true;
      reasons.push("moderately dense text");
    } else if (analysis.smallTextCount + analysis.verySmallTextCount > 20) {
      profile.lineHeight = 120;
      reasons.push("some dense areas");
    }

    // Low average luminance difference - general readability issue
    if (analysis.avgLuminanceDiff < 0.30 && profile.contrastBoost === 0) {
      profile.contrastBoost = 10;
      reasons.push("low overall color contrast");
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

    // Apply filter only to body to avoid breaking layout
    const filterValue = filterParts.length ? filterParts.join(" ") : "none";
    if (filterValue !== "none") {
      parts.push(`html.${CLASS_ACTIVE} > body { filter: ${filterValue} !important; transition: filter 250ms ease !important; }`);
    }

    // Typography - more scoped to avoid breaking layout-critical elements
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
      // More selective typography - exclude layout-critical elements
      parts.push(`html.${CLASS_ACTIVE} body p, html.${CLASS_ACTIVE} body li, html.${CLASS_ACTIVE} body td, html.${CLASS_ACTIVE} body th, html.${CLASS_ACTIVE} body span:not([class*="icon"]), html.${CLASS_ACTIVE} body article, html.${CLASS_ACTIVE} body section { ${typoParts.join(" ")} }`);
    }

    // Links - more specific to avoid affecting buttons
    if (settings.linkUnderline !== false) {
      parts.push(`html.${CLASS_ACTIVE} body a[href]:not([role="button"]):not(.btn):not(button):not([type="button"]):not([type="submit"]) { text-decoration: underline !important; text-underline-offset: 2px !important; }`);
    }

    // Focus enhancement - preserve existing outline styles where possible
    if (settings.focusEnhance !== false) {
      parts.push(`html.${CLASS_ACTIVE} body :focus-visible { outline: 3px solid #f59e0b !important; outline-offset: 2px !important; }`);
    }

    // Invalid field highlight - more specific
    parts.push(`html.${CLASS_ACTIVE} body [aria-invalid="true"], html.${CLASS_ACTIVE} body input:invalid, html.${CLASS_ACTIVE} body textarea:invalid, html.${CLASS_ACTIVE} body select:invalid { border-color: #dc2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,0.2) !important; }`);

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

    // Setup mutation observer for dynamic content
    if (globalState?.polymorphAI) {
      setupMutationObserver();
    }
  }

  function removeSettings() {
    // Remove active class
    document.documentElement.classList.remove(CLASS_ACTIVE);

    // Clear injected styles
    const styleEl = document.getElementById(STYLE_ID);
    if (styleEl) {
      styleEl.textContent = "";
      styleEl.remove();
    }

    // Remove SVG filters
    const svgEl = document.getElementById(SVG_ID);
    if (svgEl) svgEl.remove();

    // Remove badge
    removeBadge();

    // Cleanup mutation observer
    cleanupMutationObserver();

    // Reset state
    currentSettings = null;
    globalState = null;
    analysisRan = false;

    console.log("[VisionAdapt] Settings removed and state cleaned up");
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
      padding: 8px 14px;
      border-radius: 20px;
      box-shadow: 0 4px 16px rgba(99,102,241,0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: opacity 0.3s ease, transform 0.2s ease;
      pointer-events: auto;
      letter-spacing: 0.01em;
      max-width: 300px;
    `;
    badge.innerHTML = `<span style="font-size:14px;">✦</span> <span>Polymorph AI</span> <span style="opacity:0.7; font-size:10px;">✕</span>`;
    badge.title = settings.aiReason || "VisionAdapt auto-applied accessibility settings. Click to dismiss.";

    // Make badge dismissible on click
    badge.addEventListener("click", () => {
      badge.style.opacity = "0";
      badge.style.transform = "scale(0.9)";
      setTimeout(() => badge.remove(), 300);
    });

    // Hover effect
    badge.addEventListener("mouseenter", () => {
      badge.style.transform = "scale(1.02)";
    });
    badge.addEventListener("mouseleave", () => {
      badge.style.transform = "scale(1)";
    });

    document.body.appendChild(badge);

    // Auto-hide after 8 seconds (increased from 4s for better visibility)
    const autoHideTimer = setTimeout(() => {
      if (badge.parentNode) {
        badge.style.opacity = "0";
        badge.style.transform = "scale(0.9)";
        setTimeout(() => badge.remove(), 300);
      }
    }, 8000);

    // Store timer on badge element so we can clear it if manually dismissed
    badge.dataset.timerId = autoHideTimer;
  }

  function showErrorBadge(message) {
    removeBadge();
    const badge = document.createElement("div");
    badge.id = BADGE_ID;
    badge.setAttribute("aria-label", "VisionAdapt error");
    badge.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 2147483647;
      background: linear-gradient(135deg, #dc2626, #ef4444);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 20px;
      box-shadow: 0 4px 16px rgba(220,38,38,0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: opacity 0.3s ease, transform 0.2s ease;
      pointer-events: auto;
      letter-spacing: 0.01em;
      max-width: 300px;
    `;
    badge.innerHTML = `<span style="font-size:14px;">⚠</span> <span>${message}</span> <span style="opacity:0.7; font-size:10px;">✕</span>`;
    badge.title = "Click to dismiss";

    badge.addEventListener("click", () => {
      badge.style.opacity = "0";
      badge.style.transform = "scale(0.9)";
      setTimeout(() => badge.remove(), 300);
    });

    document.body.appendChild(badge);

    // Auto-hide after 6 seconds for errors
    setTimeout(() => {
      if (badge.parentNode) {
        badge.style.opacity = "0";
        badge.style.transform = "scale(0.9)";
        setTimeout(() => badge.remove(), 300);
      }
    }, 6000);
  }

  function removeBadge() {
    const existing = document.getElementById(BADGE_ID);
    if (existing) {
      // Clear any pending auto-hide timer
      if (existing.dataset.timerId) {
        clearTimeout(parseInt(existing.dataset.timerId));
      }
      existing.remove();
    }
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
        globalState = global; // Store global state for MutationObserver

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
    // Wait for body to be available
    if (!document.body) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
      } else {
        // Body not available even after DOM loaded - retry with delay
        setTimeout(bootstrap, 100);
      }
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_STATE", hostname });
      if (!response) {
        console.warn("[VisionAdapt] No response from background script");
        return;
      }

      const { global, siteProfile } = response;
      globalState = global; // Store global state for MutationObserver

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
    } catch (error) {
      console.error("[VisionAdapt] Bootstrap error:", error);
    }
  }

  // Run bootstrap once DOM is ready with better detection
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else if (document.body) {
    // DOM already loaded and body exists
    bootstrap();
  } else {
    // DOM loaded but body not ready yet
    setTimeout(bootstrap, 50);
  }
})();
