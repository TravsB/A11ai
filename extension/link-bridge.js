/**
 * VisionAdapt — Web Sync Bridge
 * Runs on the A11ai web app's /extension-link page.
 * Captures the user's Supabase session from the page and hands it to the
 * background service worker for syncing.
 */

(function () {
  function handleSession(detail) {
    if (!detail || !detail.access_token) return;
    chrome.runtime.sendMessage(
      {
        type: "LINK_ACCOUNT",
        session: {
          access_token: detail.access_token,
          refresh_token: detail.refresh_token,
          user_id: detail.user_id,
          email: detail.email,
        },
      },
      () => {
        // Tell the page we got it
        window.dispatchEvent(new CustomEvent("a11ai-extension-linked"));
      }
    );
  }

  // Primary path: CustomEvent dispatched by the React page
  window.addEventListener("a11ai-extension-link", (e) => handleSession(e.detail));

  // Fallback: poll the hidden bridge element for a few seconds
  let attempts = 0;
  const poll = setInterval(() => {
    attempts++;
    const el = document.getElementById("a11ai-session-bridge");
    if (el && el.dataset.access) {
      clearInterval(poll);
      handleSession({
        access_token: el.dataset.access,
        refresh_token: el.dataset.refresh,
        user_id: el.dataset.user,
      });
    }
    if (attempts > 20) clearInterval(poll);
  }, 500);
})();
