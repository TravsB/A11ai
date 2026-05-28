// Reform Labs — A11y · Service Worker
const DEFAULTS = {
  enabled: false,
  mode: "none",                 // none | protanopia | deuteranopia | tritanopia | achromatopsia | low-contrast
  contrastBoost: 50,            // 0..100  (50 = neutral)
  fontSize: 100,                // %
  lineHeight: 100,              // %
  readableFont: false,
  highReadability: false,
  daltonize: false,
  linkEmphasis: true,
  // Reading Focus Ruler (new flagship feature)
  rulerEnabled: false,
  rulerHeight: 110,             // px band height
  rulerDim: 70,                 // 0..100 dim strength outside band
  // Adaptive
  adaptiveLearning: true,
  showRecommendations: true,
};
const KEY = "reformlabs_a11y_settings";

async function loadSettings() {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get(KEY, (r) => {
        if (chrome.runtime.lastError) return resolve({ ...DEFAULTS });
        const v = r[KEY];
        resolve(v && typeof v === "object" ? { ...DEFAULTS, ...v } : { ...DEFAULTS });
      });
    } catch {
      resolve({ ...DEFAULTS });
    }
  });
}

async function saveSettings(patch) {
  const cur = await loadSettings();
  const next = { ...cur, ...patch };
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [KEY]: next }, () => resolve(next));
  });
}

async function pushTo(tabId, settings) {
  try { await chrome.tabs.sendMessage(tabId, { type: "APPLY_SETTINGS", settings }); } catch {}
}

async function pushToActive(settings) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id != null) await pushTo(tab.id, settings);
}

chrome.runtime.onInstalled.addListener(async (e) => {
  console.log("[Reform Labs A11y] " + e.reason);
});

chrome.tabs.onUpdated.addListener(async (tabId, info) => {
  if (info.status !== "complete") return;
  const s = await loadSettings();
  if (s.enabled || s.rulerEnabled) await pushTo(tabId, s);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === "RELAY_TO_ACTIVE_TAB") {
      await pushToActive(msg.settings);
      sendResponse({ ok: true });
    }
  })();
  return true;
});

// Keyboard shortcuts
chrome.commands?.onCommand.addListener(async (command) => {
  const s = await loadSettings();
  if (command === "toggle-engine") {
    const next = await saveSettings({ enabled: !s.enabled });
    await pushToActive(next);
  } else if (command === "toggle-ruler") {
    const next = await saveSettings({ rulerEnabled: !s.rulerEnabled });
    await pushToActive(next);
  }
});
