
# My Honest Opinion on the Notification Policy — and a Better Architecture

## First: My Candid Assessment

Your plan is well thought-out and the intentions are exactly right. But before I recommend implementing it exactly as described, I want to be honest about what will work well, what has risks, and where I'd do it differently. This is a coaching platform for a relatively small, high-engagement community — that context changes what makes sense.

---

## The Four Items, One by One

### 1. Push Notifications via OneSignal — My Recommendation: Defer This

**The Reality of Push Notifications on a Web App**

OneSignal push notifications for web apps require users to explicitly grant browser permission. In practice, fewer than 20% of web users ever grant this. Your athletes are already inside the app when they're active — the moment they most need a notification is when they're NOT in the app (e.g., someone replied to their thread). This is valuable for power users, but adds significant complexity for a feature most users will silently ignore.

**What OneSignal Actually Requires**

- A OneSignal account + App ID + REST API key stored as secrets
- A Service Worker file (`public/OneSignalSDKWorker.js`) registered in the browser
- A database table to store each user's OneSignal `player_id` (device token) — you'd need a new `user_push_tokens` table
- A backend function to call OneSignal's REST API for each notification event
- @mention detection logic: parsing message content for `@DisplayName` patterns on every single post/reply

**The @mention problem specifically**: There is currently no @mention system in the community. Messages are stored as plain text — `"Great progress @John!"` is just a string. Implementing @mentions properly requires: an autocomplete dropdown as the user types, storing mentions as structured data (not just text parsing), and a lookup table of who was mentioned. This alone is a significant feature build — not a quick add.

**My Recommendation**: Instead of OneSignal push, implement **in-app notifications first** (covered in point 2 below, which is much higher value and already 80% of the infrastructure exists). Defer push notifications until the community is larger and the demand is clearly there. When you do add push, OneSignal is the right choice.

---

### 2. In-App Notification Red Dots — My Recommendation: Yes, Build This

**This is the right call and the most impactful item on your list.** The infrastructure is almost there already:

- The DM section in `ChannelSidebar` already has an `unreadDmCount` red badge — the pattern exists
- The `announcements` table and `announcement_dismissals` table already exist
- The `personal_records` table already fires a `PRCelebration` component when a PR is set

What's missing is a unified notification state that drives red dots on:
- The **Community tab** itself (in the main nav tabs)
- The **#announcements channel** name in the sidebar
- A **#pr-board** channel (which doesn't exist yet as a channel — PRs are in the workout section)

**What I'd build here:**

A `useNotificationStore` (Zustand) that tracks:
```typescript
{
  hasNewAnnouncement: boolean;   // new active announcement since user last visited
  hasNewPR: boolean;             // a new PR was set since last viewed PR board
  unreadDmCount: number;         // already exists in communityStore
}
```

Stored in `localStorage` with timestamps — "user last visited community tab at X, any announcements/PRs since then?" — no new database table needed for the basic version.

**The #pr-board clarification**: Right now PRs live in the Workout tab → PR Board component. If you want a #pr-board *channel* in the community where PRs auto-post (so others can see and react to them), that's a bigger feature. If you just want a red dot on the Workout tab when a new PR is set, that's trivial. I'd recommend clarifying which you mean before building it.

---

### 3. Coach's Daily Digest Email via Resend — My Recommendation: Yes, Build This Exactly

**This is the cleanest item on the list** and maps perfectly to what already exists. You already have:

- The `admin-weekly-report` edge function that queries community messages, PRs, and user data
- Resend is the right tool (developer-friendly, great deliverability, free tier is generous)
- A scheduled cron job using Supabase's `pg_cron` extension to fire at 8 PM

**What to build:**

1. A new `daily-digest` edge function that:
   - Queries community messages from the last 24 hours
   - Queries new PRs from the last 24 hours  
   - Formats a clean HTML email
   - Sends via Resend to `andyandrewscf@gmail.com`

2. A `pg_cron` job to call it at 8 PM (you'd need to specify timezone — I'd use `20:00 UTC` or adjust for your timezone)

**One thing to note**: Resend requires you to have a verified sending domain (or use their `@resend.dev` sandbox domain for testing). You'll need a Resend account and API key, and ideally your own domain (e.g., sending from `digest@andyandrews.com`). This is a 10-minute setup on Resend's side.

---

### 4. User Notification Settings Toggle — My Recommendation: Yes, Simplified

**This is the right idea but I'd simplify the scope:**

Your current plan: opt-out of PR alerts but keep Coach replies active.

My recommendation: Build a `notification_preferences` JSON column on `user_profiles` (no new table needed) with these simple toggles:

```typescript
{
  email_digest: boolean;          // not relevant for users, only admin
  pr_badge_alerts: boolean;       // red dot when new PR is set (default: true)
  announcement_alerts: boolean;   // red dot for new announcements (default: true)
}
```

This lives in a `Notification Settings` section inside the user's profile area. It's 2 toggle switches, stored in the existing `user_profiles` table as a JSONB column.

**The "Coach replies" part**: Since there's no push notification system yet, "keeping Coach replies active" translates to keeping the existing DM unread count badge — which always shows and can't be turned off (intentionally, since it's the coach directly messaging you).

---

## Revised Build Order (What I'd Actually Implement)

Given all of the above, here is the pragmatic sequence:

### Phase 1 — High Value, Low Complexity (Build Now)

1. **Daily Digest Email** — new `daily-digest` edge function + Resend integration + pg_cron at 8 PM
2. **In-App Red Dots** — notification state for announcements and PRs, red dot on Community tab in the nav, red dot on #announcements channel in the sidebar
3. **Notification Preferences toggle** — 2 switches in user profile, stored in `user_profiles` as JSONB

### Phase 2 — Moderate Complexity (Build When Ready)

4. **@mention system** — autocomplete dropdown when typing `@`, store mentions, highlight them in messages, drive in-app notifications for mentions and thread replies

### Phase 3 — Defer Until Community Grows

5. **OneSignal push notifications** — implement when you have 50+ active daily users who are requesting this feature

---

## What Needs to Be Built (Technical Summary)

| Item | New DB | New Edge Function | Secrets Needed | Complexity |
|------|--------|-------------------|----------------|------------|
| Daily Digest Email | No | Yes (`daily-digest`) | `RESEND_API_KEY` | Low |
| In-App Red Dots | No | No | None | Low |
| Notification Prefs | Yes (column on `user_profiles`) | No | None | Low |
| @mention system | Yes (`message_mentions` table) | No | None | High |
| OneSignal Push | Yes (`user_push_tokens` table) | Yes | `ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY` | Very High |

---

## Summary

Your instincts are correct. The notification policy makes total sense for a coaching platform. My advice:

- **Build items 3 and 4 immediately** — they're high impact, low risk, and use existing infrastructure
- **Build a simplified version of item 2** (in-app dots only, no #pr-board channel yet)
- **Defer item 1 (OneSignal)** until you have @mention infrastructure and a larger user base — it's a significant build for currently marginal impact
- **Ask me to clarify** what you mean by #pr-board before building it — it means different things depending on whether you want PRs visible in the community feed vs just a notification dot

Do you want me to proceed with Phase 1 (Daily Digest + In-App Dots + Notification Prefs), or would you like to adjust the scope first?
