import { useEffect } from "react";
import { toast } from "sonner";

const PERIODIC_CHECK_MS = 60 * 1000;

/**
 * Registers the PWA service worker (production only) and prompts the user
 * to refresh when a new version of the app is available.
 *
 * The `virtual:pwa-register/react` module is provided by vite-plugin-pwa,
 * which is only enabled in production builds. We therefore load it via a
 * dynamic import guarded by `import.meta.env.PROD` so dev builds don't
 * fail to resolve the virtual module.
 */
export function useServiceWorkerUpdate() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    // @vite-ignore — virtual module only exists at build time
    import(/* @vite-ignore */ "virtual:pwa-register")
      .then(({ registerSW }) => {
        if (cancelled) return;

        let toastId: string | number | undefined;

        const updateSW = registerSW({
          onNeedRefresh() {
            toastId = toast("New version available", {
              description: "Tap refresh to load the latest update.",
              duration: Infinity,
              action: {
                label: "Refresh",
                onClick: () => updateSW(true),
              },
            });
          },
          onRegisteredSW(_swUrl: string, registration?: ServiceWorkerRegistration) {
            if (!registration) return;
            const interval = setInterval(() => {
              registration.update().catch(() => {
                /* network errors are fine to ignore */
              });
            }, PERIODIC_CHECK_MS);
            cleanup = () => {
              clearInterval(interval);
              if (toastId !== undefined) toast.dismiss(toastId);
            };
          },
        });
      })
      .catch(() => {
        /* PWA module not available — safe to ignore */
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
