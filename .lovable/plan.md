

# Four-Part Update: Landing Page + Retroactive Workout Logging

This covers all four requests in a single implementation pass.

---

## Part 1: "What Is The Vault?" Section (Landing Page)

Add a dedicated section between the Hero and the existing "Meet Andy" section that explains the app's purpose and differentiators in a scannable format.

**New file:** `src/components/landing/WhatIsTheVaultSection.tsx`

Content structure:
- Headline: "What Is The Vault?"
- 3-column layout with icons highlighting the core differentiators:
  - "Coach-Built, Not Tech-Built" -- designed from a decade of coaching, not by a product team
  - "One Place, Everything Connected" -- training, nutrition, lifestyle all feeding into each other
  - "Free. No Paywall on the Basics." -- no hidden costs for core functionality
- A short paragraph reinforcing the first-principles philosophy

**Modified file:** `src/pages/Index.tsx` -- insert `<WhatIsTheVaultSection />` between `<HeroSection />` and `<MeetAndySection />`

---

## Part 2: Features Section with Interactive Cards (Landing Page)

Replace the current static feature list inside `MeetAndySection` with a richer, interactive "Features" section that links directly into the Vault tabs.

**New file:** `src/components/landing/FeaturesSection.tsx`

- 6 feature cards in a responsive grid (2 cols mobile, 3 cols desktop)
- Each card includes: icon, title, 2-line description, and a "Try It" link that navigates to `/vault` with the correct tab (using URL or in-app state)
- Modules covered:
  1. Workout Tracker -- log sessions, track PRs, visualize volume
  2. Nutrition -- macro calculator, barcode scanning, meal plans
  3. Progress Tracking -- bodyweight, body comp, measurements
  4. Lifestyle & Readiness -- daily check-ins, readiness scores
  5. Guided Breathwork -- 5 protocols with visual/audio guidance
  6. Knowledge Bank -- curated coaching resources

**Modified file:** `src/pages/Index.tsx` -- add `<FeaturesSection />` after the "What Is The Vault?" section

The existing `MeetAndySection` stays as-is (the philosophy + "Why it exists" story) but its small feature list is kept as a lighter summary since the new section handles the detailed breakdown.

---

## Part 3: New-User Onboarding Walkthrough

A lightweight, dismissible onboarding overlay that appears when a user first enters the Vault. It steps through the key modules with brief descriptions.

**New file:** `src/components/vault/OnboardingWalkthrough.tsx`

- A multi-step modal/dialog (not a full-page takeover) with 6 steps
- Each step shows: module name, icon, 1-2 sentence description of what it does and why
- Steps: Dashboard, Workouts, Nutrition, Progress, Lifestyle/Breathwork, Knowledge Bank
- Navigation: Back / Next / Skip buttons, dot indicators for progress
- On completion or skip, sets a flag in localStorage (`vault_onboarding_complete`) so it only shows once
- Clean, minimal design consistent with the existing UI

**Modified file:** `src/pages/Vault.tsx` -- render `<OnboardingWalkthrough />` at the top of the component, gated by the localStorage check

---

## Part 4: Retroactive Workout Logging (Critical Fix)

Currently, the "Start Workout" button only appears when `selectedDate` is today. When viewing a past date with no workout, users see a dead-end "No Workout" message. This fix allows starting a workout for any past date.

### Changes to `src/components/workout/WorkoutLogger.tsx`:

1. Remove the condition that restricts "Start Workout" to today only
2. Show the "Start Workout" card for any date (past or today) that has no existing workout and no active workout in progress
3. Pass `selectedDate` to `startWorkout` so the workout is created with the correct date

### Changes to `src/stores/workoutStore.ts`:

1. Modify `startWorkout` to accept an optional `date` parameter (defaults to today)
2. Use that date in the database insert instead of hardcoded `new Date()`

### Changes to `src/components/workout/WorkoutLogger.tsx` (detail):

- The empty-state card at lines 244-256 (past dates with no workout) gets merged with the "Start Workout" card at lines 187-237
- Both past dates and today show the same "Start Workout" prompt when no workout exists
- The date shown in the dialog changes to reflect the selected date so users know what day they're logging for

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/landing/WhatIsTheVaultSection.tsx` | Create | "What Is The Vault?" explainer section |
| `src/components/landing/FeaturesSection.tsx` | Create | Interactive feature cards with Vault links |
| `src/components/vault/OnboardingWalkthrough.tsx` | Create | First-time user walkthrough modal |
| `src/pages/Index.tsx` | Modify | Add new landing page sections |
| `src/pages/Vault.tsx` | Modify | Add onboarding walkthrough |
| `src/stores/workoutStore.ts` | Modify | Accept date param in `startWorkout` |
| `src/components/workout/WorkoutLogger.tsx` | Modify | Allow starting workouts on past dates |

No database changes required. No new dependencies.

