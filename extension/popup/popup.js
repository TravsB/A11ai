/**
 * VisionAdapt — Polymorph AI Popup Script
 */

let currentTab = null;
let currentHostname = "";
let globalState = null;
let siteProfile = null;
let account = null;

const LINK_URL = "https://a11ai.lovable.app/extension-link";

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  try {
    currentHostname = new URL(tab.url).hostname;
  } catch (_) {
    currentHostname = tab.url || "";
  }

  // Set site info
  document.getElementById("siteName").textContent = currentHostname || "This page";
  const siteIconEl = document.getElementById("siteIcon");
  siteIconEl.src = `https://www.google.com/s2/favicons?domain=${currentHostname}&sz=32`;

  // Load state from background
  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_STATE", hostname: currentHostname });
    globalState = response.global;
    siteProfile = response.siteProfile;
    account = response.account;
  } catch (_) {
    globalState = { enabled: true, polymorphAI: true, globalOverride: false, globalSettings: {} };
    siteProfile = null;
    account = null;
  }

  // Request live analysis from content script
  let liveAnalysis = null;
  try {
    liveAnalysis = await chrome.tabs.sendMessage(currentTab.id, { type: "GET_ANALYSIS" });
  } catch (_) {}

  renderUI(liveAnalysis);
  bindEvents();
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderUI(liveAnalysis) {
  const enabled = globalState?.enabled ?? true;
  const aiOn = globalState?.polymorphAI ?? true;

  renderSyncBar();

  // Master toggle
  const masterToggle = document.getElementById("masterToggle");
  masterToggle.checked = enabled;
  updateStatusIndicator(enabled);

  // Main content enabled/disabled
  document.getElementById("mainContent").style.opacity = enabled ? "1" : "0.35";
  document.getElementById("mainContent").style.pointerEvents = enabled ? "auto" : "none";

  // AI toggle
  document.getElementById("aiToggle").checked = aiOn;

  // Determine active settings
  let activeSettings = globalState?.globalSettings || {};
  let badgeText = "DEFAULT";
  let badgeClass = "";

  if (siteProfile) {
    activeSettings = { ...activeSettings, ...siteProfile };
    if (siteProfile.aiGenerated) {
      badgeText = "AI";
      badgeClass = "ai";
    } else {
      badgeText = "SAVED";
      badgeClass = "saved";
    }
  } else if (liveAnalysis?.profile) {
    // Show what AI would recommend
    activeSettings = { ...activeSettings, ...liveAnalysis.profile };
    badgeText = "AI";
    badgeClass = "ai";
  }

  // Update badge
  const badge = document.getElementById("siteBadge");
  badge.textContent = badgeText;
  badge.className = `site-badge ${badgeClass}`;

  // AI panel status & reason
  const aiStatusEl = document.getElementById("aiStatus");
  const aiReasonEl = document.getElementById("aiReason");

  if (!aiOn) {
    aiStatusEl.textContent = "Disabled — using manual settings";
    aiReasonEl.classList.remove("visible");
  } else if (liveAnalysis?.profile?.aiReason) {
    aiStatusEl.textContent = "Auto-adapted for this site";
    aiReasonEl.textContent = liveAnalysis.profile.aiReason;
    aiReasonEl.classList.add("visible");
  } else if (siteProfile?.aiReason) {
    aiStatusEl.textContent = "Saved AI profile applied";
    aiReasonEl.textContent = siteProfile.aiReason;
    aiReasonEl.classList.add("visible");
  } else {
    aiStatusEl.textContent = "Analyzing this page...";
    aiReasonEl.classList.remove("visible");
  }

  // Update chips
  updateChips(activeSettings);

  // Populate override controls with active settings
  loadControlsFrom(activeSettings);
}

function updateChips(settings) {
  const modeLabels = {
    none: "None",
    protanopia: "Protanopia",
    deuteranopia: "Deuteranopia",
    tritanopia: "Tritanopia",
    achromatopsia: "Achromato.",
    "low-contrast": "Low contrast",
  };

  document.getElementById("chipMode").textContent = modeLabels[settings.mode] || "None";
  document.getElementById("chipMode").className = `chip-value${settings.mode && settings.mode !== "none" ? " active" : ""}`;

  const contrast = settings.contrastBoost || 0;
  document.getElementById("chipContrast").textContent = contrast >= 0 ? `+${contrast}%` : `${contrast}%`;
  document.getElementById("chipContrast").className = `chip-value${contrast !== 0 ? " active" : ""}`;

  const fs = settings.fontSize || 100;
  document.getElementById("chipFont").textContent = `${fs}%`;
  document.getElementById("chipFont").className = `chip-value${fs !== 100 ? " active" : ""}`;

  const lh = settings.lineHeight || 100;
  const hr = settings.highReadability;
  document.getElementById("chipSpacing").textContent = hr ? "Enhanced" : lh !== 100 ? `${lh}%` : "Default";
  document.getElementById("chipSpacing").className = `chip-value${(lh !== 100 || hr) ? " active" : ""}`;
}

function loadControlsFrom(settings) {
  document.getElementById("modeSelect").value = settings.mode || "none";

  const contrast = settings.contrastBoost || 0;
  document.getElementById("contrastRange").value = contrast;
  document.getElementById("contrastVal").textContent = contrast >= 0 ? `+${contrast}%` : `${contrast}%`;

  const fs = settings.fontSize || 100;
  document.getElementById("fontRange").value = fs;
  document.getElementById("fontVal").textContent = `${fs}%`;

  const lh = settings.lineHeight || 100;
  document.getElementById("lineRange").value = lh;
  document.getElementById("lineVal").textContent = `${lh}%`;

  document.getElementById("readableFontCheck").checked = !!settings.readableFont;
  document.getElementById("highReadCheck").checked = !!settings.highReadability;
  document.getElementById("focusCheck").checked = settings.focusEnhance !== false;
  document.getElementById("linkCheck").checked = settings.linkUnderline !== false;
}

function updateStatusIndicator(enabled) {
  const dot = document.getElementById("statusDot");
  const text = document.getElementById("statusText");
  dot.className = `status-dot${enabled ? " on" : ""}`;
  text.textContent = enabled ? "ON" : "OFF";
}

function renderSyncBar() {
  const dot = document.getElementById("syncDot");
  const text = document.getElementById("syncText");
  const btn = document.getElementById("syncBtn");
  if (account?.access_token) {
    dot.className = "sync-dot on";
    text.textContent = `Synced · ${account.email || "signed in"}`;
    btn.textContent = "Sync now";
    btn.className = "sync-btn ghost";
  } else {
    dot.className = "sync-dot";
    text.textContent = "Settings only saved locally";
    btn.textContent = "Sign in to sync";
    btn.className = "sync-btn";
  }
}

// ── Events ────────────────────────────────────────────────────────────────────
function bindEvents() {
  // Master power
  document.getElementById("masterToggle").addEventListener("change", async e => {
    globalState.enabled = e.target.checked;
    updateStatusIndicator(globalState.enabled);
    document.getElementById("mainContent").style.opacity = globalState.enabled ? "1" : "0.35";
    document.getElementById("mainContent").style.pointerEvents = globalState.enabled ? "auto" : "none";
    await chrome.runtime.sendMessage({ type: "SET_GLOBAL", settings: globalState });
  });

  // AI toggle
  document.getElementById("aiToggle").addEventListener("change", async e => {
    globalState.polymorphAI = e.target.checked;
    document.getElementById("aiStatus").textContent = e.target.checked
      ? "Auto-adapting for this site"
      : "Disabled — using manual settings";
    if (!e.target.checked) {
      document.getElementById("aiReason").classList.remove("visible");
    }
    await chrome.runtime.sendMessage({ type: "SET_GLOBAL", settings: globalState });
  });

  // Live-preview range/select changes
  const livePreviewInputs = ["modeSelect", "contrastRange", "fontRange", "lineRange",
    "readableFontCheck", "highReadCheck", "focusCheck", "linkCheck"];

  for (const id of livePreviewInputs) {
    document.getElementById(id).addEventListener("input", () => {
      updateRangeLabels();
      const s = collectSettings();
      updateChips(s);
      liveApply(s);
    });
    document.getElementById(id).addEventListener("change", () => {
      updateRangeLabels();
      const s = collectSettings();
      updateChips(s);
      liveApply(s);
    });
  }

  // Save button
  document.getElementById("saveBtn").addEventListener("click", async () => {
    const settings = collectSettings();
    settings.aiGenerated = false;

    await chrome.runtime.sendMessage({
      type: "SAVE_SITE_PROFILE",
      hostname: currentHostname,
      profile: settings
    });

    siteProfile = settings;

    const badge = document.getElementById("siteBadge");
    badge.textContent = "SAVED";
    badge.className = "site-badge saved";

    const saveBtn = document.getElementById("saveBtn");
    saveBtn.textContent = "Saved!";
    saveBtn.style.background = "linear-gradient(135deg, #059669, #10b981)";
    setTimeout(() => {
      saveBtn.textContent = "Save for this site";
      saveBtn.style.background = "";
    }, 1800);
  });

  // Reset button
  document.getElementById("resetBtn").addEventListener("click", async () => {
    await chrome.runtime.sendMessage({
      type: "CLEAR_SITE_PROFILE",
      hostname: currentHostname
    });
    siteProfile = null;

    try {
      await chrome.tabs.sendMessage(currentTab.id, { type: "RESET" });
    } catch (_) {}

    const badge = document.getElementById("siteBadge");
    badge.textContent = "AI";
    badge.className = "site-badge ai";

    document.getElementById("aiStatus").textContent = "Re-analyzing page...";
    document.getElementById("aiReason").classList.remove("visible");

    // Re-apply AI
    await chrome.runtime.sendMessage({ type: "SET_GLOBAL", settings: globalState });
  });
}

function collectSettings() {
  return {
    mode: document.getElementById("modeSelect").value,
    contrastBoost: parseInt(document.getElementById("contrastRange").value, 10),
    fontSize: parseInt(document.getElementById("fontRange").value, 10),
    lineHeight: parseInt(document.getElementById("lineRange").value, 10),
    readableFont: document.getElementById("readableFontCheck").checked,
    highReadability: document.getElementById("highReadCheck").checked,
    focusEnhance: document.getElementById("focusCheck").checked,
    linkUnderline: document.getElementById("linkCheck").checked,
  };
}

function updateRangeLabels() {
  const contrast = parseInt(document.getElementById("contrastRange").value, 10);
  document.getElementById("contrastVal").textContent = contrast >= 0 ? `+${contrast}%` : `${contrast}%`;

  const fs = parseInt(document.getElementById("fontRange").value, 10);
  document.getElementById("fontVal").textContent = `${fs}%`;

  const lh = parseInt(document.getElementById("lineRange").value, 10);
  document.getElementById("lineVal").textContent = `${lh}%`;
}

async function liveApply(settings) {
  try {
    await chrome.tabs.sendMessage(currentTab.id, {
      type: "APPLY_OVERRIDE",
      settings
    });
  } catch (_) {}
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
