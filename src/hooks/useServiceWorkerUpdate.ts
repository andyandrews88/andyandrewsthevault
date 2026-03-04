import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Listens for service worker updates and prompts the user to reload
 * when a new version of the app is available.
 */
export function useServiceWorkerUpdate() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleControllerChange = () => {
      toast("New version available", {
        description: "Tap to refresh and get the latest updates.",
        duration: Infinity,
        action: {
          label: "Refresh",
          onClick: () => window.location.reload(),
        },
      });
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);
}
