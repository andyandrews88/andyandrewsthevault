

# Comprehensive Onboarding Redesign

## The Problem

The current onboarding is a 6-step feature list inside a small dialog. It tells users what each tab does but never explains:

- Why logging data matters (the AI reads all of it)
- How features connect to each other (check-in notes influence the weekly review)
- What the user gets back in return for the effort of filling things in
- The "everything feeds the AI coach" loop that makes The Vault different from other apps

## The New Approach

Replace the current 6-step feature tour with a **narrative onboarding** that follows a "Input -> Intelligence -> Insight" structure. Instead of listing tabs, it explains the system — why every input matters.

### New Step Structure (8 steps)

**Step 1 — Welcome**
"Welcome to The Vault. This isn't a collection of separate trackers — it's one connected system. Everything you log feeds an AI coaching engine that gives you a personalized weekly performance review."

**Step 2 — The Loop (core concept)**
"Here's how it works: You log your training, nutrition, and lifestyle data throughout the week. On the Dashboard, your AI coach pulls all of it together into a single review — with specific feedback on what's working, what needs attention, and what to focus on next."

A simple visual showing: Log Data -> AI Analyzes -> You Get Coached -> Adjust -> Repeat

**Step 3 — Daily Check-In (why it matters)**
"Start each day with a 30-second check-in. Rate your sleep, stress, energy, and drive — these generate your Readiness Score. But the real power is in the notes field. Write what's going on: 'bad sleep, lower back tight, stressed about work.' The AI reads every note and connects the dots you might miss."

**Step 4 — Training (what gets tracked)**
"Log your strength and conditioning work. The app tracks volume, PRs, and trends automatically. If you add RIR (Reps in Reserve) to your sets, the AI can tell whether you're pushing too hard or leaving too much in the tank — and adjust its recommendations."

**Step 5 — Nutrition and Progress**
"Track your macros, scan barcodes, and log bodyweight. The AI uses weight trends and nutrition data to spot patterns — like whether a calorie deficit is affecting your training performance."

**Step 6 — The Weekly Review**
"Every week, the AI pulls together your training volume, conditioning work, readiness scores, check-in notes, bodyweight trends, and RIR data into a single coaching review. The more you log, the smarter and more specific the feedback gets. This is why every input matters."

**Step 7 — The More You Log, The Better It Gets**
"You don't have to fill in everything on day one. But the more data the AI has, the better it can coach you. Notes on your check-ins are especially valuable — they give the AI context that numbers alone can't provide."

**Step 8 — Get Started**
"Head to the Lifestyle tab to do your first Daily Check-In. Start building the data that powers your coaching."

### UI Improvements

- Increase the dialog size from `max-w-md` to `max-w-lg` for breathing room
- Add a subtle icon illustration for each step (reuse existing lucide icons)
- Add a "pro tip" callout on the check-in step highlighting the notes field
- The loop diagram on Step 2 uses a simple row of icons with arrows (not an image — built with Tailwind and lucide icons)
- Final step has a direct CTA button: "Do Your First Check-In" that dismisses the walkthrough and switches to the Lifestyle tab

### Resettable Onboarding

- Add a "Replay Onboarding" button somewhere accessible (e.g., in the notification settings dropdown or a small link in the dashboard header)
- This clears the `vault_onboarding_complete` localStorage key and reopens the walkthrough

## Technical Details

### Files Changed

| File | Change |
|------|--------|
| `src/components/vault/OnboardingWalkthrough.tsx` | Complete rewrite of the steps array with narrative content. Wider dialog. Loop diagram component. "Do Your First Check-In" CTA on final step. |
| `src/pages/Vault.tsx` | Pass a callback to OnboardingWalkthrough so the final CTA can switch the active tab to "lifestyle" |
| `src/components/vault/NotificationSettings.tsx` | Add a "Replay Onboarding" menu item that clears localStorage and triggers the walkthrough |

### OnboardingWalkthrough.tsx Changes

- Replace the 6 generic steps with 8 narrative steps (content above)
- Each step gets an `icon`, `title`, `description`, and optional `tip` field
- Step 2 gets a custom `diagram` component — a row of 4 icon circles connected by arrows:
  ```
  [Log] -> [AI Analyzes] -> [You Get Coached] -> [Adjust]
  ```
  Built with flex layout and lucide icons (Dumbbell, Brain, MessageSquare, RefreshCw)
- Dialog widened to `max-w-lg`
- Final step button changes from "Get Started" to "Do Your First Check-In" and calls `onComplete?.("lifestyle")` to switch tabs
- Accept an `onComplete` prop: `(tab?: string) => void`

### Vault.tsx Changes

- Pass `onComplete` to `OnboardingWalkthrough` that programmatically sets the active tab
- Convert from uncontrolled `defaultValue` to controlled `value` state on the Tabs component so the tab can be switched programmatically

### NotificationSettings.tsx Changes

- Add a "Replay Walkthrough" button/menu item
- On click: remove `vault_onboarding_complete` from localStorage and reload the page (or use a state callback to reopen the dialog)
