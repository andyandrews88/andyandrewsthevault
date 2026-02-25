

# Plan: Fix Admin Workout Builder + Add Workout Template Duplication

## Root Cause (Why Everything is "Dead")

The edge function `admin-workout-builder/index.ts` returns responses WITHOUT setting `Content-Type: application/json` in the headers. The `corsHeaders` object only contains CORS headers. As a result:

1. `supabase.functions.invoke()` receives the response as `text/plain` (confirmed in network: `content-type: text/plain;charset=UTF-8`)
2. The Supabase SDK does NOT auto-parse text/plain as JSON -- it returns the raw string
3. `data.id` is `undefined` because `data` is a string like `'{"id":"ae28a7a3-...",...}'`
4. `setWorkoutId(data.id)` sets workoutId to `undefined`/`null`
5. Every subsequent call (`handleAddExercise`, `handleAddSet`, etc.) checks `if (!workoutId) return;` and silently bails out

This is a one-line fix that unblocks the entire feature.

## File Changes

### 1. `supabase/functions/admin-workout-builder/index.ts` -- CRITICAL FIX

Add `Content-Type: application/json` to the `corsHeaders` object:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ...",
  "Content-Type": "application/json",  // <-- THIS FIXES EVERYTHING
};
```

This single change makes `supabase.functions.invoke()` parse the response as JSON, giving back the actual object with `data.id`, `data.exercise_name`, etc. All downstream operations (add exercise, add set, update set, finish) will then work because `workoutId` will be correctly set.

### 2. `src/pages/AdminWorkoutBuilderPage.tsx` -- Defensive JSON parsing + Duplication feature

Add defensive parsing as a safety net in case `data` comes back as a string:

```typescript
async function invokeBuilder(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-workout-builder", { body });
  if (error) throw error;
  return typeof data === "string" ? JSON.parse(data) : data;
}
```

Also add the workout template duplication feature:
- Add a "Duplicate from Previous" button next to "Add Exercise" that shows a list of the user's completed workouts
- When selected, load the workout detail via `get_workout_detail` and pre-populate all exercises and sets
- Each exercise and set gets created via the existing `add_exercise` and `add_set` edge function actions

### 3. `src/components/admin/AdminWorkoutBuilder.tsx` -- Add duplication option

Add a "Clone Previous" button option in the dialog alongside the name/date picker. When clicked, show a small list of recent workouts (fetched via `get_user_workouts` action). Selecting one pre-fills the workout name and navigates to the builder with a `cloneFrom=<workoutId>` query param.

### 4. `src/pages/AdminWorkoutBuilderPage.tsx` -- Clone flow

On mount, if `cloneFrom` query param exists:
1. Create the new workout via `create_workout`
2. Fetch the source workout via `get_workout_detail`
3. For each exercise in the source, call `add_exercise` then `add_set` for each set (copying weight/reps/rir values)
4. Pre-populate the local state with all cloned exercises and sets

## Summary

| File | Change |
|------|--------|
| `supabase/functions/admin-workout-builder/index.ts` | Add `Content-Type: application/json` to headers (the actual fix) |
| `src/pages/AdminWorkoutBuilderPage.tsx` | Defensive JSON parse + clone workout flow |
| `src/components/admin/AdminWorkoutBuilder.tsx` | Add "Clone Previous" option with workout list |

