
# Comprehensive App Audit — Andy Andrews The Vault

## What This Audit Covers
A full technical, functional, UX, and mobile review of every major section of the app based on live browser testing, code inspection, and error log analysis. Findings are divided into Critical Bugs (must fix before launch), UX Issues (should fix), and Honest Review feedback.

---

## CRITICAL BUGS — Must Fix Before Launch

### Bug 1: Stale Active Workout Blocks the Entire Log Workout Tab
**Severity: Critical**

When a workout session was started (the "Full Body — Monday, February 9" session) and never cancelled or finished, it becomes permanently stuck. Every time a user opens the Workouts tab, they are immediately dropped into the active logging screen with no way to navigate dates, see programs, or start a fresh session. The back arrow button shows a cancel dialog, but many users won't realize this is how to get out.

**Root cause:** `fetchActiveWorkout()` fetches the most recent incomplete workout from the database. If a workout from a past date is still incomplete (`is_completed = false`), it loads as the active session every time, trapping the user indefinitely.

**Fix:** In `fetchActiveWorkout()` in `workoutStore.ts`, add a check: if the active workout's date is more than 24 hours in the past, automatically mark it as completed or abandoned rather than treating it as a live session. Alternatively, add a clearly visible "Abandon Session" button separate from the cancel flow.

---

### Bug 2: Badge Component `ref` Warning (Console Error)
**Severity: Medium — Console Noise**

The `BreathworkMethodCard.tsx` passes a `ref` to the `Badge` component, which is a plain function component and does not forward refs. This produces a React warning on every render of the Lifestyle tab. While not a crash, it signals a component composition issue. The `Badge` in `badge.tsx` needs `React.forwardRef()`.

---

### Bug 3: No Tab Labels on Mobile — Navigation is Icon-Only
**Severity: High (UX)**

On mobile (390px viewport), the main Vault tab bar shows only icons with no text labels. The tabs are: a grid icon, book icon, pulse icon, heart icon, dumbbell icon, radio icon, people icon, target icon, and shield icon. There is zero text to tell a new user what these mean. This will cause confusion for first-time visitors.

The tab bar logic uses `hidden sm:inline text-sm` to hide labels on mobile, meaning only icons appear. For a new user, this is completely unguessable.

**Fix:** Show short text labels (1-2 words) on mobile for the main nav tabs. Either reduce the tab count to show 5 most important tabs with labels, or use a bottom navigation bar pattern on mobile.

---

### Bug 4: Workout Logger — Header Overlaps Content on Mobile
**Severity: Medium**

When in an active workout session on mobile, the top section of the active workout (week strip, workout name, Finish button) is compressed against the top navigation. The "Full Body" session header shows correctly but the Vault logo header takes up significant vertical space, leaving only ~60% of the screen for actual workout logging.

---

### Bug 5: Program "Start Logging" — Stale Session from Feb 9
**Severity: Critical**

There is a "Full Body" workout session from February 9 that is still marked as incomplete in the database. This directly causes Bug 1. The fix requires either canceling this workout from the admin side, or implementing auto-abandonment of stale sessions (older than 24h).

---

## UX Issues — Should Fix for Launch

### Issue 1: The Main Navigation Has Too Many Tabs
The Vault tab bar currently has 8 tabs for regular users (9 for admin):
Dashboard | Library | Progress | Lifestyle | Workouts | Podcast | Community | Tracks | Admin

On a 1440px desktop, this fits. On a 768px tablet, it starts to crowd. On mobile, labels disappear entirely.

**Recommendation:** Consolidate or reorganize:
- **Primary tabs (always visible):** Dashboard, Workouts, Library, Community
- **Secondary tabs (under a "More" menu or at bottom):** Progress, Lifestyle, Podcast, Tracks

---

### Issue 2: The Dashboard "Training" Card Says "Rest Day" Every Day
The TRAINING card shows "Rest Day / Last: Feb 10" but the user is enrolled in programs. This is because the dashboard only shows "Rest Day" when no program workout is scheduled for today — but if the program switcher was the only indicator, removing it from the Dashboard left a gap. Users now have no quick way to know from the Dashboard whether they have a workout today.

**Recommendation:** The TodaySnapshot Training card should explicitly say the program workout name if one is scheduled (e.g. "Wendler 5/3/1 — Squat Day") rather than just "Rest Day."

---

### Issue 3: "Apply for 1-on-1 Coaching" Button Appears Twice Prominently
The Vault Dashboard header shows the gold "Apply for 1-on-1 Coaching" button in a very prominent position, directly under the logo. This is also repeated in the Tracks tab. For a first-time user, this is the first thing they see after the logo — before they even understand what the app does. It feels like an upsell before orientation.

**Recommendation:** Move the coaching CTA to the bottom of the Dashboard or make it a smaller secondary link in the header.

---

### Issue 4: Onboarding Walkthrough Fires Every Login
The onboarding walkthrough dialog pops up on every visit to the Vault. There appears to be no persistent "seen" flag to suppress it after the first viewing. Users who skip it once will see it again next time they visit.

**Recommendation:** Store a flag in localStorage or the database so the walkthrough only shows once per user.

---

### Issue 5: The Workouts Sub-Tab Labels are Unclear
Inside the Workouts section, the three sub-tabs are: "Log Workout", "Calendar", "Dashboard". Having a section called "Dashboard" inside a tab already within The Vault is confusing — it looks like a navigation error. Users may not understand this is an analytics view.

**Recommendation:** Rename "Dashboard" to "Analytics" or "Stats" to distinguish it clearly from the main Dashboard tab.

---

### Issue 6: No Logo Visible on Mobile Tab Bar
On mobile, the tab bar shows 9 icon-only buttons in a small horizontal row at the top. There is no visual hierarchy — all icons are the same size and color (muted, not highlighted) except the active one. New users have no landmark or grouping.

---

### Issue 7: Community Tab — Mobile Hamburger Not Discoverable
On mobile, the community section has a hamburger icon to access channels. The channel name next to it reads "Community" which is redundant since users just tapped a Community tab. The pattern works, but the hamburger lacks a label, making it non-obvious that it opens channel selection.

---

### Issue 8: Progress Tab — "Scans" Tab is Always Empty for New Users
The Progress tab has three sub-tabs: Weight, Measurements, Scans. The Scans tab shows "No scan data yet" with an empty state. For most users who don't have DEXA/InBody data, this tab will never have content. It should either be hidden until there's data, or replaced with something more broadly useful (e.g., body fat % trend from manual entry).

---

### Issue 9: Tracks Tab — Foundation Track Sends Users to External Site
The "Foundation Track" card has a button "Join on CoachRx" that opens an external link to `dashboard.coachrx.app`. This takes the user completely out of the app. New users will be confused: they just enrolled in "The Vault" and are being redirected to another platform.

**Recommendation:** Add clarity copy like "Your Foundation Track programming is hosted on CoachRx" and consider whether the internal program system (Wendler, FBB) is a separate offering from CoachRx.

---

### Issue 10: The "Finish" Button on Active Workout Saves Even With 0 Exercises
The Finish button is disabled when `exercises.length === 0`, which is correct. However the workout was created in the database the moment "Start Workout" was tapped. If the user then navigates away or cancels without finishing, a ghost empty workout entry remains in the database and will show up as a day dot in the activity heatmap, inflating their stats.

---

## Honest Feature Review

### What Works Well
- **The Performance Audit** is the standout feature. The multi-step form is clean, the 1RM estimator is a thoughtful touch, the Leaks concept is original and compelling, and the AI Recap with markdown formatting gives a premium feel.
- **The Breathwork Module** is polished. The session timer, phase audio tones, and Wim Hof implementation are genuinely impressive.
- **The Community Feed** is well-structured. The Discord-style channels/DMs layout works perfectly on desktop.
- **The Design System** is high quality. The dark theme, cyan primary color, glow effects, and ELITE/data badge variants create a consistent premium look.
- **The Workout Logger** has a solid core: set rows, RPE tracking, weight entry popup, last-session autofill, PR detection, and the heatmap are all well-implemented.

### What Needs Work Before Launch

1. **Information Architecture is too complex.** 9 tabs, each with sub-tabs, is overwhelming. The app is better described as: Audit → Dashboard → Train → Eat → Move → Learn. The current structure doesn't reflect that mental model.

2. **The program training loop has a fragile state bug.** One incomplete session from Feb 9 has broken the primary training workflow. There needs to be session expiry/cleanup logic.

3. **The Nutrition page** (`/nutrition`) is a separate route that's linked in the navbar but doesn't appear to connect back to the Vault's nutrition data. Users who hit Nutrition from the nav may feel they're in a different app.

4. **First-time user experience.** A new user landing on `/vault` sees: a walkthrough dialog → a coaching upsell button → 9 incomprehensible icon tabs → "Rest Day" → scrolling announcements. There is no clear "start here" path. The Audit is the entry point to the whole system but it's not surfaced inside the Vault at all.

5. **Mobile is functional but not optimized.** The app was clearly designed desktop-first. Key improvements needed: sticky bottom navigation bar for mobile, larger touch targets on set rows, and label text on all tabs.

---

## Fixes Planned

### Part 1: Critical Bug Fixes
1. **Auto-abandon stale active workouts** — In `fetchActiveWorkout()`, if the active workout's date is before today, automatically mark it `is_completed = true` (treating it as abandoned) and clear `activeWorkout` from state. This unblocks the logging flow immediately.
2. **Fix Badge `ref` warning** — Wrap the `Badge` component with `React.forwardRef()` in `badge.tsx`.

### Part 2: UX Improvements
3. **Add mobile tab labels** — Show short labels below icons on mobile (2-letter max: "Log", "Cal", "Stats") or reveal labels on all screen sizes with a smaller font and icon size.
4. **Rename Workouts sub-tab "Dashboard" → "Analytics"** — Prevents confusion with the main Dashboard tab.
5. **Onboarding walkthrough once per user** — Store `vault_onboarding_seen` in `localStorage` after the first skip/complete, so it never fires again for returning users.
6. **Dashboard Training card** — Wire it to show today's program workout name (e.g., "Wendler — Squat Day") when one is scheduled, instead of always showing "Rest Day."
7. **Reduce coaching CTA prominence** — Make the "Apply for 1-on-1 Coaching" button smaller and secondary in the header.

### Part 3: Nice-to-Have
8. **Empty Scans tab** — Hide the Scans tab until the user has scan data, defaulting to Weight tab.
9. **Cancel button styling** — Make the back arrow (cancel session) more clearly labeled as "Cancel" on desktop to prevent accidental taps.

---

## Summary Priority List

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | Stale active workout blocks Workouts tab | Critical | Low |
| 2 | Mobile tabs icon-only — no labels | High | Low |
| 3 | Onboarding fires every login | High | Low |
| 4 | Workouts sub-tab called "Dashboard" | Medium | Trivial |
| 5 | Training card shows "Rest Day" when program is scheduled | Medium | Medium |
| 6 | Coaching CTA is too prominent | Medium | Trivial |
| 7 | Badge ref warning in console | Low | Low |
| 8 | Empty Scans tab not hidden | Low | Trivial |
