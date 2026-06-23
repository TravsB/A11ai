/**
 * VisionAdapt — Web Sync Bridge
 * Runs on the A11ai web app's /extension-link page.
 * Captures the user's Supabase session from the page and hands it to the
 * background service worker for syncing.
 */

(function () {
  let pollInterval = null;
  let linkHandled = false;

  function handleSession(detail) {
    if (linkHandled) return; // Prevent duplicate linking
    if (!detail || !detail.access_token) {
      console.warn("[VisionAdapt] Invalid session data received");
      return;
    }

    linkHandled = true;
    cleanupPolling();

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
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("[VisionAdapt] Failed to link account:", chrome.runtime.lastError);
          linkHandled = false; // Allow retry on error
        } else {
          // Tell the page we got it
          window.dispatchEvent(new CustomEvent("a11ai-extension-linked"));
          console.log("[VisionAdapt] Account linked successfully");
        }
      }
    );
  }

  function cleanupPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  // Primary path: CustomEvent dispatched by the React page
  window.addEventListener("a11ai-extension-link", (e) => {
    console.log("[VisionAdapt] Received extension-link event");
    handleSession(e.detail);
  });

  // Fallback: poll the hidden bridge element with optimized timing
  let attempts = 0;
  const MAX_ATTEMPTS = 15; // Reduced from 20
  const INITIAL_POLL_DELAY = 100; // Faster initial check
  const POLL_INTERVAL = 300; // More frequent polling

  // Start with a quick initial check
  setTimeout(() => {
    const el = document.getElementById("a11ai-session-bridge");
    if (el && el.dataset.access) {
      handleSession({
        access_token: el.dataset.access,
        refresh_token: el.dataset.refresh,
        user_id: el.dataset.user,
      });
      return;
    }

    // If not found immediately, start polling
    pollInterval = setInterval(() => {
      attempts++;
      const el = document.getElementById("a11ai-session-bridge");
      if (el && el.dataset.access) {
        handleSession({
          access_token: el.dataset.access,
          refresh_token: el.dataset.refresh,
          user_id: el.dataset.user,
        });
      } else if (attempts >= MAX_ATTEMPTS) {
        console.warn("[VisionAdapt] Session bridge not found after polling");
        cleanupPolling();
      }
    }, POLL_INTERVAL);
  }, INITIAL_POLL_DELAY);

  // Cleanup on page unload
  window.addEventListener("beforeunload", cleanupPolling);
})();
