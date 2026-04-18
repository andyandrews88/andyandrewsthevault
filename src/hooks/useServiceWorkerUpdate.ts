import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

const PERIODIC_CHECK_MS = 60 * 1000;

/**
 * Registers the PWA service worker and prompts the user to refresh
 * when a new version of the app is available.
 *
 * Uses the official vite-plugin-pwa "prompt" pattern PLUS a build-time
 * version-mismatch fallback so users are never silently left on an
 * outdated cached bundle.
 */
export function useServiceWorkerUpdate() {
  const promptedRef = useRef(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Periodic update check so long-lived sessions pick up new releases
      setInterval(() => {
        registration.update().catch(() => {
          /* network errors are fine to ignore */
        });
      }, PERIODIC_CHECK_MS);
    },
  });

  // Belt-and-braces: if main.tsx detected a build version mismatch
  // (cached bundle differs from server), force the prompt even if the SW
  // hasn't yet reported needRefresh.
  useEffect(() => {
    try {
      const mismatch = sessionStorage.getItem("app_version_mismatch");
      if (mismatch === "1" && !promptedRef.current) {
        promptedRef.current = true;
        sessionStorage.removeItem("app_version_mismatch");
        const id = toast("New version available", {
          description: "Tap refresh to load the latest update.",
          duration: Infinity,
          action: {
            label: "Refresh",
            onClick: () => {
              updateServiceWorker(true);
              // Hard reload as a final fallback in case SW activation lags.
              setTimeout(() => window.location.reload(), 300);
            },
          },
        });
        return () => {
          toast.dismiss(id);
        };
      }
    } catch {
      /* ignore */
    }
  }, [updateServiceWorker]);

  useEffect(() => {
    if (!needRefresh) return;
    const id = toast("New version available", {
      description: "Tap refresh to load the latest update.",
      duration: Infinity,
      action: {
        label: "Refresh",
        onClick: () => {
          updateServiceWorker(true);
        },
      },
      onDismiss: () => setNeedRefresh(false),
    });
    return () => {
      toast.dismiss(id);
    };
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);
}
