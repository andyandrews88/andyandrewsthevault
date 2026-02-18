# Four Changes: Program Switcher Relocation + Admin Video URLs + Exercise Library

## Summary of Changes

1. **Move Program Switcher** from the main Dashboard to the "Dashboard" tab in the Workouts section
2. **Add Video URL to Program Editor** in the Admin panel
3. **Build an Exercise Library** — a database table of exercises with video URLs, admin management UI, and a searchable dropdown in the workout builder
4. **Wire the Exercise Library into the Workout Builder** in `ProgramAdmin.tsx` so admins pick exercises from the library or create new ones inline

---

## Change 1: Move Program Switcher to Workout Tab

**What changes:**

- Remove `<ActiveProgramSwitcher />` from `src/components/dashboard/VaultDashboard.tsx`
- Add `<ActiveProgramSwitcher />` at the top of the `TabsContent value="logger"` block in `src/components/workout/WorkoutTab.tsx`, above the `<WorkoutLogger />` component

The `ActiveProgramSwitcher` already fetches its own data (enrollments + today's workouts) via its own `useEffect`, so no prop changes are needed. It renders `null` when there are no enrollments, so it won't add visual noise for unenrolled users.

**Before (WorkoutTab logger tab):**

```
<TabsContent value="logger">
  <WorkoutLogger onBack={() => {}} />
</TabsContent>
```

**After:**

```
<TabsContent value="logger">
  <ActiveProgramSwitcher />
  <WorkoutLogger onBack={() => {}} />
</TabsContent>
```

Files changed: `VaultDashboard.tsx` (remove), `WorkoutTab.tsx` (add)

---

## Change 2: Add Video URL to Programs

**Database migration required** — add a `video_url` column to the `programs` table:

```sql
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS video_url text;
```

`**ProgramEditor` in `ProgramAdmin.tsx**` — add a "Program Video URL" input field between the Description and the Category/Difficulty grid. When saved, include `video_url` in the upsert row. Update the `Program` interface in `programStore.ts` to include `video_url?: string | null`.

The field will accept any URL. When users view programs in the Tracks library (`ProgramCard.tsx` or similar), the video can optionally be rendered as an embedded player or a "Watch Video" link — but this change is scoped only to the admin editor for now.

Files changed: DB migration, `src/stores/programStore.ts` (interface), `src/components/admin/ProgramAdmin.tsx` (ProgramEditor form)

---

## Change 3: Exercise Library Database Table

**New table: `exercise_library**`

```sql
CREATE TABLE public.exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'strength',
  muscle_group text,
  video_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view
CREATE POLICY "Authenticated users can view exercise library"
  ON public.exercise_library FOR SELECT
  USING (true);

-- Admins can manage
CREATE POLICY "Admins can insert exercise library"
  ON public.exercise_library FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update exercise library"
  ON public.exercise_library FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete exercise library"
  ON public.exercise_library FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
```

This is a shared library — not per-user — so no `user_id` column is needed. All authenticated users can read, only admins can write.

---

## Change 4: Exercise Library Admin UI (new tab in Admin Panel)

**New tab in `AdminPanel.tsx`:** "Exercises" tab added to the existing Tabs alongside Resources, Podcasts, Programs.

**New component: `ExerciseLibraryAdmin.tsx**`

This component:

- Fetches all rows from `exercise_library`, sorted by name
- Displays a searchable list of exercises (name, category, video URL indicator)
- Has an "Add Exercise" button that opens an inline form/dialog with:
  - Exercise name (required)
  - Category dropdown (strength / conditioning / olympic / functional)
  - Muscle group (optional text)
  - Video URL (optional — e.g., YouTube link)
  - Notes (optional coaching notes)
- Edit (pencil) and Delete (trash) buttons on each row
- On save: upserts to `exercise_library` table

---

## Change 5: Wire Exercise Library into Workout Builder

**Updated: `ExerciseRowEditor` in `ProgramAdmin.tsx**`

The exercise name field currently is a plain `<Input>`. Replace it with a **combo box** that:

1. On mount, fetches the `exercise_library` table (shared fetch via a small `useExerciseLibrary` hook)
2. Shows a searchable dropdown of library exercises
3. Has a "type to add new..." option that lets admins type a custom name not in the library (same pattern as the existing free-log `ExerciseSearch`)
4. When an exercise from the library is selected:
  - Auto-fills the exercise name
  - If the library entry has a `video_url`, stores it on the `ProgramExercise` so it's saved in the `exercises` JSONB
5. Adds a `video_url` field to the `ProgramExercise` interface (optional string) and to the `ExerciseRowEditor` form (below the notes field), so admins can manually override or add a video URL for that specific exercise-in-this-workout

**Updated: `ProgramExercise` interface in `programStore.ts`:**

```typescript
export interface ProgramExercise {
  name: string;
  sets: number;
  reps: string;
  percentage_of_1rm?: string;
  tempo?: string;
  notes?: string;
  rest_seconds?: number;
  video_url?: string;   // new
}
```

**Flow for admin building a workout:**

1. Admin expands a program → clicks "Add Workout Session"
2. In the exercise rows, taps "Add Exercise"
3. Types in the combo box → sees matching exercises from library (with video dot indicator if URL exists)
4. Selects "Back Squat" → name auto-fills, video URL auto-fills from library
5. Can override the video URL for this specific workout slot if needed
6. Saves → exercise JSONB stores `{ name, sets, reps, tempo, video_url, ... }`

---

## Technical Details

### Database migrations needed (2)

1. `ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS video_url text;`
2. Full `exercise_library` table creation with RLS

### Files to create

- `src/components/admin/ExerciseLibraryAdmin.tsx` — full CRUD UI for the exercise library

### Files to modify

- `src/components/dashboard/VaultDashboard.tsx` — remove `<ActiveProgramSwitcher />`
- `src/components/workout/WorkoutTab.tsx` — add `<ActiveProgramSwitcher />` at top of logger tab
- `src/stores/programStore.ts` — add `video_url` to `Program` and `ProgramExercise` interfaces
- `src/components/admin/ProgramAdmin.tsx` — add video URL field to `ProgramEditor`, add video URL field + library combo box to `ExerciseRowEditor`
- `src/components/vault/AdminPanel.tsx` — add "Exercises" tab pointing to `ExerciseLibraryAdmin`

### No changes needed

- RLS policies for existing tables — unchanged
- `WorkoutLogger.tsx` — unchanged (program switcher moves to the tab level, not inside the logger)
- `DailyProgramWorkout.tsx` — unchanged
- `ExerciseSearch.tsx` (free-log exercise picker) — unchanged
- The weekly review edge function — unchanged