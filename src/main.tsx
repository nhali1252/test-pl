import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandlers, audit } from "@/lib/audit";

// Guard: prevent service worker issues in iframes/preview
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
} else {
  // Register the PWA virtual module for auto-update in production
  import("virtual:pwa-register").then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        audit("update_available");
      },
      onOfflineReady() {
        audit("offline_ready");
      },
      onRegisteredSW(swUrl, registration) {
        // Check for updates every 60 seconds
        if (registration) {
          setInterval(() => {
            registration.update();
          }, 60 * 1000);
        }
      },
    });
  }).catch(() => {});
}

// Setup global error handlers
setupGlobalErrorHandlers();
audit("app_started");

createRoot(document.getElementById("root")!).render(<App />);
