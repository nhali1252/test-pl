import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { audit } from "@/lib/audit";

export function useServiceWorkerUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const checkForUpdates = useCallback(async () => {
    audit("update_checked");
    try {
      const regs = await navigator.serviceWorker?.getRegistrations();
      if (regs) {
        for (const reg of regs) {
          await reg.update();
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setUpdateAvailable(true);
            audit("update_available");
          }
        }
      }
    } catch (e) {
      audit("update_failed", String(e));
    }
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onControllerChange = () => {
      audit("update_applied");
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // Listen for new service workers
    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
            audit("update_available");
          }
        });
      });
    }).catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  }, [waitingWorker]);

  return { updateAvailable, applyUpdate, checkForUpdates };
}

export default function UpdatePrompt({ updateAvailable, onUpdate }: { updateAvailable: boolean; onUpdate: () => void }) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-28 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <div className="rounded-2xl glass-card p-4 flex items-center gap-3 shadow-xl border border-primary/20">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t("updateAvailable")}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 text-xs rounded-lg text-muted-foreground hover:bg-secondary/80 transition-colors"
            >
              ✕
            </button>
            <button
              onClick={onUpdate}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground"
            >
              {t("updateNow")}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
