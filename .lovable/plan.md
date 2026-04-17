

## Plan: Reclaim chat real estate + fix PWA update prompt

### Part 1 — My take on the chat (and what I recommend)

Your instinct is right. Right now on mobile the chat fills only ~50% of the screen because **four bands of chrome** sit above and below it:
1. Vault page top padding + mobile logo bar (~70px)
2. Community channel header (36px)
3. Bottom nav (56px)
4. Footer with Privacy/Terms/Contact (~120px) — yes, this renders on `/vault` too, **below the bottom nav**. That's the main culprit you're seeing.

I cross-checked Slack, Discord, WhatsApp, iMessage and Telegram. **None** of them show a footer or persistent top bar inside the chat. The pattern is: edge-to-edge messages, slim header, slim composer, nav auto-hides on scroll. Here's what I recommend, ranked:

**Option A — Recommended: "Immersive chat mode"**
When the Community tab is active on mobile:
- Hide the landing-page Footer entirely (it's irrelevant inside the app)
- Hide the Vault page top bar (logo + member chip)
- Auto-hide the BottomNav on scroll-down, reveal on scroll-up (WhatsApp/Telegram pattern)
- Result: chat takes ~95% of the viewport. Composer pinned to bottom.

**Option B — Lighter touch**
Just hide the Footer on `/vault` and auto-hide BottomNav globally. Keep top bar. Gains ~25% more space.

**Option C — Full-screen toggle**
Add an "expand" button in the channel header that pushes chat to full screen with a slim back arrow.

I'd ship **A** as the default, since the Footer genuinely shouldn't render inside an authenticated app — it's a landing-page element.

### Part 2 — Other world-class chat upgrades worth adding now

Cheap wins that match Slack/Discord and would noticeably elevate the feel:

1. **Date dividers** — "Today", "Yesterday", "Wed, Apr 15" between message groups
2. **Unread indicator** — a thin red line + "New messages" pill where you last left off
3. **"Jump to bottom" button** — appears when scrolled up, like Discord
4. **Typing indicator** — "Andy is typing…" via realtime presence
5. **Hover/long-press reactions bar** — quick emoji reactions (👍 ❤️ 🔥) on each message
6. **@mentions autocomplete** — `@` triggers a member dropdown, mentioned user gets a notification

I'd suggest shipping **1, 2, 3** with the layout fix (they're presentation-only, no schema change) and saving 4–6 for a follow-up since they need DB work.

### Part 3 — Why the published app isn't updating

I traced this. The PWA setup has two problems:

1. `vite.config.ts` uses `registerType: "autoUpdate"` with `skipWaiting: true` + `clientsClaim: true`. This makes the new service worker take over **silently** in the background. There's no `onNeedRefresh` callback, so `useServiceWorkerUpdate` never fires the toast.
2. `useServiceWorkerUpdate` listens to `controllerchange`, which only fires *after* the new SW has already activated — by then the user has been served the old cached HTML and won't see the prompt until next reload. So the toast effectively never shows.

The fix is the standard `vite-plugin-pwa` prompt pattern:
- Switch `registerType` to `"prompt"` 
- Replace `useServiceWorkerUpdate` with the official `useRegisterSW` hook from `virtual:pwa-register/react`, wired to `onNeedRefresh` → show toast → `updateSW(true)` on tap.
- Also add a 60-second auto-check (`registration.update()`) so users on a long session pick up new releases without restarting.

This is the same pattern used by Notion, Linear, and Cal.com PWAs.

### Files to edit

**Layout / chat space (3 files)**
- `src/pages/VaultPage.tsx` — don't render `<Footer />` (it's an in-app page, not landing). Optionally only hide on mobile.
- `src/pages/Vault.tsx` — when `activeTab === 'community'` on mobile, hide the top logo bar + remove the bottom padding so chat goes edge-to-edge
- `src/components/layout/BottomNav.tsx` — add scroll-direction auto-hide (transform translate-y on scroll-down, reveal on scroll-up). Disable on desktop.

**Chat polish (2 files)**
- `src/components/community/ChannelFeed.tsx` — add date dividers between messages, "Jump to bottom" floating button when scrolled up >200px, and unread separator line
- `src/components/community/DirectMessagePane.tsx` — same date dividers + jump-to-bottom

**PWA update prompt (3 files)**
- `vite.config.ts` — change `registerType: "autoUpdate"` → `"prompt"`, remove `skipWaiting` + `clientsClaim` from workbox (let user trigger update)
- `src/hooks/useServiceWorkerUpdate.ts` — rewrite using `useRegisterSW` from `virtual:pwa-register/react`; toast on `onNeedRefresh`, call `updateSW(true)` on tap. Add periodic 60s `registration.update()` check.
- `src/vite-env.d.ts` — add `/// <reference types="vite-plugin-pwa/react" />` so the virtual module types resolve

### What does NOT change
- No DB / RLS changes
- No store / realtime logic changes
- No new dependencies (`vite-plugin-pwa` already installed)
- Desktop layout untouched
- Landing page (`/`) keeps its footer

### Technical notes
- Auto-hide nav uses `useEffect` with `window.scrollY` delta; threshold 8px to avoid jitter; transition `transform 200ms ease-out`
- Date dividers: compare `new Date(prev.created_at).toDateString()` with current; render a centered chip when different
- Jump-to-bottom: track scroll position on the ScrollArea viewport; show button if `scrollHeight - scrollTop - clientHeight > 200`
- `useRegisterSW` returns `{ needRefresh, updateServiceWorker }`; we drive a sonner toast with `duration: Infinity` and an action that calls `updateServiceWorker(true)` (true = reload after activation)

