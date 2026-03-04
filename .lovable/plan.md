

# Root-Cause Analysis & Permanent Fix Plan

## Bug 1: Assault Bike (Conditioning) Data Not Displaying

**Root Cause — `fetchWorkoutByDate` (line 158-162 of workoutStore.ts)**

The query that loads completed workouts for calendar/history view is:
```
.select('*, sets:exercise_sets(*)')
```

This **does not join `conditioning_sets`**. When the calendar view loads a completed assault bike workout, `conditioning_sets` is always `[]` because the data was never fetched. The `WorkoutHistoryView` component correctly renders conditioning data (lines 110-138), but the data is never provided.

Compare with `fetchActiveWorkout` (line 771-774) and `editWorkout` (line 632-636) which both correctly use:
```
.select('*, sets:exercise_sets(*), conditioning_sets:conditioning_sets(*)')
```

**Fix**: Add `conditioning_sets:conditioning_sets(*)` to the `fetchWorkoutByDate` select query on line 160.

---

## Bug 2: Client Directory / Drawer Scroll Failure on Mobile

**Root Cause — `AdminDetailDrawer.tsx` line 601 & 610**

The previous fix applied `flex flex-col overflow-hidden` to `SheetContent` and `flex-1 overflow-y-auto` to the content div. Looking at the screenshot, the Client Directory IS scrolling (user captured 5+ clients). However, the `users` section content wrapper on line 285 adds its OWN `overflow-y-auto` div, creating a **nested scroll container** that fights with the parent.

**Fix**: Remove the redundant `overflow-y-auto overscroll-y-contain` from the inner `users` content div (line 285) since the parent flex container at line 610 already handles scrolling.

---

## Bug 3: Private Coaching Toggle Resetting After Navigation

**Root Cause — `AdminUserProfile.tsx` lines 87-106 & 115-119**

The `toggle_coaching` edge function works correctly (confirmed in code review — line 76-80 of edge function). The problem is the **data loading lifecycle**:

1. Admin toggles coaching ON → optimistic state sets `privateCoaching = true` → edge function updates DB ✓
2. Admin navigates away and returns → `useEffect` on line 87 fires, calling `admin-user-profile` edge function
3. The `admin-user-profile` function fetches profile data which includes `private_coaching_enabled`
4. `useEffect` on line 115-119 syncs: `setPrivateCoaching(!!data.profile.private_coaching_enabled)`

The issue is likely that the `admin-user-profile` edge function is returning **stale/cached data** or not reading the `private_coaching_enabled` field at all.

**Fix**: Inspect the `admin-user-profile` edge function to ensure it returns `private_coaching_enabled` from `user_profiles`. If it does, the toggle should work. If the field isn't being returned, add it to the profile select query in the edge function.

---

## Bug 4: Admin Library Tabs Overflowing on Mobile

**Root Cause — `AdminPanel.tsx` lines 271-287**

The `TabsList` contains 4 tabs (Resources, Podcasts, Programs, Exercises) with no horizontal scroll. On mobile, this overflows the container width, causing content to be clipped or break the layout (visible in screenshot — tabs are cut off at "Exe...").

**Fix**: Wrap the `TabsList` in a horizontal scroll container or apply `overflow-x-auto` with `w-full` and ensure tabs don't wrap. Use `className="w-full overflow-x-auto"` on the `TabsList`.

---

## Implementation Summary

| # | File | Line(s) | Change |
|---|------|---------|--------|
| 1 | `src/stores/workoutStore.ts` | 160 | Add `conditioning_sets:conditioning_sets(*)` to select |
| 2 | `src/components/admin/AdminDetailDrawer.tsx` | 285 | Remove nested `overflow-y-auto` from users content div |
| 3 | `supabase/functions/admin-user-profile/index.ts` | TBD | Verify `private_coaching_enabled` is in profile select; if missing, add it |
| 4 | `src/components/vault/AdminPanel.tsx` | 272 | Add `overflow-x-auto` to TabsList for horizontal scroll |

