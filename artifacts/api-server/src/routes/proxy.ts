import { Router } from "express";
import { logger } from "../lib/logger";

import { validateScanUrl } from "../lib/url-validator";

const router = Router();

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

    // Apply combined filter (mode filter + contrast)
    var filters = [modeFilter, contrastFilter].filter(Boolean).join(' ');
    try{ root.style.filter = filters; }catch(e){}

    // Font scaling
    if(cfg.fontScale && Number(cfg.fontScale) !== 100){
      try{ root.style.fontSize = Number(cfg.fontScale) + '%'; }catch(e){}
    } else {
      try{ root.style.fontSize = ''; }catch(e){}
    }

    // Dyslexia font — inject a more robust readable style (increase letter spacing, line-height, and weight)
    var DY_STYLE_ID = '__a11ai_dyslexia';
    if(cfg.dyslexia){
      if(!document.getElementById(DY_STYLE_ID)){
        var s = document.createElement('style'); s.id = DY_STYLE_ID;
        s.textContent = '\n          html, body, * { \n            font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important; \n            font-weight: 600 !important; \n            letter-spacing: 0.02em !important; \n            word-spacing: 0.03em !important; \n            line-height: 1.5 !important; \n            -webkit-font-smoothing: antialiased !important; \n            text-rendering: optimizeLegibility !important; \n          }\n        ';
        document.head.appendChild(s);
      }
    } else {
      var sv = document.getElementById(DY_STYLE_ID); if(sv) sv.remove();
    }

    // Link highlighting
    if(cfg.link){
      if(!document.getElementById('__va_links')){
        var s2 = document.createElement('style');
        s2.id = '__va_links';
        s2.textContent = 'a{text-decoration:underline!important;outline:2px solid currentColor!important;}';
        document.head.appendChild(s2);
      }
    } else {
      var s3 = document.getElementById('__va_links'); if(s3) s3.remove();
    }

  });
})();`;

      $("head").append(`<script>${script}</script>`);
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
