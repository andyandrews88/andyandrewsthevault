

# Plan: Interactive Package Card → Session Breakdown Drawer

## Recommendation

A **bottom drawer** (using the existing `vaul` Drawer component) is the best fit here. It's native-feeling on mobile, doesn't navigate away from the dashboard, and avoids the clunkiness of a full page or a modal popup. The user taps the package card, a drawer slides up showing a clean session timeline for that package.

## What it does

When the user taps the active package card, a Drawer opens showing:
- **Package header** — name, date range, sessions used/total with progress bar (compact repeat of the card info)
- **Session timeline** — a vertical list of all sessions linked to that package (`pt_sessions` where `package_id = activePackage.id`), each showing:
  - Date (formatted nicely)
  - Linked workout name (if `workout_id` exists, fetch from `workouts` table)
  - Coach notes
  - A subtle timeline connector line between sessions for visual flow
- If no sessions yet, a friendly empty state

## Changes

**File: `src/components/dashboard/PrivateCoachingPanel.tsx`**

1. Add `Drawer, DrawerContent, DrawerHeader, DrawerTitle` imports from `vaul`
2. Add `drawerOpen` state
3. Make the active package `Card` clickable — wrap with `onClick={() => setDrawerOpen(true)}` and add cursor-pointer + hover effect
4. Add a small "Tap to view sessions" hint text below the progress bar
5. Render a `Drawer` component that:
   - Filters sessions by `package_id === activePackage.id` (so it shows only sessions for the tapped package)
   - Fetches linked workout names by joining `workout_id` against already-loaded data or a lightweight query
   - Displays sessions as a vertical timeline with date, workout name, and notes
   - Shows the package progress summary at the top of the drawer

No new files needed. No database changes needed — `pt_sessions` already has `package_id` and `workout_id` columns, and the client already has RLS SELECT access.

