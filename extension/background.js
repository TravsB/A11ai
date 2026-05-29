const a = {
  enabled: !1,
  mode: "none",
  contrastBoost: 50,
  fontSize: 100,
  lineHeight: 100,
  readableFont: !1,
  highReadability: !1,
  // Phase 3 defaults
  a11yMode: "none",
  heatmapEnabled: !1,
  adaptiveLearning: !0,
  showRecommendations: !0
}, o = "visionadapt_settings";
async function c() {
  return new Promise((e) => {
    try {
      chrome.storage.sync.get(o, (n) => {
        if (chrome.runtime.lastError) {
          e({ ...a });
          return;
        }
        const t = n[o];
        e(t && typeof t == "object" ? { ...a, ...t } : { ...a });
      });
    } catch {
      e({ ...a });
    }
  });
}
async function i(e, n) {
  try {
    await chrome.tabs.sendMessage(e, { type: "APPLY_SETTINGS", settings: n });
  } catch {
  }
}
chrome.runtime.onInstalled.addListener(async (e) => {
  e.reason === "install" && console.log("[VisionAdapt] Phase 3 — Installed"), e.reason === "update" && console.log("[VisionAdapt] Phase 3 — Updated");
});
chrome.tabs.onUpdated.addListener(async (e, n) => {
  if (n.status === "complete")
    try {
      const t = await c();
      t.enabled && await i(e, t);
    } catch {
    }
});
chrome.runtime.onMessage.addListener((e, n, t) => {
  if (e.type === "RELAY_TO_ACTIVE_TAB")
    return chrome.tabs.query({ active: !0, currentWindow: !0 }, async (r) => {
      const s = r[0];
      s?.id && await i(s.id, e.settings), t({ ok: !0 });
    }), !0;
});
