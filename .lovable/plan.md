
# In-App Notification System — Phase 1

## What We're Building

Three tightly connected pieces:

1. A `useNotificationStore` (Zustand) that tracks unread states for announcements and new PRs
2. Red dot badges on the Community tab and the #announcements channel in the sidebar
3. A Notification Settings panel in the user profile with 2 toggles (stored in `user_profiles.notification_preferences`)

No email, no push notifications, no new database tables beyond the column already added.

---

## Part 1 — Create `src/stores/notificationStore.ts`

A new Zustand store that:

- Reads `notification_preferences` from `user_profiles` for the current user
- Tracks `hasNewAnnouncement: boolean` — checks if there are active announcements that haven't been dismissed since the user last visited the Community tab
- Tracks `unreadDmCount: number` — already exists in `communityStore`, the notification store will read from it via Zustand
- Uses `localStorage` timestamps to know "did a new announcement appear since I last visited the Community tab?"
- Exposes `markCommunityVisited()` — called when the user clicks the Community tab, clears the dot
- Exposes `loadNotificationPrefs(userId)` — loads toggles from `user_profiles`
- Exposes `saveNotificationPrefs(userId, prefs)` — saves toggles back to `user_profiles`

The logic for `hasNewAnnouncement`:
- On mount, query the `announcements` table for active, undismissed announcements
- Compare the most recent announcement's `created_at` against `localStorage.getItem('community_last_visited')` timestamp
- If a newer announcement exists → `hasNewAnnouncement = true`
- When user visits the Community tab → store current timestamp in localStorage + set `hasNewAnnouncement = false`

This is entirely client-side with zero new database queries beyond what's already happening in `AnnouncementBanner`.

---

## Part 2 — Red Dot Badge on the Community Tab (Vault.tsx)

Update the Community `TabsTrigger` in `src/pages/Vault.tsx` to:

- Import `useNotificationStore`
- Show a small red dot indicator when `hasNewAnnouncement || unreadDmCount > 0`
- Call `markCommunityVisited()` when the Community tab is clicked (via `onValueChange` on the `Tabs` component)

The dot appears as a small `w-2 h-2 rounded-full bg-destructive` positioned absolute top-right of the Users icon — same pattern as the existing DM badge in ChannelSidebar.

---

## Part 3 — Red Dot on #announcements Channel in Sidebar (ChannelSidebar.tsx)

Update `src/components/community/ChannelSidebar.tsx`:

- Import `useNotificationStore`
- When rendering the channel list, if the channel name is `announcements` and `hasNewAnnouncement` is `true`, show a small red dot badge next to the channel name (right side)
- The dot clears when the user clicks into the announcements channel (call `markCommunityVisited()` or a dedicated `markAnnouncementsRead()`)

This follows the exact same pattern as the existing `unreadDmCount` badge that already renders on the "Coach Messages" DM row.

---

## Part 4 — Notification Settings Panel

Create a new component `src/components/vault/NotificationSettings.tsx`:

- Two toggle rows using the existing `Switch` component:
  - "Announcement alerts" — controls the red dot for new announcements (default: on)
  - "PR badge alerts" — controls whether a future PR red dot would show (default: on)
- Reads initial state from `notificationStore.prefs`
- Saves on toggle via `saveNotificationPrefs(userId, prefs)` which upserts to `user_profiles`

---

## Part 5 — Wire the Settings Into the Vault

Add the `NotificationSettings` component to an appropriate location. The cleanest place: inside the existing **Dashboard tab** (`VaultDashboard` component) as a collapsed section at the bottom, or as a new Settings section inside the Community or Dashboard view.

Given the existing layout, the best fit is to add a `Bell` icon button in the **Vault header** (next to the VAULT MEMBER badge row) that opens a small popover/sheet with the 2 toggles. This is non-intrusive and discoverable.

---

## Files Changed

| File | Change |
|------|--------|
| `src/stores/notificationStore.ts` | New file — Zustand store for notification state + prefs |
| `src/pages/Vault.tsx` | Add red dot on Community tab, wire `onValueChange` to clear dot |
| `src/components/community/ChannelSidebar.tsx` | Add red dot on #announcements channel row |
| `src/components/vault/NotificationSettings.tsx` | New component — 2 toggles for prefs |
| `src/components/dashboard/VaultDashboard.tsx` | Add Bell icon + NotificationSettings popover in header |

No new database tables. No edge functions. No secrets needed. The `notification_preferences` column was already added to `user_profiles` in the previous migration.

---

## What This Does NOT Include (intentionally deferred)

- PR red dot on the Train tab (deferred until #pr-board channel decision is made)
- Daily digest view inside the app (this can be a future Admin-only dashboard widget)
- Any email sending
- OneSignal or push of any kind
