
# Workout Tracker & Progress Dashboard (TrainHeroic-Style)

## Overview

Building a complete workout logging and progress visualization system within "The Vault". This includes:
1. **Database Schema** - Four interconnected tables for workouts, exercises, sets, and PRs
2. **TrainHeroic-Style Logger** - Mobile-first workout entry with previous data, PR detection, and confetti
3. **Progress Dashboard** - Strength trends, volume tracking, and activity heatmap

---

## Part 1: Database Schema (Supabase SQL)

### Tables

**workouts**
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to auth.users |
| `date` | date | Workout date |
| `workout_name` | text | Session name (e.g., "Upper Body A") |
| `total_volume` | integer | Calculated: sum(weight × reps) |
| `notes` | text | Optional session notes |
| `is_completed` | boolean | Whether session is finished |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

**workout_exercises**
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `workout_id` | uuid | FK to workouts |
| `exercise_name` | text | e.g., "Back Squat", "Bench Press" |
| `order_index` | integer | Display order in workout |
| `notes` | text | Exercise-specific notes |
| `created_at` | timestamptz | Creation timestamp |

**exercise_sets**
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `exercise_id` | uuid | FK to workout_exercises |
| `set_number` | integer | 1, 2, 3, etc. |
| `weight` | numeric | Weight lifted (kg or lbs based on user pref) |
| `reps` | integer | Repetitions performed |
| `rpe` | numeric | Rate of Perceived Exertion (1-10) |
| `is_completed` | boolean | Whether set is done |
| `created_at` | timestamptz | Creation timestamp |

**personal_records**
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to auth.users |
| `exercise_name` | text | Normalized exercise name |
| `max_weight` | numeric | Highest weight lifted |
| `max_reps` | integer | Reps at max weight |
| `workout_id` | uuid | FK to workout where achieved |
| `set_id` | uuid | FK to specific set |
| `achieved_at` | timestamptz | When record was set |
| `created_at` | timestamptz | Creation timestamp |

### Foreign Key Relationships

```text
workouts
    │
    └── workout_exercises (workout_id → workouts.id)
            │
            └── exercise_sets (exercise_id → workout_exercises.id)

personal_records
    ├── user_id → auth.users
    ├── workout_id → workouts.id
    └── set_id → exercise_sets.id
```

### RLS Policies

- All tables: Users can only CRUD their own data
- SELECT: `auth.uid() = user_id` (or via join for child tables)
- INSERT/UPDATE/DELETE: Same ownership check
- Personal records linked to parent workout's user_id

---

## Part 2: TrainHeroic-Style Logging UI

### Mobile-First Workout Logger

```text
┌─────────────────────────────────────────────┐
│  [←] Back       Upper Body A         [Save] │
│               Feb 9, 2026                   │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ BACK SQUAT                    [···] │   │
│  │ [Load Last Session]                  │   │
│  ├─────────────────────────────────────┤   │
│  │ Set │ Prev    │ Weight │ Reps │ ✓   │   │
│  │─────┼─────────┼────────┼──────┼─────│   │
│  │ 1   │ 185×5   │ [195 ] │ [5 ] │ [✓] │   │
│  │ 2   │ 185×5   │ [195 ] │ [5 ] │ [✓] │   │
│  │ 3   │ 185×5   │ [195 ] │ [4 ] │ [ ] │   │
│  │─────┴─────────┴────────┴──────┴─────│   │
│  │              [+ Add Set]             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ BENCH PRESS                   [···] │   │
│  │ [Load Last Session]                  │   │
│  ├─────────────────────────────────────┤   │
│  │ Set │ Prev    │ Weight │ Reps │ ✓   │   │
│  │─────┼─────────┼────────┼──────┼─────│   │
│  │ 1   │ 155×8   │ [    ] │ [  ] │ [ ] │   │
│  └─────────────────────────────────────┘   │
│                                             │
│          [+ Add Exercise]                   │
│                                             │
├─────────────────────────────────────────────┤
│  Total Volume: 4,875 lbs    ⏱ 45 min       │
└─────────────────────────────────────────────┘
```

### Key UI Features

1. **Dynamic Exercise Cards**
   - Add exercises from searchable list or custom entry
   - Each card contains a table of sets
   - Drag to reorder exercises

2. **Set Rows**
   - Set # (auto-incremented)
   - "Prev" column showing weight×reps from last session with that exercise
   - Weight input (numeric, supports decimal)
   - Reps input (integer)
   - Complete checkbox with touch-friendly size (44px)
   - Optional RPE input (collapsible)

3. **PR Detection Logic**
   - When checkbox marked complete → compare weight to `personal_records`
   - If new PR: trigger confetti animation + "NEW PR!" badge
   - Update `personal_records` table automatically

4. **Load Last Session**
   - Query most recent workout containing same exercise
   - Pre-populate set structure with previous weights/reps
   - User can modify before completing

5. **Exercise Search**
   - Common exercises with autocomplete
   - Recent exercises for quick access
   - Custom exercise entry

### New Components

| Component | Purpose |
|-----------|---------|
| `WorkoutLogger.tsx` | Main workout logging page |
| `ExerciseCard.tsx` | Individual exercise with sets table |
| `SetRow.tsx` | Single set input row |
| `ExerciseSearch.tsx` | Search/add exercise dialog |
| `PRCelebration.tsx` | Confetti + badge animation |
| `WorkoutSummary.tsx` | Volume and session stats |

---

## Part 3: Progress Dashboard

### Strength Trends (Line Chart)

```text
┌─────────────────────────────────────────────┐
│  Strength Progress                          │
│  [Exercise: Back Squat ▼]                   │
├─────────────────────────────────────────────┤
│                                             │
│  225 ─                           ●──●       │
│  215 ─                       ●───┘          │
│  205 ─                   ●───┘              │
│  195 ─               ●───┘                  │
│  185 ─ ●─────────────┘                      │
│       ─────────────────────────────────────  │
│        Jan    Feb    Mar    Apr    May      │
│                                             │
│  Current Max: 225 lbs (+21% since start)    │
└─────────────────────────────────────────────┘
```

### Volume Tracking (Bar Chart)

```text
┌─────────────────────────────────────────────┐
│  Weekly Training Volume                     │
├─────────────────────────────────────────────┤
│                                             │
│  60k ─         ███                          │
│  50k ─   ███   ███   ███                    │
│  40k ─   ███   ███   ███   ███              │
│  30k ─   ███   ███   ███   ███              │
│  20k ─   ███   ███   ███   ███              │
│  10k ─   ███   ███   ███   ███              │
│       ───────────────────────────────────── │
│       Week 1  Week 2  Week 3  Week 4        │
│                                             │
│  This Week: 52,450 lbs  ↑12% vs last week   │
└─────────────────────────────────────────────┘
```

### Consistency Heatmap (GitHub-Style)

```text
┌─────────────────────────────────────────────┐
│  Training Consistency (Last 12 Weeks)       │
├─────────────────────────────────────────────┤
│                                             │
│  Mon  ░░██░░██░░██░░██░░██░░██░░██░░██░░██  │
│  Tue  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  Wed  ░░██░░██░░██░░██░░██░░██░░░░░░██░░██  │
│  Thu  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  Fri  ░░██░░██░░██░░██░░██░░██░░██░░██░░██  │
│  Sat  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  Sun  ░░░░░░░░██░░██░░░░░░██░░░░░░██░░██░░  │
│       │← 12 weeks ago              today →│  │
│                                             │
│  ░ = No workout  █ = Logged workout         │
│  Current Streak: 4 days                     │
└─────────────────────────────────────────────┘
```

### Dashboard Components

| Component | Purpose |
|-----------|---------|
| `WorkoutDashboard.tsx` | Main dashboard with all charts |
| `StrengthTrendChart.tsx` | Line chart for selected exercise |
| `VolumeTrendChart.tsx` | Bar chart for weekly volume |
| `ActivityHeatmap.tsx` | GitHub-style workout calendar |
| `PRBoard.tsx` | List of all personal records |
| `ExerciseSelector.tsx` | Dropdown to filter charts by exercise |

---

## Part 4: State Management

### workoutStore.ts (Zustand)

```typescript
interface WorkoutState {
  // Current workout session
  activeWorkout: Workout | null;
  exercises: WorkoutExercise[];
  
  // History
  recentWorkouts: Workout[];
  personalRecords: PersonalRecord[];
  
  // Actions
  startWorkout: (name: string) => void;
  addExercise: (name: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (setId: string, data: Partial<ExerciseSet>) => void;
  completeSet: (setId: string) => Promise<boolean>; // Returns true if PR
  loadLastSession: (exerciseName: string) => Promise<void>;
  finishWorkout: () => Promise<void>;
  
  // Fetching
  fetchWorkoutHistory: (days?: number) => Promise<void>;
  fetchPersonalRecords: () => Promise<void>;
  fetchExerciseHistory: (exerciseName: string) => Promise<ExerciseHistory[]>;
}
```

---

## Part 5: Integration Points

### Vault Navigation

Add "Workouts" tab to Vault.tsx between Progress and Nutrition:

```typescript
<TabsTrigger value="workouts">
  <Dumbbell className="w-4 h-4" />
  <span>Workouts</span>
</TabsTrigger>
```

### Dashboard Tab Content

The Progress tab will get an enhanced section or sub-tabs:
- Body Composition (existing)
- Strength Progress (new charts)
- Training Volume (new charts)

### Realtime Updates

Enable Supabase Realtime on `personal_records`:
- Instant PR display across all open tabs/devices
- Optimistic UI updates with server validation

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/xxx_workout_tracker.sql` | All tables, RLS, indexes |
| `src/types/workout.ts` | TypeScript interfaces |
| `src/stores/workoutStore.ts` | Zustand state management |
| `src/hooks/useWorkoutRealtime.ts` | Realtime PR subscriptions |
| `src/components/workout/WorkoutLogger.tsx` | Main logging UI |
| `src/components/workout/ExerciseCard.tsx` | Exercise with sets |
| `src/components/workout/SetRow.tsx` | Individual set input |
| `src/components/workout/ExerciseSearch.tsx` | Exercise picker dialog |
| `src/components/workout/PRCelebration.tsx` | Confetti animation |
| `src/components/workout/WorkoutDashboard.tsx` | Dashboard container |
| `src/components/workout/StrengthTrendChart.tsx` | Line chart |
| `src/components/workout/VolumeTrendChart.tsx` | Bar chart |
| `src/components/workout/ActivityHeatmap.tsx` | Calendar heatmap |
| `src/components/workout/PRBoard.tsx` | Personal records list |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Vault.tsx` | Add Workouts tab |
| `src/components/progress/ProgressTab.tsx` | Add strength trends section |

---

## Implementation Order

### Phase 1: Database Foundation
1. Create SQL migration with all tables and RLS
2. Add indexes for performance (user_id, date, exercise_name)
3. Enable Realtime on personal_records

### Phase 2: Types and Store
1. Create `src/types/workout.ts` with all interfaces
2. Build `workoutStore.ts` with Zustand
3. Create `useWorkoutRealtime.ts` hook

### Phase 3: Workout Logger UI
1. Build SetRow component (atomic)
2. Build ExerciseCard component
3. Build ExerciseSearch dialog
4. Build WorkoutLogger page
5. Add PR detection and celebration

### Phase 4: Progress Dashboard
1. Build StrengthTrendChart with Recharts
2. Build VolumeTrendChart
3. Build ActivityHeatmap
4. Build PRBoard
5. Integrate into Vault

### Phase 5: Polish
1. Mobile responsiveness optimization
2. Loading states and error handling
3. Empty states with guidance
4. Unit preference (kg/lbs) support

---

## Technical Notes

### PR Detection Algorithm

```typescript
async function checkForPR(exerciseName: string, weight: number): Promise<boolean> {
  const { data: currentPR } = await supabase
    .from('personal_records')
    .select('max_weight')
    .eq('user_id', user.id)
    .eq('exercise_name', exerciseName.toLowerCase())
    .maybeSingle();
  
  return !currentPR || weight > currentPR.max_weight;
}
```

### Volume Calculation

```sql
-- Trigger to update workout total_volume on set changes
CREATE OR REPLACE FUNCTION update_workout_volume()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workouts w
  SET total_volume = (
    SELECT COALESCE(SUM(s.weight * s.reps), 0)
    FROM exercise_sets s
    JOIN workout_exercises e ON s.exercise_id = e.id
    WHERE e.workout_id = w.id AND s.is_completed = true
  )
  WHERE w.id = (
    SELECT e.workout_id 
    FROM workout_exercises e 
    WHERE e.id = NEW.exercise_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Exercise Name Normalization

All exercise names stored in lowercase for consistent PR tracking:
- "Back Squat" → "back squat"
- "BENCH PRESS" → "bench press"

### Confetti Animation

Using canvas-confetti library (or CSS-based fallback) for PR celebrations:
- Trigger on successful PR detection
- Duration: 2 seconds
- Colors: Gold, accent colors

