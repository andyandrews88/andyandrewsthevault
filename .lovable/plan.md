

# Fix PWA Build Errors

Two small config issues are preventing the build from succeeding, which is why the app still opens in the browser instead of standalone mode.

## Problem 1: Workbox File Size Limit

The app's JavaScript bundle is ~2.7MB, which exceeds the default 2MB precache limit in workbox. This causes the build to fail entirely.

**Fix**: Add `maximumFileSizeToCacheInBytes: 5 * 1024 * 1024` (5MB) to the workbox config in `vite.config.ts`.

## Problem 2: CSS @import Order

The `@import` for Google Fonts in `src/index.css` appears after `@tailwind` directives. CSS requires `@import` statements to come before all other statements.

**Fix**: Move the `@import url(...)` line to the very top of `src/index.css`, before `@tailwind base`.

## After the Build Fix

Once the build succeeds, the PWA manifest and service worker will deploy. To get the standalone experience (no browser URL bar):

1. Open the published app in Chrome on your Android
2. Tap the 3-dot menu in the top right
3. Tap "Install app" or "Add to Home screen"
4. Open the app from your home screen -- it will now run in standalone mode without the browser UI

The browser URL bar you see in your screenshot is normal for when you visit the site through Chrome directly. The standalone mode only activates when you launch the installed PWA from the home screen icon.

## Technical Details

### File: `vite.config.ts`

Add one line inside the `workbox` config object:

```text
workbox: {
  navigateFallbackDenylist: [/^\/~oauth/],
  globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,  // <-- add this
},
```

### File: `src/index.css`

Move the `@import` line to the very top:

```text
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* The Vault - Industrial Elite Design System ... */
```

(Remove the duplicate `@import` from its current position on line 10.)

