import { createFileRoute } from "@tanstack/react-router";

const ADAPTER_SCRIPT = `
<svg aria-hidden="true" width="0" height="0" style="position:absolute;width:0;height:0">
  <defs>
    <filter id="va-protanopia"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/></filter>
    <filter id="va-deuteranopia"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/></filter>
    <filter id="va-tritanopia"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/></filter>
    <filter id="va-achromatopsia"><feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"/></filter>
    <filter id="va-daltonize-protan"><feColorMatrix type="matrix" values="1 0 0 0 0  0.7 1 0 0 0  0.7 0 1 0 0  0 0 0 1 0"/></filter>
    <filter id="va-daltonize-deutan"><feColorMatrix type="matrix" values="1 0.7 0 0 0  0 1 0 0 0  0 0.7 1 0 0  0 0 0 1 0"/></filter>
    <filter id="va-daltonize-tritan"><feColorMatrix type="matrix" values="1 0 0.7 0 0  0 1 0.7 0 0  0 0 1 0 0  0 0 0 1 0"/></filter>
  </defs>
</svg>
<script>
(function(){
  var state = { mode:'normal', contrast:100, fontScale:100, link:false, dyslexia:false, daltonize:false };
  var styleEl = document.createElement('style');
  styleEl.id = '__va_style__';
  document.documentElement.appendChild(styleEl);

  function filterFor(mode, daltonize){
    if (daltonize && (mode==='protanopia'||mode==='deuteranopia'||mode==='tritanopia')) {
      return 'url(#va-daltonize-' + mode.replace('opia','') + ')';
    }
    if (mode === 'normal' || mode === 'low-contrast') return '';
    return 'url(#va-' + mode + ')';
  }

  function apply(){
    var f = filterFor(state.mode, state.daltonize);
    var contrastPart = state.contrast !== 100 ? ' contrast(' + state.contrast + '%)' : '';
    var brightnessPart = state.mode === 'low-contrast' ? ' brightness(1.05) contrast(140%)' : '';
    document.documentElement.style.filter = (f + contrastPart + brightnessPart).trim();

    var css = '';
    if (state.fontScale !== 100) {
      css += 'html{font-size:' + state.fontScale + '% !important;}';
    }
    if (state.link) {
      css += 'a, a *{text-decoration:underline !important; text-underline-offset:2px !important;}';
      css += 'a:focus, button:focus, [tabindex]:focus{outline:3px solid #f5b400 !important; outline-offset:2px !important;}';
    }
    if (state.dyslexia) {
      css += 'body, body *{font-family: "Atkinson Hyperlegible", "Verdana", system-ui, sans-serif !important; letter-spacing:0.02em !important; line-height:1.65 !important; word-spacing:0.08em !important;}';
    }
    styleEl.textContent = css;
  }

  // Enforce on dynamic DOM updates (SPA navigations, hydration)
  var mo = new MutationObserver(function(){
    if (!document.getElementById('__va_style__')) {
      document.documentElement.appendChild(styleEl);
    }
    apply();
  });
  function startObserver(){
    if (document.body) mo.observe(document.body, { childList:true, subtree:true });
    else setTimeout(startObserver, 50);
  }
  startObserver();

  window.addEventListener('message', function(e){
    if (!e.data || e.data.__va !== 'config') return;
    Object.assign(state, e.data.config || {});
    apply();
  });

  // Tell parent we're ready
  try { parent.postMessage({ __va:'ready', url: location.href }, '*'); } catch(_){}

  // Intercept clicks on links so they stay inside the proxy
  document.addEventListener('click', function(ev){
    var a = ev.target && ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;
    try {
      var abs = new URL(href, location.href).toString();
      ev.preventDefault();
      parent.postMessage({ __va:'navigate', url: abs }, '*');
    } catch(_){}
  }, true);

  apply();
})();
</script>
`;

function rewriteHtml(html: string, baseUrl: string): string {
  // Strip CSP and frame-busting meta tags
  html = html.replace(
    /<meta[^>]+http-equiv=["']?(Content-Security-Policy|X-Frame-Options)["']?[^>]*>/gi,
    ""
  );
  // Inject <base> so relative URLs resolve correctly
  const baseTag = `<base href="${baseUrl}">`;
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  } else {
    html = `<head>${baseTag}</head>` + html;
  }
  // Inject adapter script before </body>
  if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, ADAPTER_SCRIPT + "</body>");
  } else {
    html += ADAPTER_SCRIPT;
  }
  return html;
}

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Block SSRF to internal/cloud-metadata addresses.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal")) return true;
  if (h === "metadata.google.internal") return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = parseInt(m[1]);
    const b = parseInt(m[2]);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  if (h.includes(":")) {
    if (h === "::1" || h === "::") return true;
    if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
    if (h.startsWith("::ffff:")) return isBlockedHost(h.slice(7));
    return true;
  }
  return false;
}

export const Route = createFileRoute("/api/public/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url).searchParams.get("url");
        if (!url) return new Response("Missing url", { status: 400 });
        let target: URL;
        try {
          target = new URL(url);
        } catch {
          return new Response("Invalid url", { status: 400 });
        }
        if (target.protocol !== "http:" && target.protocol !== "https:") {
          return new Response("Unsupported protocol", { status: 400 });
        }
        if (isBlockedHost(target.hostname)) {
          return new Response("Blocked host", { status: 403 });
        }
        try {
          let currentUrl = target.toString();
          let upstream: Response | null = null;
          const maxHops = 5;
          for (let i = 0; i < maxHops; i++) {
            const hopUrl = new URL(currentUrl);
            if (hopUrl.protocol !== "http:" && hopUrl.protocol !== "https:") {
              return new Response("Unsupported protocol in redirect", { status: 400 });
            }
            if (isBlockedHost(hopUrl.hostname)) {
              return new Response("Blocked host in redirect", { status: 403 });
            }
            upstream = await fetch(currentUrl, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (compatible; A11aiStudio/1.0; +https://a11ai.app)",
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              },
              redirect: "manual",
            });
            if (upstream.status >= 300 && upstream.status < 400) {
              const loc = upstream.headers.get("location");
              if (!loc) break;
              currentUrl = new URL(loc, currentUrl).toString();
              continue;
            }
            break;
          }
          if (!upstream) {
            return new Response("Too many redirects", { status: 502 });
          }

          const ct = upstream.headers.get("content-type") || "";
          if (!ct.includes("text/html")) {
            return new Response(
              `<!doctype html><meta charset=utf-8><body style="font:14px system-ui;padding:24px;color:#334155">Cannot preview non-HTML resource (<code>${escHtml(ct || "unknown")}</code>).</body>`,
              { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
            );
          }
          const raw = await upstream.text();
          const baseUrl = upstream.url || target.toString();
          const html = rewriteHtml(raw, baseUrl);
          return new Response(html, {
            status: 200,
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "no-store",
              "x-frame-options": "SAMEORIGIN",
            },
          });
        } catch (err) {
          console.error("proxy fetch failed", err);
          const msg = err instanceof Error ? err.message : "Unknown error";
          return new Response(
            `<!doctype html><meta charset=utf-8><body style="font:14px system-ui;padding:24px;color:#b91c1c">Failed to load <strong>${escHtml(target.toString())}</strong><br><br>${escHtml(msg)}</body>`,
            { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
          );
        }
      },
    },
  },
});
