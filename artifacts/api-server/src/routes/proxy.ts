import { Router } from "express";
import { logger } from "../lib/logger";

import { validateScanUrl } from "../lib/url-validator";

const router = Router();

router.get("/public/proxy", async (req, res) => {
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

    html = html.replace(/<head([^>]*)>/i, (m) => {
      return `${m}<base href="${base}"><script>
(function(){
  window.addEventListener("DOMContentLoaded",function(){
    window.parent.postMessage({__va:"ready"},"*");
  });
  window.addEventListener("message",function(e){
    if(!e.data||e.data.__va!=="config")return;
    var cfg=e.data.config||{};
    var root=document.documentElement;
    if(cfg.contrast){root.style.filter="contrast("+cfg.contrast/100+")";}
    if(cfg.fontScale&&cfg.fontScale!==100){root.style.fontSize=cfg.fontScale+"%";}
    if(cfg.dyslexia){root.style.fontFamily="Arial,sans-serif";}
    if(cfg.link){
      var s=document.createElement("style");
      s.id="__va_links";
      s.textContent="a{text-decoration:underline!important;outline:2px solid currentColor!important;}";
      document.head.appendChild(s);
    }
  });
})();
</script>`;
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "");
    res.send(html);
  } catch (err) {
    logger.warn({ err, url: url.toString() }, "Proxy fetch failed");
    res.status(502).send(`<!DOCTYPE html><html><head><base href="${url.toString()}">
<script>window.parent.postMessage({__va:"ready"},"*");</script>
</head><body style="font-family:system-ui;padding:2rem;color:#374151">
<h2 style="margin:0 0 .5rem">Could not load page</h2>
<p style="color:#6b7280;margin:0">The server could not fetch <code>${url.toString()}</code>.<br>
Some sites block cross-origin proxy requests. Try a different URL.</p>
</body></html>`);
  }
});

export default router;
