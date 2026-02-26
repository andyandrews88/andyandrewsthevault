

# Plan: Persistent Workout Access + Video Controls + Pro Coaching Interface

## Problem 1: Workouts Disappear After Finishing

Currently, once a workout is finished (`is_completed = true`), there is no way to reopen or edit it. The workout table in the admin user profile shows workout names but they are not clickable. The builder always creates a **new** workout on mount — there is no "load existing" path.

### Fix

**Make workout rows clickable** in `AdminUserProfile.tsx`. Clicking a past workout navigates to the builder in **edit mode** using `?edit=<workoutId>`.

**Add edit mode to `AdminWorkoutBuilderPage.tsx`**:
- If `edit` query param is present, skip `create_workout` and instead call `get_workout_detail` to load the existing workout's exercises and sets into local state.
- "Finish" in edit mode calls `finish_workout` again (re-marks as completed) and saves any changes.
- "Reopen" toggle — admin can mark a workout as incomplete to signal the client it's still in progress.

**Edge function changes** (`admin-workout-builder/index.ts`):
- Add `reopen_workout` action: sets `is_completed = false` on a workout.
- Modify `get_user_workouts` to also return incomplete workouts (remove the `is_completed = true` filter, or add an optional `includeIncomplete` param).

---

## Problem 2: Videos Never Show

Videos only appear if the `exercise_library` table has a matching row with a `video_url`. That table currently has **0 rows**. The admin must manually populate it via the Exercise Library Admin panel before any videos surface — which is impractical when building workouts.

### Fix

**Add inline video URL editing per exercise in the admin workout builder**. Each exercise card in the builder gets:
- A **video icon button** in the header (always visible, not conditional on existing video).
- Clicking it expands a section with:
  - An input field for the video URL (pre-filled if one exists in `exercise_library`).
  - A "Save" button that upserts the URL into `exercise_library`.
  - If a URL is set, shows the 16:9 video embed below.

**Edge function changes**:
- Add `upsert_exercise_video` action: checks if the exercise name exists in `exercise_library`. If yes, updates `video_url`. If no, inserts a new row with the exercise name + video URL.

**Flow**: Admin builds workout → adds "Bench Press" → clicks video icon → pastes YouTube URL → saves → video embed appears instantly. Next time any user does Bench Press, the video will show in their workout logger too.

---

## Problem 3: Interface Design

The user referenced "Strength Book" (now defunct). Based on the best coaching platforms (TrainHeroic, TrueCoach, Strong), the key patterns missing are:

| Pattern | Current State | Improvement |
|---------|--------------|-------------|
| Clickable workout history | Static table rows | Rows navigate to editable builder |
| Video per exercise | Hidden (empty library) | Inline edit + preview in builder |
| Exercise card expansion | No expand/collapse | Click header to show video + notes |
| Coach cue visibility | Tiny input at bottom | Prominent coach notes section |
| Workout status indicator | No visual distinction | Badge showing "Draft" vs "Completed" |

### UI Changes in `AdminUserProfile.tsx`

- Workout table rows become clickable with hover state and a small "Edit" icon.
- Add status badge per workout: "Completed" (green) or "In Progress" (amber).
- Include both completed and in-progress workouts in the list.

### UI Changes in `AdminWorkoutBuilderPage.tsx`

- Each exercise card header gets a persistent video icon (not conditional).
- Exercise header is clickable to expand a video section with URL input + live preview.
- Coach cue input is more prominent with better labeling.
- Header shows "Editing: Upper Body A" when in edit mode vs "Building: Upper Body A" for new.

---

## File Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/admin-workout-builder/index.ts` | Add `upsert_exercise_video` and `reopen_workout` actions. Update `get_user_workouts` to support `includeIncomplete` param. |
| `src/pages/AdminWorkoutBuilderPage.tsx` | Add edit mode (load existing workout via `?edit=workoutId`). Add inline video URL editing per exercise card with embed preview. |
| `src/pages/AdminUserProfile.tsx` | Make workout table rows clickable → navigate to builder in edit mode. Show both completed and incomplete workouts with status badges. |
| `src/components/admin/AdminWorkoutBuilder.tsx` | No structural changes needed — it already navigates to the builder page. |

No new database tables or migrations required. The `exercise_library` table already has the `video_url` column. The edge function uses `serviceClient` which bypasses RLS.

