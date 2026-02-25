

# Plan: Admin Workout Builder, Workout Notes, and Video Refinement

## Overview

Three interconnected changes: (1) admin can create/edit workouts for any user from their profile page, (2) a notes field at the bottom of each workout session, (3) refinement of the exercise video feature.

---

## 1. Admin Workout Builder on User Profile

**What you get:** From the admin user profile page (`/admin/user/:userId`), you can create a new workout for that user, add exercises, log sets with weights/reps, and add notes. The data writes directly to the user's `workouts`, `workout_exercises`, and `exercise_sets` tables using the service role (via a new edge function). Changes appear on the client's end immediately.

### Architecture

The admin cannot use the regular `workoutStore` because RLS restricts writes to the authenticated user's own rows. Instead, a new edge function `admin-workout-builder` handles all CRUD operations on behalf of the target user using the service role key.

**New edge function: `supabase/functions/admin-workout-builder/index.ts`**

Accepts these actions:
- `create_workout` -- creates a workout row for target user (name, date)
- `add_exercise` -- adds a workout_exercise to a workout
- `add_set` -- adds an exercise_set
- `update_set` -- updates weight/reps/completion on a set
- `remove_exercise` -- deletes a workout_exercise
- `finish_workout` -- marks workout as completed
- `update_notes` -- updates workout-level notes
- `get_workout_detail` -- fetches full workout with exercises and sets

All actions verify the caller is an admin via `user_roles`.

**New component: `src/components/admin/AdminWorkoutBuilder.tsx`**

A self-contained workout builder UI embedded in the AdminUserProfile page:
- "Build Workout" button opens a card/dialog
- Name the workout + pick a date
- Exercise search (queries `exercise_library` table for admin-curated exercises)
- For each exercise: add sets with weight/reps fields, complete button
- Notes textarea at the bottom
- "Save & Complete" button finishes the workout
- All operations go through the edge function, not the client-side store

**Changes to `src/pages/AdminUserProfile.tsx`**
- Import and render `AdminWorkoutBuilder` in the Training section
- Pass `userId` and user's display name as props

### Data Flow

```text
Admin taps "Build Workout" on user profile
  → AdminWorkoutBuilder renders inline
  → Each action calls admin-workout-builder edge function
  → Edge function uses service role to write to user's tables
  → Client user sees the workout in their history on next load
```

No database schema changes needed. The existing `workouts`, `workout_exercises`, and `exercise_sets` tables already support this -- the edge function just writes with the target user's ID instead of the admin's.

---

## 2. Workout Notes Section

**What users see:** A notes textarea at the bottom of the active workout logger (above the session stats footer). Users can type session notes -- how they felt, adjustments made, coaching cues. Notes persist to the `workouts.notes` column which already exists.

### File Changes

**`src/components/workout/WorkoutLogger.tsx`**
- Add a `Textarea` component below the exercise cards and above the session stats footer
- The textarea reads from `activeWorkout.notes` and writes via a debounced update to the `workouts` table
- Label: "Session Notes" with a small icon (StickyNote or FileText)
- Placeholder: "How did training feel today? Any notes for your coach..."

**`src/stores/workoutStore.ts`**
- Add `updateWorkoutNotes: (notes: string) => void` action
- Debounced write to `supabase.from('workouts').update({ notes }).eq('id', activeWorkout.id)`

**`src/components/workout/WorkoutHistoryView.tsx`**
- Display `workout.notes` in the history view if it exists, in a subtle card below the workout header

---

## 3. Exercise Video -- CoachRx-Style Simplification

The current video implementation is already close to CoachRx's pattern (collapsible embed in exercise card). The CoachRx domain is no longer active so I can't inspect their exact UI, but based on standard coaching app patterns and your description, the refinement is:

**Current state:** The Demo button is tiny (`text-[10px]`) and tucked next to the set count. The video iframe loads a full YouTube embed.

**Refinements to `src/components/workout/ExerciseCard.tsx`:**
- Make the video button more visible: move it to the right side of the header row as a small icon button (Play circle icon), same prominence as the kebab menu
- When tapped, the video section slides in below the header with a clean 16:9 embed -- this is already implemented and works well
- No functional changes needed, just the button placement/sizing adjustment

This is a minor polish -- the core architecture is already correct. The exercise library remains the single source of truth.

---

## Summary of File Changes

| File | Change |
|------|--------|
| `supabase/functions/admin-workout-builder/index.ts` | **New** -- edge function for admin CRUD on user workouts |
| `src/components/admin/AdminWorkoutBuilder.tsx` | **New** -- workout builder UI for admin user profile |
| `src/pages/AdminUserProfile.tsx` | Add AdminWorkoutBuilder to training section |
| `src/components/workout/WorkoutLogger.tsx` | Add notes textarea below exercises |
| `src/stores/workoutStore.ts` | Add `updateWorkoutNotes` action |
| `src/components/workout/WorkoutHistoryView.tsx` | Display workout notes in history view |
| `src/components/workout/ExerciseCard.tsx` | Adjust video button placement for better visibility |

No database migrations needed. The `workouts.notes` column and all required tables already exist.

