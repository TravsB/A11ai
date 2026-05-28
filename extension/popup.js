/* Reform Labs — A11y · Popup */
const DEFAULTS = {
  enabled:false, mode:"none", contrastBoost:50, fontSize:100, lineHeight:100,
  readableFont:false, highReadability:false, daltonize:false, linkEmphasis:true,
  rulerEnabled:false, rulerHeight:110, rulerDim:70,
  adaptiveLearning:true, showRecommendations:true,
};
const KEY = "reformlabs_a11y_settings";
const $ = (id) => document.getElementById(id);

function load() {
  return new Promise(r => chrome.storage.sync.get(KEY, v => {
    r(v[KEY] ? { ...DEFAULTS, ...v[KEY] } : { ...DEFAULTS });
  }));
}
async function save(patch) {
  const cur = await load();
  const next = { ...cur, ...patch };
  await new Promise(r => chrome.storage.sync.set({ [KEY]: next }, r));
  chrome.runtime.sendMessage({ type: "RELAY_TO_ACTIVE_TAB", settings: next });
  render(next);
}
function pct(el) { const v = +el.value, mn = +el.min, mx = +el.max;
  el.style.setProperty("--p", ((v - mn) / (mx - mn) * 100) + "%"); }

function render(s) {
  $("enabled").checked = s.enabled;
  $("daltonize").checked = s.daltonize;
  $("readableFont").checked = s.readableFont;
  $("highReadability").checked = s.highReadability;
  $("linkEmphasis").checked = s.linkEmphasis;
  $("rulerEnabled").checked = s.rulerEnabled;
  for (const id of ["contrastBoost","fontSize","lineHeight","rulerHeight","rulerDim"]) {
    $(id).value = s[id]; pct($(id));
  }
  document.querySelectorAll(".mode").forEach(b =>
    b.classList.toggle("active", b.dataset.mode === s.mode));
}

async function fetchContext() {
  const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type:"GET_WEBSITE_CONTEXT" }, (resp) => {
    if (chrome.runtime.lastError || !resp?.context) {
      $("context").textContent = "unavailable"; return;
    }
    const c = resp.context;
    $("context").textContent = `${c.type} · ${Math.round(c.confidence*100)}%`;
    const want = resp.suggestedMode && resp.suggestedMode !== "none";
    const wantR = !!resp.suggestRuler;
    if (want || wantR) {
      const btn = $("apply-suggested");
      btn.hidden = false;
      btn.textContent = `Apply recommended${want ? ` · ${resp.suggestedMode}` : ""}${wantR ? " + ruler" : ""}`;
      btn.onclick = () => save({
        enabled: true,
        mode: want ? resp.suggestedMode : undefined,
        rulerEnabled: wantR || undefined,
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const s = await load();
  render(s);
  fetchContext();

  $("enabled").addEventListener("change", e => save({ enabled: e.target.checked }));
  $("daltonize").addEventListener("change", e => save({ daltonize: e.target.checked }));
  $("readableFont").addEventListener("change", e => save({ readableFont: e.target.checked }));
  $("highReadability").addEventListener("change", e => save({ highReadability: e.target.checked }));
  $("linkEmphasis").addEventListener("change", e => save({ linkEmphasis: e.target.checked }));
  $("rulerEnabled").addEventListener("change", e => save({ rulerEnabled: e.target.checked }));

  for (const id of ["contrastBoost","fontSize","lineHeight","rulerHeight","rulerDim"]) {
    $(id).addEventListener("input", e => { pct(e.target); save({ [id]: +e.target.value }); });
  }
  document.querySelectorAll(".mode").forEach(btn => {
    btn.addEventListener("click", () => save({ mode: btn.dataset.mode, enabled: true }));
  });
  $("reset").addEventListener("click", async () => {
    await new Promise(r => chrome.storage.sync.set({ [KEY]: DEFAULTS }, r));
    chrome.runtime.sendMessage({ type:"RELAY_TO_ACTIVE_TAB", settings: DEFAULTS });
    render(DEFAULTS);
  });
});
