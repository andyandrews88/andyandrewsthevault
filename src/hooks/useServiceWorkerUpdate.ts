import { useEffect } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

const PERIODIC_CHECK_MS = 60 * 1000;

/**
 * Registers the PWA service worker and prompts the user to refresh
 * when a new version of the app is available.
 *
 * Uses the official vite-plugin-pwa "prompt" pattern so the new SW
 * waits for user confirmation before activating — guaranteeing that
 * users always know when an update is ready (Notion / Linear pattern).
 */
export function useServiceWorkerUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      // Periodic update check so long-lived sessions pick up new releases
      setInterval(() => {
        registration.update().catch(() => {
          /* network errors are fine to ignore */
        });
      }, PERIODIC_CHECK_MS);
    },
  });

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
