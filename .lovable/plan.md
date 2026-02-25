

# Plan: World-Class Full-Page Admin Workout Builder

## Root Cause of Current Failures

1. **Exercise dropdown shows nothing**: The exercise library table has **0 rows**. The builder queries `exercise_library` for its dropdown. Empty table = empty dropdown = nothing to add.
2. **Layout is a small inline card**: The builder renders as a `Card` inside the admin profile page. For a coaching tool, this is inadequate.
3. **No fallback exercise source**: The user-facing `ExerciseSearch` component uses a hardcoded catalog of 300+ exercises from `src/types/workout.ts` (`EXERCISE_CATEGORIES`). The admin builder ignores this entirely and only queries the empty database table.

## Gap Analysis: Best-in-Class Training Apps vs. Current State

| Feature | TrainHeroic / Strong / Trainerize | Current Admin Builder | Fix |
|---------|-----------------------------------|----------------------|-----|
| Full-screen workout editor | Dedicated page/modal with sticky header | Small inline card | Full-page route |
| Exercise search | 300+ exercises, categorized, with search + custom add | Queries empty DB table | Use built-in catalog + library fallback |
| Set logging UX | Large touch targets, previous session data, quick-fill | Functional but cramped | Match user-facing ExerciseCard/SetRow quality |
| Coach notes per exercise | Rich text or structured cues | Text input exists | Keep and improve |
| Workout templates | Duplicate/clone past workouts | None | Future enhancement |
| Superset grouping | Drag to group exercises | None | Future enhancement |
| Rest timer | Configurable per exercise | None | Future enhancement |
| Video demo integration | Inline video in exercise card | Missing (empty library) | Show when library has video_url |
| Real-time sync | Instant update on client | Writes via service role, client sees on next load | Already works correctly |
| Session stats | Volume, duration, exercise count | Basic stats shown | Improve with live calculation |

## Architecture

### New dedicated page: `/admin/user/:userId/build-workout`

Instead of the current inline Card, the workout builder becomes a full-page route. This gives the coach a proper workspace with:
- Sticky header with workout name, client name, date, and action buttons
- Full-width exercise cards matching the user-facing `ExerciseCard` component quality
- The same `ExerciseSearch` dialog used by users (300+ categorized exercises with search, category pills, custom add)
- Session stats footer
- Coach notes per exercise and per workout

```text
┌──────────────────────────────────────────────────┐
│  ← Back   "Upper Body A" for Wiyan   Feb 25     │
│            3/12 sets · 4,500 kg vol    [Finish]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ BENCH PRESS (BARBELL)                      │  │
│  │ 2/3 sets completed                    🗑   │  │
│  ├────────────────────────────────────────────┤  │
│  │ Set │  Kg  │ Reps │ RIR │  ✓  │  ×  │     │  │
│  │  1  │  80  │  8   │  2  │  ●  │     │     │  │
│  │  2  │  85  │  6   │  1  │  ●  │     │     │  │
│  │  3  │  —   │  —   │  —  │  ○  │     │     │  │
│  ├────────────────────────────────────────────┤  │
│  │ Coach cue: Focus on controlled eccentric   │  │
│  │ [+ Add Set]                                │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ ROMANIAN DEADLIFT                          │  │
│  │ ...                                        │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  [+ Add Exercise]                                │
│                                                  │
│  ┌─ Coach Notes ─────────────────────────────┐  │
│  │ Session felt good, push harder next week   │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─ Session Stats ───────────────────────────┐  │
│  │  Volume: 12,500 kg  │  Exercises: 4       │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

## File Changes

### 1. `src/App.tsx`
Add new route: `/admin/user/:userId/build-workout` pointing to a new page component.

### 2. `src/pages/AdminWorkoutBuilderPage.tsx` (NEW)
Full-page component that:
- Reads `userId` from URL params
- Shows sticky header with client name, workout name, date
- Contains the workout builder logic (moved from the component)
- Uses the same `ExerciseSearch` dialog that users get (300+ exercises, categorized, with custom add)
- Each exercise renders with the same visual quality as the user-facing `ExerciseCard`
- Calls the `admin-workout-builder` edge function for all CRUD
- "Finish" saves and navigates back to admin user profile
- "Cancel" navigates back without saving

### 3. `src/components/admin/AdminWorkoutBuilder.tsx` (REWRITE)
Simplify to just a "Build Workout" button that:
- Opens a dialog to name the workout and pick a date
- On confirm, navigates to `/admin/user/:userId/build-workout?name=...&date=...`

### 4. `src/pages/AdminUserProfile.tsx`
No changes needed -- the AdminWorkoutBuilder component already renders there and will now just be a button that navigates to the full-page builder.

### 5. `supabase/functions/admin-workout-builder/index.ts`
Add `update_exercise_notes` action to persist coach cues per exercise to the `workout_exercises.notes` column. No other edge function changes needed -- the existing actions work correctly.

### Key Design Decisions

**Exercise selection**: Uses the same `ExerciseSearch` dialog that users get. This contains 300+ hardcoded exercises organized by muscle group, with category pills and custom add. Falls back to `exercise_library` table if populated. This solves the empty dropdown problem permanently.

**Set logging**: Each exercise card in the builder uses the same grid layout (`Set | Kg | Reps | RIR | ✓ | ×`) as the user-facing `ExerciseCard`. Large touch targets, clean spacing.

**Debounced saves**: Set data is saved to the backend with a 500ms debounce on blur, not on every keystroke. This reduces edge function calls.

**No new database tables or migrations needed.** All data writes to existing `workouts`, `workout_exercises`, and `exercise_sets` tables via the service role edge function.

## Summary

| File | Change |
|------|--------|
| `src/App.tsx` | Add route `/admin/user/:userId/build-workout` |
| `src/pages/AdminWorkoutBuilderPage.tsx` | **New** -- full-page workout builder for coaches |
| `src/components/admin/AdminWorkoutBuilder.tsx` | Simplify to navigation button + name/date dialog |
| `supabase/functions/admin-workout-builder/index.ts` | Add `update_exercise_notes` action |

