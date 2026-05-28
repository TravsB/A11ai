/* Reform Labs — A11y · Content Script
   - Color-vision filters (SVG feColorMatrix)
   - Contrast / typography / readability layer
   - Daltonization & link emphasis
   - Reading Focus Ruler (cursor-following band) — NEW
   - Contextual website classifier + suggested mode
*/
(function () {
  "use strict";

  const DEFAULTS = {
    enabled: false, mode: "none", contrastBoost: 50,
    fontSize: 100, lineHeight: 100,
    readableFont: false, highReadability: false,
    daltonize: false, linkEmphasis: true,
    rulerEnabled: false, rulerHeight: 110, rulerDim: 70,
    adaptiveLearning: true, showRecommendations: true,
  };
  const KEY = "reformlabs_a11y_settings";
  const CLS = "rla-active";
  const STYLE_ID = "rla-styles";
  const FILTERS_ID = "rla-filters";
  const RULER_ID = "rla-ruler";

  const FILTERS_SVG = `
<svg id="${FILTERS_ID}" xmlns="http://www.w3.org/2000/svg"
  style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none">
  <defs>
    <filter id="rla-protanopia" color-interpolation-filters="linearRGB">
      <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/>
    </filter>
    <filter id="rla-deuteranopia" color-interpolation-filters="linearRGB">
      <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/>
    </filter>
    <filter id="rla-tritanopia" color-interpolation-filters="linearRGB">
      <feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/>
    </filter>
    <filter id="rla-achromatopsia" color-interpolation-filters="linearRGB">
      <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"/>
    </filter>
    <filter id="rla-dalt-protan" color-interpolation-filters="linearRGB">
      <feColorMatrix type="matrix" values="1 0 0 0 0  0.7 1 0 0 0  0.7 0 1 0 0  0 0 0 1 0"/>
    </filter>
    <filter id="rla-dalt-deutan" color-interpolation-filters="linearRGB">
      <feColorMatrix type="matrix" values="1 0.7 0 0 0  0 1 0 0 0  0 0.7 1 0 0  0 0 0 1 0"/>
    </filter>
    <filter id="rla-dalt-tritan" color-interpolation-filters="linearRGB">
      <feColorMatrix type="matrix" values="1 0 0.7 0 0  0 1 0.7 0 0  0 0 1 0 0  0 0 0 1 0"/>
    </filter>
  </defs>
</svg>`;

  const FILTER_REF = {
    protanopia: "url(#rla-protanopia)",
    deuteranopia: "url(#rla-deuteranopia)",
    tritanopia: "url(#rla-tritanopia)",
    achromatopsia: "url(#rla-achromatopsia)",
  };
  const DALT_REF = {
    protanopia: "url(#rla-dalt-protan)",
    deuteranopia: "url(#rla-dalt-deutan)",
    tritanopia: "url(#rla-dalt-tritan)",
  };

  function buildFilter(s) {
    const parts = [];
    if (s.daltonize && DALT_REF[s.mode]) parts.push(DALT_REF[s.mode]);
    else if (FILTER_REF[s.mode]) parts.push(FILTER_REF[s.mode]);
    const c = 0.5 + s.contrastBoost / 100;
    if (Math.abs(c - 1) > 0.03) {
      parts.push(`contrast(${c.toFixed(2)})`);
      if (c > 1.05) parts.push(`brightness(${(1 + (c - 1) * 0.06).toFixed(3)})`);
    }
    if (s.mode === "low-contrast") parts.push("contrast(1.6) brightness(1.04)");
    return parts.length ? parts.join(" ") : "none";
  }

  function buildCss(s) {
    if (!s.enabled) return "";
    const filt = buildFilter(s);
    const font = s.readableFont
      ? `font-family:"Atkinson Hyperlegible","Inter",Verdana,system-ui,sans-serif!important;` : "";
    const fs = s.fontSize !== 100 ? `font-size:${s.fontSize}%!important;` : "";
    const lh = s.lineHeight !== 100 ? `line-height:${(s.lineHeight/100*1.55).toFixed(2)}!important;` : "";
    const tr = s.highReadability ? `letter-spacing:.02em!important;word-spacing:.08em!important;` : "";
    const linkRule = s.linkEmphasis
      ? `html.${CLS} a:not([role=button]):not(.btn){text-decoration:underline!important;text-underline-offset:2px!important;}`
      : "";
    return `
html.${CLS} body{filter:${filt}!important;transition:filter 240ms ease!important;}
${(font||fs||lh||tr) ? `html.${CLS} body, html.${CLS} p, html.${CLS} li, html.${CLS} td, html.${CLS} span, html.${CLS} h1, html.${CLS} h2, html.${CLS} h3, html.${CLS} h4{${font}${fs}${lh}${tr}}` : ""}
${linkRule}
html.${CLS} :focus-visible{outline:3px solid #b88a3e!important;outline-offset:2px!important;box-shadow:0 0 0 5px rgba(184,138,62,.22)!important;border-radius:3px!important;}
html.${CLS} [aria-invalid=true], html.${CLS} input:invalid, html.${CLS} select:invalid{
  border-color:#b85b5b!important;box-shadow:0 0 0 2px rgba(184,91,91,.22)!important;
}
${s.mode==="low-contrast" ? `
html.${CLS} body{background:#fff!important;}
html.${CLS} *{color:#0b1220!important;border-color:#334155!important;}
html.${CLS} a{color:#1d4ed8!important;}
html.${CLS} a:visited{color:#6b21a8!important;}
`:""}
`;
  }

  function ensureFilters() {
    if (document.getElementById(FILTERS_ID) || !document.body) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = FILTERS_SVG;
    document.body.insertBefore(wrap.firstElementChild, document.body.firstChild);
  }
  function writeStyle(css) {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = css;
  }
  function clearAll() {
    document.documentElement.classList.remove(CLS);
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(FILTERS_ID)?.remove();
    teardownRuler();
  }

  let rulerEl = null;
  let rulerY = window.innerHeight / 2;
  let rulerRAF = 0;

  function ensureRuler(s) {
    if (rulerEl) return;
    rulerEl = document.createElement("div");
    rulerEl.id = RULER_ID;
    rulerEl.setAttribute("aria-hidden", "true");
    Object.assign(rulerEl.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "2147483646",
      transition: "background 120ms linear",
      mixBlendMode: "normal",
    });
    document.documentElement.appendChild(rulerEl);
    updateRuler(s);
    window.addEventListener("mousemove", onRulerMove, { passive: true });
    window.addEventListener("scroll", scheduleRuler, { passive: true });
    window.addEventListener("resize", scheduleRuler, { passive: true });
  }
  function teardownRuler() {
    if (!rulerEl) return;
    window.removeEventListener("mousemove", onRulerMove);
    window.removeEventListener("scroll", scheduleRuler);
    window.removeEventListener("resize", scheduleRuler);
    rulerEl.remove();
    rulerEl = null;
  }
  function onRulerMove(e) {
    rulerY = e.clientY;
    scheduleRuler();
  }
  function scheduleRuler() {
    if (rulerRAF) return;
    rulerRAF = requestAnimationFrame(() => {
      rulerRAF = 0;
      updateRuler(state);
    });
  }
  function updateRuler(s) {
    if (!rulerEl) return;
    const h = Math.max(40, Math.min(400, s.rulerHeight || 110));
    const dim = Math.max(0, Math.min(95, s.rulerDim ?? 70)) / 100;
    const top = Math.max(0, rulerY - h / 2);
    const bot = top + h;
    const a = dim.toFixed(2);
    rulerEl.style.background =
      `linear-gradient(to bottom,
        rgba(11,18,32,${a}) 0,
        rgba(11,18,32,${a}) ${top}px,
        rgba(11,18,32,0) ${top}px,
        rgba(11,18,32,0) ${bot}px,
        rgba(11,18,32,${a}) ${bot}px,
        rgba(11,18,32,${a}) 100%)`;
    rulerEl.style.boxShadow = `inset 0 0 0 9999px transparent`;
  }

  let state = { ...DEFAULTS };
  function apply(next) {
    state = next;
    if (next.enabled) {
      document.documentElement.classList.add(CLS);
      ensureFilters();
    } else {
      document.documentElement.classList.remove(CLS);
    }
    writeStyle(buildCss(next));
    if (next.rulerEnabled) { ensureRuler(next); updateRuler(next); }
    else { teardownRuler(); }
  }

  function classify() {
    const host = location.hostname.toLowerCase();
    const title = document.title.toLowerCase();
    const hasCharts = !!document.querySelector("canvas,[class*='chart'],[class*='graph'],[class*='recharts'],[class*='d3']");
    const hasCode = !!document.querySelector("code,pre,[class*='hljs'],[class*='prism']");
    const hasForms = !!document.querySelector("form,input[type=text],input[type=email]");
    const hasNav = !!document.querySelector("nav,[role=navigation]");
    let type = "general", confidence = 0.6;
    if (hasCharts || /dashboard|analytic|metric/.test(title)) { type = "dashboard"; confidence = .85; }
    else if (hasCode || /github|gitlab|stackoverflow/.test(host)) { type = "development"; confidence = .9; }
    else if (/amazon|ebay|shopify|etsy/.test(host) || /cart|store|shop/.test(title)) { type = "ecommerce"; confidence = .85; }
    else if (host.endsWith(".edu") || /coursera|udemy|khan/.test(host)) { type = "education"; confidence = .8; }
    else if (document.querySelectorAll("article,[class*='post']").length > 2 || /medium|substack|blog/.test(host)) { type = "reading"; confidence = .8; }
    const text = document.querySelectorAll("p,li,td").length;
    return { type, confidence, domain: location.hostname, hasCharts, hasCode, hasForms, hasNavigation: hasNav,
      elementCount: document.querySelectorAll("*").length, textDensity: Math.min(1, text/80) };
  }
  function suggestMode(ctx) {
    if (ctx.hasCode) return "none";
    if (ctx.type === "dashboard") return "deuteranopia";
    if (ctx.type === "reading" || ctx.type === "ecommerce") return "low-contrast";
    return "none";
  }
  function suggestRuler(ctx) {
    return ctx.type === "reading" || ctx.textDensity > 0.5;
  }

  chrome.runtime.onMessage.addListener((msg, _s, send) => {
    try {
      switch (msg.type) {
        case "APPLY_SETTINGS": apply(msg.settings); send({ ok: true }); break;
        case "RESET_SETTINGS": clearAll(); state = { ...DEFAULTS }; send({ ok: true }); break;
        case "GET_STATUS":     send({ ok: true, active: state.enabled, mode: state.mode, ruler: state.rulerEnabled }); break;
        case "GET_WEBSITE_CONTEXT": {
          const ctx = classify();
          send({ ok: true, context: ctx, suggestedMode: suggestMode(ctx), suggestRuler: suggestRuler(ctx) });
          break;
        }
        default: send({ ok: true });
      }
    } catch { send({ ok: false }); }
    return true;
  });

  try {
    chrome.storage.onChanged.addListener((changes) => {
      if (KEY in changes) {
        const v = changes[KEY].newValue;
        if (v) apply({ ...DEFAULTS, ...v });
      }
    });
  } catch { }

  const mo = new MutationObserver(() => {
    if (state.enabled && !document.getElementById(FILTERS_ID)) ensureFilters();
    if (state.rulerEnabled && !document.getElementById(RULER_ID)) { ensureRuler(state); updateRuler(state); }
  });

  async function boot() {
    try {
      const r = await new Promise((res) => chrome.storage.sync.get(KEY, res));
      const s = r?.[KEY] ? { ...DEFAULTS, ...r[KEY] } : { ...DEFAULTS };
      apply(s);
      if (document.body) mo.observe(document.body, { childList: true, subtree: false });
    } catch { }
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
