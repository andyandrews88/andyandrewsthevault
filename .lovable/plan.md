

# Plan: Enhance Private Coaching Panel — 3 Features

## Current State
The `PrivateCoachingPanel.tsx` already has a drawer with a session timeline showing dates, workout names, and notes. The data fetching for workout names is already in place. However, there are three gaps:

1. **Workout names and notes ARE already showing** in the drawer timeline (lines 227-236), but the "Recent Sessions" table at the bottom only shows date + notes, not the workout name. The drawer itself does show both — if the data exists. The issue may be that no sessions have `workout_id` set, or the workouts query is failing due to RLS (the client can only see their own workouts, which should work).

2. **No invoice visibility for the client** — `pt_invoices` has no client SELECT RLS policy, so clients can't see invoices at all. Need a migration + UI.

3. **No way to tap a session and see workout details** — needs a mini workout summary popup.

## Changes

### 1. Add RLS policy for client invoice access
**Migration:** Add SELECT policy on `pt_invoices` for clients:
```sql
CREATE POLICY "Clients can view their own invoices"
ON public.pt_invoices FOR SELECT TO authenticated
USING (auth.uid() = client_user_id);
```

### 2. Update `PrivateCoachingPanel.tsx`

**Fetch invoices** alongside packages and sessions. Add `pt_invoices` query filtered by `client_user_id`.

**Fetch full workout data** (exercises + sets) when a session is tapped. Store in state and show in a small dialog.

**Session timeline enhancements:**
- Each session entry becomes tappable
- When tapped, open a compact `Dialog` showing:
  - Session date and coach notes
  - Linked workout summary (exercise names, sets x reps x weight) fetched on-demand from `workout_exercises` + `exercise_sets`
  - If an invoice is linked to the same package, show a "View Invoice" button that opens the `invoice_url` in a new tab

**Invoice section in drawer:**
- Below the session timeline, add a small "Invoices" section if any invoices exist for the active package
- Each invoice shows date, amount, status badge, and a "Pay / View" button linking to `invoice_url`

### File changes

| File | Change |
|------|--------|
| `src/components/dashboard/PrivateCoachingPanel.tsx` | Add invoice fetch, tappable sessions with workout summary dialog, invoice section in drawer |
| Migration | Add `pt_invoices` client SELECT policy |

### UI approach (not clunky)
- Sessions remain as timeline items — just add a subtle chevron or tap indicator
- Tapping a session opens a **compact Dialog** (not a new page) with the workout breakdown
- Invoices appear as small cards at the bottom of the drawer — just date, amount, and a "View Invoice" button
- Everything stays within the existing drawer flow

