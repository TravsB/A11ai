/**
 * VisionAdapt — Polymorph AI Background Service Worker
 * Manages settings, per-site profiles, tab communication, and web sync.
 */

const STORAGE_KEY = "visionadapt_v4";
const SITE_PROFILES_KEY = "visionadapt_site_profiles";
const ACCOUNT_KEY = "visionadapt_account";
const VERSION_KEY = "visionadapt_version";

const EXTENSION_VERSION = "4.1.0";

const SUPABASE_URL = "https://ubvjpvprtfqwxxfyvymj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVidmpwdnBydGZxd3h4Znl2eW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNTcwMjEsImV4cCI6MjA5NTYzMzAyMX0.GXe42WVP1ruvBY6WIQ_fGcXhjo1I28MUC0pDYYQyQRs";

const DEFAULT_GLOBAL = {
  enabled: true,
  polymorphAI: true,
  globalOverride: false,
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

// ── Local storage helpers ─────────────────────────────────────────────────────
function lget(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (data) => {
      if (chrome.runtime.lastError) {
        console.error("[VisionAdapt] Storage get error:", chrome.runtime.lastError);
        resolve(undefined);
      } else {
        resolve(data[key]);
      }
    });
  });
}
function lset(key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        console.error("[VisionAdapt] Storage set error:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

async function getGlobal() {
  const stored = await lget(STORAGE_KEY);
  return stored && typeof stored === "object" ? { ...DEFAULT_GLOBAL, ...stored } : { ...DEFAULT_GLOBAL };
}
async function setGlobal(settings) { return lset(STORAGE_KEY, settings); }

async function getSiteProfiles() { return (await lget(SITE_PROFILES_KEY)) || {}; }
async function setSiteProfile(hostname, profile) {
  const profiles = await getSiteProfiles();
  profiles[hostname] = profile;
  return lset(SITE_PROFILES_KEY, profiles);
}
async function getSiteProfile(hostname) { return (await getSiteProfiles())[hostname] || null; }

async function getAccount() { return (await lget(ACCOUNT_KEY)) || null; }
async function setAccount(account) { return lset(ACCOUNT_KEY, account); }
async function clearAccount() { return lset(ACCOUNT_KEY, null); }

// ── Version management ─────────────────────────────────────────────────────────
async function getCurrentVersion() {
  return (await lget(VERSION_KEY)) || null;
}

async function setCurrentVersion(version) {
  return lset(VERSION_KEY, version);
}

async function checkAndMigrate() {
  const currentVersion = await getCurrentVersion();
  if (!currentVersion) {
    // First install or very old version
    console.log("[VisionAdapt] First install or migration from pre-version tracking");
    await setCurrentVersion(EXTENSION_VERSION);
    return;
  }

  if (currentVersion === EXTENSION_VERSION) {
    // Already on current version
    return;
  }

  console.log(`[VisionAdapt] Migrating from ${currentVersion} to ${EXTENSION_VERSION}`);

  // Add version-specific migrations here
  // Example: if (currentVersion < "4.1.0") { /* migration logic */ }

  await setCurrentVersion(EXTENSION_VERSION);
  console.log("[VisionAdapt] Migration complete");
}

// ── Supabase REST sync ────────────────────────────────────────────────────────
async function sbFetch(path, options = {}) {
  const acct = await getAccount();
  if (!acct?.access_token) throw new Error("Not linked");
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${acct.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  if (res.status === 401 && acct.refresh_token) {
    // Try refresh once
    const refreshed = await refreshSession(acct.refresh_token);
    if (refreshed) {
      return fetch(`${SUPABASE_URL}${path}`, {
        ...options,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${refreshed.access_token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          ...(options.headers || {}),
        },
      });
    }
  }
  return res;
}

async function refreshSession(refresh_token) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const acct = await getAccount();
    const updated = {
      ...acct,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
    await setAccount(updated);
    return updated;
  } catch (_) {
    return null;
  }
}

function profileToRow(hostname, p, user_id) {
  return {
    user_id,
    hostname,
    mode: p.mode ?? "none",
    contrast_boost: p.contrastBoost ?? 0,
    font_size: p.fontSize ?? 100,
    line_height: p.lineHeight ?? 100,
    readable_font: !!p.readableFont,
    high_readability: !!p.highReadability,
    focus_enhance: p.focusEnhance !== false,
    link_underline: p.linkUnderline !== false,
    ai_generated: !!p.aiGenerated,
    ai_reason: p.aiReason ?? null,
  };
}

function rowToProfile(r) {
  return {
    mode: r.mode,
    contrastBoost: r.contrast_boost,
    fontSize: r.font_size,
    lineHeight: r.line_height,
    readableFont: r.readable_font,
    highReadability: r.high_readability,
    focusEnhance: r.focus_enhance,
    linkUnderline: r.link_underline,
    aiGenerated: r.ai_generated,
    aiReason: r.ai_reason ?? undefined,
  };
}

async function pushSiteProfile(hostname, profile) {
  const acct = await getAccount();
  if (!acct?.user_id) {
    console.warn("[VisionAdapt] Cannot push site profile: no account");
    return;
  }
  try {
    const res = await sbFetch("/rest/v1/extension_site_profiles?on_conflict=user_id,hostname", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(profileToRow(hostname, profile, acct.user_id)),
    });
    if (!res.ok) {
      console.warn("[VisionAdapt] Push site profile failed with status:", res.status);
    }
  } catch (e) {
    console.error("[VisionAdapt] Push site profile error:", e);
  }
}

async function deleteRemoteSiteProfile(hostname) {
  const acct = await getAccount();
  if (!acct?.user_id) {
    console.warn("[VisionAdapt] Cannot delete site profile: no account");
    return;
  }
  try {
    const res = await sbFetch(`/rest/v1/extension_site_profiles?hostname=eq.${encodeURIComponent(hostname)}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 404) {
      console.warn("[VisionAdapt] Delete site profile failed with status:", res.status);
    }
  } catch (e) {
    console.error("[VisionAdapt] Delete site profile error:", e);
  }
}

async function pushGlobal(global) {
  const acct = await getAccount();
  if (!acct?.user_id) {
    console.warn("[VisionAdapt] Cannot push global settings: no account");
    return;
  }
  try {
    const res = await sbFetch("/rest/v1/extension_global_settings?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: acct.user_id,
        enabled: global.enabled,
        polymorph_ai: global.polymorphAI,
        global_override: global.globalOverride,
        global_settings: global.globalSettings,
      }),
    });
    if (!res.ok) {
      console.warn("[VisionAdapt] Push global settings failed with status:", res.status);
    }
  } catch (e) {
    console.error("[VisionAdapt] Push global settings error:", e);
  }
}

async function pullAll() {
  const acct = await getAccount();
  if (!acct?.user_id) {
    console.warn("[VisionAdapt] Cannot pull settings: no account");
    return;
  }
  try {
    // Pull global
    const gRes = await sbFetch("/rest/v1/extension_global_settings?select=*");
    if (gRes.ok) {
      try {
        const rows = await gRes.json();
        if (rows[0]) {
          const r = rows[0];
          await setGlobal({
            enabled: r.enabled,
            polymorphAI: r.polymorph_ai,
            globalOverride: r.global_override,
            globalSettings: { ...DEFAULT_GLOBAL.globalSettings, ...(r.global_settings || {}) },
          });
        }
      } catch (parseError) {
        console.error("[VisionAdapt] Failed to parse global settings:", parseError);
      }
    } else {
      console.warn("[VisionAdapt] Pull global settings failed with status:", gRes.status);
    }
    // Pull site profiles
    const pRes = await sbFetch("/rest/v1/extension_site_profiles?select=*");
    if (pRes.ok) {
      try {
        const rows = await pRes.json();
        const profiles = {};
        for (const r of rows) {
          if (r.hostname) {
            profiles[r.hostname] = rowToProfile(r);
          }
        }
        await lset(SITE_PROFILES_KEY, profiles);
      } catch (parseError) {
        console.error("[VisionAdapt] Failed to parse site profiles:", parseError);
      }
    } else {
      console.warn("[VisionAdapt] Pull site profiles failed with status:", pRes.status);
    }
  } catch (e) {
    console.error("[VisionAdapt] Pull settings error:", e);
  }
}

// ── Tab application ──────────────────────────────────────────────────────────
async function sendToTab(tabId, message) {
  try { await chrome.tabs.sendMessage(tabId, message); } catch (_) {}
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
  await sendToTab(tabId, { type: "APPLY", global, siteProfile, hostname });
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    await applyToTab(tabId, tab.url);
  }
});

// SPA navigation: many sites (YouTube, Gmail, X, Facebook, GitHub) change URL
// without a full reload. Re-apply on history state updates so the extension
// keeps working across in-app navigation.
if (chrome.webNavigation && chrome.webNavigation.onHistoryStateUpdated) {
  chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
    if (details.frameId !== 0) return; // top frame only
    if (!details.url || !details.url.startsWith("http")) return;
    await applyToTab(details.tabId, details.url);
    try { await chrome.tabs.sendMessage(details.tabId, { type: "REAPPLY" }); } catch (_) {}
  });
}

// Pull from cloud whenever the worker wakes (debounced via last-pull timestamp)
let lastPull = 0;
async function maybePull() {
  const now = Date.now();
  if (now - lastPull < 30_000) return;
  lastPull = now;
  await pullAll();
}

// ── Initialization ─────────────────────────────────────────────────────────────
async function initialize() {
  try {
    await checkAndMigrate();
  } catch (error) {
    console.error("[VisionAdapt] Initialization error:", error);
  }
}

// Run initialization on service worker startup
initialize();

// ── Messages ─────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === "GET_STATE") {
      await maybePull();
      const global = await getGlobal();
      const hostname = message.hostname || "";
      const siteProfile = hostname ? await getSiteProfile(hostname) : null;
      const account = await getAccount();
      sendResponse({ global, siteProfile, account });
    }

    else if (message.type === "SET_GLOBAL") {
      await setGlobal(message.settings);
      pushGlobal(message.settings);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url) await applyToTab(tab.id, tab.url);
      sendResponse({ ok: true });
    }

    else if (message.type === "SAVE_SITE_PROFILE") {
      await setSiteProfile(message.hostname, message.profile);
      pushSiteProfile(message.hostname, message.profile);
      sendResponse({ ok: true });
    }

    else if (message.type === "CLEAR_SITE_PROFILE") {
      const profiles = await getSiteProfiles();
      delete profiles[message.hostname];
      await lset(SITE_PROFILES_KEY, profiles);
      deleteRemoteSiteProfile(message.hostname);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url) await applyToTab(tab.id, tab.url);
      sendResponse({ ok: true });
    }

    else if (message.type === "AI_ANALYSIS_DONE") {
      if (message.hostname && message.profile) {
        await setSiteProfile(message.hostname, message.profile);
        pushSiteProfile(message.hostname, message.profile);
      }
      sendResponse({ ok: true });
    }

    else if (message.type === "RELAY_TO_TAB") {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) await sendToTab(tab.id, message.payload);
      sendResponse({ ok: true });
    }

    else if (message.type === "LINK_ACCOUNT") {
      await setAccount(message.session);
      lastPull = 0;
      await pullAll();
      // Re-apply to active tab with synced settings
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url) await applyToTab(tab.id, tab.url);
      sendResponse({ ok: true, account: message.session });
    }

    else if (message.type === "UNLINK_ACCOUNT") {
      await clearAccount();
      sendResponse({ ok: true });
    }

    else if (message.type === "SYNC_NOW") {
      lastPull = 0;
      await pullAll();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url) await applyToTab(tab.id, tab.url);
      sendResponse({ ok: true });
    }
  })();
  return true;
});
