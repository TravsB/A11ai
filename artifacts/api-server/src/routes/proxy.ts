import { Router } from "express";
import { logger } from "../lib/logger";

import { validateScanUrl } from "../lib/url-validator";

const router = Router();

// Serve the preview client script as an external file. This avoids relying on
// inline scripts, which some sites' CSP or inline restrictions will block.
// Serving the logic from our origin makes it more likely the browser will load
// and execute it inside the preview iframe.
router.get('/__a11ai_preview.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  const js = `(function(){
  function ensureFilters(){
    if(document.getElementById('__a11ai_filters')) return;
    try{
      var svg = document.createElement('svg');
      svg.setAttribute('aria-hidden','true');
      svg.setAttribute('focusable','false');
      svg.style.position='absolute'; svg.style.width='0'; svg.style.height='0'; svg.id='__a11ai_filters';
      svg.innerHTML = '\n      <defs>\n        <filter id="a11ai-filter-protanopia">\n          <feColorMatrix type="matrix" values="0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0"/>\n        </filter>\n        <filter id="a11ai-filter-deuteranopia">\n          <feColorMatrix type="matrix" values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0"/>\n        </filter>\n        <filter id="a11ai-filter-tritanopia">\n          <feColorMatrix type="matrix" values="0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0"/>\n        </filter>\n      </defs>';
      document.head.appendChild(svg);
    }catch(e){}
  }

  function applyConfig(cfg){
    try{
      var root = document.documentElement;
      var mode = (cfg && (cfg.mode || cfg.visionMode)) || 'normal';
      var modeFilter = '';
      if(mode && mode !== 'normal' && mode !== 'none'){
        ensureFilters();
        if(mode === 'achromatopsia'){
          modeFilter = 'grayscale(100%)';
        } else if(mode === 'low-contrast' || mode === 'lowvision'){
          modeFilter = 'contrast(150%) brightness(1.05)';
        } else {
          var safeMode = (mode||'').toString().replace(/[^a-z-]/gi, '');
          modeFilter = 'url(#a11ai-filter-' + safeMode + ')';
        }
      }
      var contrastFilter = '';
      if(cfg && cfg.contrast && Number(cfg.contrast) !== 100){
        contrastFilter = 'contrast(' + (Number(cfg.contrast)/100) + ')';
      }
      var filters = [modeFilter, contrastFilter].filter(Boolean).join(' ');
      var STYLE_ID = '__a11ai_styles';
      var css = '';
      if(filters) css += 'html, body { filter: ' + filters + ' !important; }\\n';
      else css += 'html, body { filter: none !important; }\\n';
      if(cfg && cfg.fontScale && Number(cfg.fontScale) !== 100) css += 'html { font-size: ' + Number(cfg.fontScale) + '% !important; }\\n';
      else css += 'html { font-size: initial !important; }\\n';
      var styleEl = document.getElementById(STYLE_ID);
      if(!styleEl){ styleEl = document.createElement('style'); styleEl.id = STYLE_ID; document.head.appendChild(styleEl); }
      styleEl.textContent = css;

      var DY_STYLE_ID = '__a11ai_dyslexia';
      if(cfg && cfg.dyslexia){
        if(!document.getElementById(DY_STYLE_ID)){
          try{
            if(!document.querySelector('link[href*="open-dyslexic"]')){
              var l = document.createElement('link'); l.rel='stylesheet'; l.href='https://cdn.jsdelivr.net/gh/antijingoist/open-dyslexic@master/open-dyslexic.css'; document.head.appendChild(l);
            }
          }catch(e){}
          var s = document.createElement('style'); s.id = DY_STYLE_ID;
          s.textContent = '\nhtml, body, * { font-family: "OpenDyslexic", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif !important; font-weight: 600 !important; letter-spacing: 0.02em !important; word-spacing: 0.03em !important; line-height: 1.5 !important; -webkit-font-smoothing: antialiased !important; text-rendering: optimizeLegibility !important; }\n';
          document.head.appendChild(s);
        }
      } else { var sv = document.getElementById(DY_STYLE_ID); if(sv) sv.remove(); }

      // link highlighting
      if(cfg && cfg.link){ if(!document.getElementById('__va_links')){ var s2 = document.createElement('style'); s2.id='__va_links'; s2.textContent='a{text-decoration:underline!important;outline:2px solid currentColor!important;}'; document.head.appendChild(s2); } }
      else { var s3 = document.getElementById('__va_links'); if(s3) s3.remove(); }

      try{ document.documentElement.dataset.a11aiConfig = JSON.stringify(cfg||{}); }catch(e){}
    }catch(e){}
  }

  // Run once at load in case parent posts before handler
  try{ window.addEventListener('message', function(e){ if(e && e.data && e.data.__va === 'config'){ applyConfig(e.data.config || {}); } }); }catch(e){}
  // Post ready to parent
  try{ window.parent.postMessage({ __va: 'ready' }, '*'); }catch(e){}

  // Observe mutations and re-apply filters/styles if head/body is replaced
  try{
    var mo = new MutationObserver(function(m){
      var reapply = false;
      for(var i=0;i<m.length;i++){ var t=m[i].target; if(t && (t.nodeName==='HEAD' || t.nodeName==='BODY' || t.nodeName==='HTML')){ reapply = true; break; } }
      if(reapply){ var cfg = null; try{ cfg = JSON.parse(document.documentElement.dataset.a11aiConfig || '{}'); }catch(e){}; applyConfig(cfg); }
    });
    mo.observe(document.documentElement || document, { childList: true, subtree: true });
  }catch(e){}
})();`;
  res.send(js);
});

router.get("/public/proxy", async (req, res) => {
  logger.info({ headers: req.headers, cookies: req.cookies }, 'Proxy request received');
  const rawUrl = req.query["url"];
  const validated = validateScanUrl(rawUrl as string);
  if (!validated.valid || !validated.url) {
    res.status(400).json({ error: validated.error ?? "Invalid URL" });
    return;
  }
  const url = validated.url;

  try {
    const upstream = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; A11ai/3.0)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    const contentType = upstream.headers.get("content-type") ?? "";

    if (!contentType.includes("text/html")) {
      const buf = await upstream.arrayBuffer();
      res.status(upstream.status);
      res.setHeader("Content-Type", contentType || "application/octet-stream");
      res.send(Buffer.from(buf));
      return;
    }

    let html = await upstream.text();
    const base = url.toString();

    // Strip upstream CSP / frame blockers so the injected accessibility script can
    // actually run inside the preview iframe. Many sites include strict CSP or
    // X-Frame-Options policies that prevent our inline script from executing.
    html = html.replace(/<meta\s+[^>]*http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*http-equiv\s*=\s*["']?x-frame-options["']?[^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*http-equiv\s*=\s*["']?permissions-policy["']?[^>]*>/gi, "");

    // Use cheerio to safely inject base and the preview script into <head>
    try {
      const cheerio = await import("cheerio");
      const $ = cheerio.load(html);

      // ensure <head> exists
      if ($("head").length === 0) {
        $("html").prepend("<head></head>");
      }

      // insert base element (so relative URLs resolve)
      $("head").prepend(`<base href="${base}">`);

      const script = `(function(){
  function ensureFilters(){
    if(document.getElementById('__a11ai_filters')) return;
    var svg = document.createElement('svg');
    svg.setAttribute('aria-hidden','true');
    svg.setAttribute('focusable','false');
    svg.style.position='absolute'; svg.style.width='0'; svg.style.height='0'; svg.id='__a11ai_filters';
    svg.innerHTML = '\n      <defs>\n        <filter id="a11ai-filter-protanopia">\n          <feColorMatrix type="matrix" values="0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0"/>\n        </filter>\n        <filter id="a11ai-filter-deuteranopia">\n          <feColorMatrix type="matrix" values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0"/>\n        </filter>\n        <filter id="a11ai-filter-tritanopia">\n          <feColorMatrix type="matrix" values="0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0"/>\n        </filter>\n      </defs>';
    document.head.appendChild(svg);
  }

  window.addEventListener("DOMContentLoaded",function(){
    try{ window.parent.postMessage({__va:"ready"},"*"); }catch(e){}
  });

  window.addEventListener("message",function(e){
    if(!e.data || e.data.__va !== "config") return;
    var cfg = e.data.config || {};
    var root = document.documentElement;

    // Handle vision mode filters
    var mode = (cfg.mode || cfg.visionMode || 'normal').toString();
    var modeFilter = '';
    if(mode && mode !== 'normal' && mode !== 'none'){
      ensureFilters();
      if(mode === 'achromatopsia'){
        modeFilter = 'grayscale(100%)';
      } else if(mode === 'low-contrast' || mode === 'lowvision'){
        modeFilter = 'contrast(150%) brightness(1.05)';
      } else {
        // protanopia, deuteranopia, tritanopia -> use svg filter URL
        // defensively sanitize mode to alpha characters to avoid injection
        var safeMode = mode.replace(/[^a-z-]/gi, '');
        modeFilter = 'url(#a11ai-filter-' + safeMode + ')';
      }
    }

    // Contrast
    var contrastFilter = '';
    if(cfg.contrast && Number(cfg.contrast) !== 100){
      // use numeric multiplier (1.1 == 110%) — keep consistent with client
      contrastFilter = 'contrast(' + (Number(cfg.contrast)/100) + ')';
    }

    // Apply combined filter (mode filter + contrast) and font-size using a dedicated stylesheet
    var STYLE_ID = '__a11ai_styles';
    var cssRules = '';
    if (filters) {
      cssRules += 'html, body { filter: ' + filters + ' !important; }\n';
    } else {
      cssRules += 'html, body { filter: none !important; }\n';
    }

    if (cfg.fontScale && Number(cfg.fontScale) !== 100) {
      cssRules += 'html { font-size: ' + Number(cfg.fontScale) + '% !important; }\n';
    } else {
      cssRules += 'html { font-size: initial !important; }\n';
    }

    var styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = cssRules;

    // Dyslexia font — apply stronger typographic adjustments and attempt to load OpenDyslexic
    var DY_STYLE_ID = '__a11ai_dyslexia';
    if (cfg.dyslexia) {
      if (!document.getElementById(DY_STYLE_ID)) {
        // Try to inject OpenDyslexic from a CDN; if it fails the CSS will fall back
        try {
          if (!document.querySelector('link[href*="open-dyslexic"]')) {
            var l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = 'https://cdn.jsdelivr.net/gh/antijingoist/open-dyslexic@master/open-dyslexic.css';
            document.head.appendChild(l);
          }
        } catch (e) {}

        var s = document.createElement('style');
        s.id = DY_STYLE_ID;
        s.textContent = '\n          html, body, * { \n            font-family: "OpenDyslexic", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important; \n            font-weight: 600 !important; \n            letter-spacing: 0.02em !important; \n            word-spacing: 0.03em !important; \n            line-height: 1.5 !important; \n            -webkit-font-smoothing: antialiased !important; \n            text-rendering: optimizeLegibility !important; \n          }\n        ';
        document.head.appendChild(s);
      }
    } else {
      var sv = document.getElementById(DY_STYLE_ID);
      if (sv) sv.remove();
    }

    // Link highlighting
    if (cfg.link) {
      if (!document.getElementById('__va_links')) {
        var s2 = document.createElement('style');
        s2.id = '__va_links';
        s2.textContent = 'a{text-decoration:underline!important;outline:2px solid currentColor!important;}';
        document.head.appendChild(s2);
      }
    } else {
      var s3 = document.getElementById('__va_links');
      if (s3) s3.remove();
    }

    // Expose last-received config for debugging / verification
    try { document.documentElement.dataset.a11aiConfig = JSON.stringify(cfg); } catch (e) {}

  });
})();`;

      $("head").append(`<script src="/__a11ai_preview.js" defer></script>`);
      html = $.html();
    } catch (e) {
      // If cheerio injection fails for any reason, fall back to the original regex-based insertion
      html = html.replace(/<head([^>]*)>/i, (m) => {
        return `${m}<base href="${base}"><script>(/* Preview script injection failed to use cheerio */)</script>`;
      });
    }

    res.removeHeader("Content-Security-Policy");
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.send(html);
  } catch (err) {
    logger.warn({ err, url: url.toString() }, "Proxy fetch failed");
    res.status(502)
      .send(`<!DOCTYPE html><html><head><base href="${url.toString()}">
<script>window.parent.postMessage({__va:"ready"},"*");</script>
</head><body style="font-family:system-ui;padding:2rem;color:#374151">
<h2 style="margin:0 0 .5rem">Could not load page</h2>
<p style="color:#6b7280;margin:0">The server could not fetch <code>${url.toString()}</code>.<br>
Some sites block cross-origin proxy requests. Try a different URL.</p>
</body></html>`);
  }
});

export default router;
