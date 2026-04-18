import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Build-time version stamp injected by Vite (see vite.config.ts → define)
declare const __APP_VERSION__: string;

// Belt-and-braces version mismatch detection.
// If the cached HTML loads an older bundle than what the server now serves,
// the SW prompt may not fire. We stamp the running version into localStorage
// and compare on every load — `useServiceWorkerUpdate` reads this flag.
try {
  const KEY = "app_version";
  const stored = localStorage.getItem(KEY);
  if (stored && stored !== __APP_VERSION__) {
    sessionStorage.setItem("app_version_mismatch", "1");
  }
  localStorage.setItem(KEY, __APP_VERSION__);
} catch {
  /* localStorage unavailable — ignore */
}

createRoot(document.getElementById("root")!).render(<App />);
