/**
 * VisionAdapt — Polymorph AI Background Service Worker
 * Manages settings, per-site profiles, and tab communication.
 */

const STORAGE_KEY = "visionadapt_v4";
const SITE_PROFILES_KEY = "visionadapt_site_profiles";

const DEFAULT_GLOBAL = {
  enabled: true,
  polymorphAI: true,       // auto-analyze and apply best settings
  globalOverride: false,   // if true, use globalSettings on all sites
  globalSettings: {
    mode: "none",
    contrastBoost: 0,
    fontSize: 100,
    lineHeight: 100,
    readableFont: false,
    highReadability: false,
    focusEnhance: true,
    linkUnderline: true,
  }
};

async function getGlobal() {
  return new Promise(resolve => {
    chrome.storage.sync.get(STORAGE_KEY, data => {
      const stored = data[STORAGE_KEY];
      resolve(stored && typeof stored === "object" ? { ...DEFAULT_GLOBAL, ...stored } : { ...DEFAULT_GLOBAL });
    });
  });
}

async function setGlobal(settings) {
  return new Promise(resolve => {
    chrome.storage.sync.set({ [STORAGE_KEY]: settings }, resolve);
  });
}

async function getSiteProfiles() {
  return new Promise(resolve => {
    chrome.storage.sync.get(SITE_PROFILES_KEY, data => {
      resolve(data[SITE_PROFILES_KEY] || {});
    });
  });
}

async function setSiteProfile(hostname, profile) {
  const profiles = await getSiteProfiles();
  profiles[hostname] = profile;
  return new Promise(resolve => {
    chrome.storage.sync.set({ [SITE_PROFILES_KEY]: profiles }, resolve);
  });
}

async function getSiteProfile(hostname) {
  const profiles = await getSiteProfiles();
  return profiles[hostname] || null;
}

async function sendToTab(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (_) {}
}

async function applyToTab(tabId, url) {
  const global = await getGlobal();
  if (!global.enabled) {
    await sendToTab(tabId, { type: "DISABLE" });
    return;
  }

  let hostname = "";
  try { hostname = new URL(url).hostname; } catch (_) {}

  const siteProfile = hostname ? await getSiteProfile(hostname) : null;

  await sendToTab(tabId, {
    type: "APPLY",
    global,
    siteProfile,
    hostname
  });
}

// Apply settings when a tab finishes loading
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    await applyToTab(tabId, tab.url);
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === "GET_STATE") {
      const global = await getGlobal();
      const hostname = message.hostname || "";
      const siteProfile = hostname ? await getSiteProfile(hostname) : null;
      sendResponse({ global, siteProfile });
    }

    else if (message.type === "SET_GLOBAL") {
      await setGlobal(message.settings);
      // Re-apply to active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url) await applyToTab(tab.id, tab.url);
      sendResponse({ ok: true });
    }

    else if (message.type === "SAVE_SITE_PROFILE") {
      await setSiteProfile(message.hostname, message.profile);
      sendResponse({ ok: true });
    }

    else if (message.type === "CLEAR_SITE_PROFILE") {
      const profiles = await getSiteProfiles();
      delete profiles[message.hostname];
      await new Promise(r => chrome.storage.sync.set({ [SITE_PROFILES_KEY]: profiles }, r));
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url) await applyToTab(tab.id, tab.url);
      sendResponse({ ok: true });
    }

    else if (message.type === "AI_ANALYSIS_DONE") {
      // Content script completed analysis — save the recommended profile
      if (message.hostname && message.profile) {
        await setSiteProfile(message.hostname, message.profile);
      }
      sendResponse({ ok: true });
    }

    else if (message.type === "RELAY_TO_TAB") {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) await sendToTab(tab.id, message.payload);
      sendResponse({ ok: true });
    }
  })();
  return true; // keep channel open for async
});
