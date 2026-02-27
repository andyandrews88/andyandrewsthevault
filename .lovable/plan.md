

# Movement Pattern Volume Tracker

## Architecture Overview

```text
┌─────────────────────────────────────────────┐
│  Exercise → Movement Pattern Mapping        │
│  (new file: src/lib/movementPatterns.ts)     │
├─────────────────────────────────────────────┤
│  Volume Calculation Engine                   │
│  - Raw volume: weight × reps                │
│  - Bodyweight volume: BW% × reps            │
│  - Normalized volume: raw ÷ difficulty coeff │
├─────────────────────────────────────────────┤
│  New Analytics Component                     │
│  (MovementBalanceChart.tsx)                  │
│  - Radar chart: pattern balance              │
│  - Stacked bar: weekly vol per pattern       │
│  - Summary cards per pattern                 │
└─────────────────────────────────────────────┘
```

## Movement Pattern Categories

Seven primary patterns plus two supplementary:

| Pattern | Examples | Difficulty Coefficient |
|---------|----------|----------------------|
| **Hinge** | Deadlift, RDL, Good Morning, KB Swing | 1.0 (baseline — heaviest) |
| **Squat** | Back Squat, Front Squat, Goblet Squat | 0.95 |
| **Push** | Bench Press, OHP, Push-Up, Dips | 0.65 |
| **Pull** | Row, Pull-Up, Lat Pulldown, Chin-Up | 0.60 |
| **Single Leg** | Bulgarian Split Squat, Lunge, Step-Up | 0.55 |
| **Core** | Plank, Ab Rollout, Pallof Press, Carries | 0.35 |
| **Carry** | Farmer's Walk, Suitcase Carry, Overhead Carry | 0.50 |
| **Olympic** | Clean, Snatch, Jerk | 0.90 |
| **Isolation** | Curls, Lateral Raises, Leg Extension | 0.40 |

**Difficulty coefficient** purpose: Normalize volume so 10,000 lbs of deadlift work and 6,000 lbs of pull-up work can be compared on the same scale. Raw volume is divided by the coefficient to produce "Normalized Training Units" (NTUs). This makes the radar chart meaningful — a balanced athlete shows an even polygon.

## Bodyweight Volume Calculation

For exercises with no external load (push-ups, pull-ups, dips, etc.), volume uses the user's most recent body weight from `user_body_entries`:

| Exercise Type | BW Multiplier | Rationale |
|--------------|---------------|-----------|
| Pull-Up / Chin-Up | 1.0 × BW | Full bodyweight lifted |
| Dip | 1.0 × BW | Full bodyweight |
| Push-Up | 0.64 × BW | ~64% of BW is lifted (research-backed) |
| Incline Push-Up | 0.50 × BW | Less load |
| Decline Push-Up | 0.74 × BW | More load |
| Handstand Push-Up | 1.0 × BW | Full BW inverted |
| Inverted Row | 0.60 × BW | Approximate |
| Pistol Squat | 0.70 × BW | Single leg, partial BW |
| Nordic Curl | 0.65 × BW | Eccentric hamstring |

When the user has a `weight` logged on a set (e.g., weighted pull-ups at +45 lbs), volume = `(BW + added weight) × reps`. When weight is `null` or `0` and the exercise is in the bodyweight list, volume = `BW_multiplier × BW × reps`.

If no body weight entry exists, the system prompts the user to log one, and defaults to 170 lbs / 77 kg until they do.

## File Changes

### 1. New file: `src/lib/movementPatterns.ts`

Contains:
- `MOVEMENT_PATTERNS` constant mapping every exercise in `EXERCISE_CATEGORIES` to a movement pattern
- `BODYWEIGHT_EXERCISES` map with BW multipliers
- `DIFFICULTY_COEFFICIENTS` per pattern
- `classifyExercise(name: string): MovementPattern` function
- `calculateExerciseVolume(exerciseName, weight, reps, bodyWeight)` function that handles BW logic
- `normalizeVolume(rawVolume, pattern)` function
- Types: `MovementPattern`, `PatternVolumeData`

### 2. New component: `src/components/workout/MovementBalanceChart.tsx`

A new analytics card with three views (tabs inside the card):

**A. Radar Chart** — "Movement Balance"
- Recharts `RadarChart` showing normalized volume across all patterns
- Highlights imbalances (e.g., heavy push, weak pull)
- Time filter: This Week / Last 4 Weeks / Last 12 Weeks

**B. Stacked Bar Chart** — "Volume by Pattern"
- Weekly stacked bars, each segment = one movement pattern
- Color-coded by pattern
- Shows total raw volume broken down

**C. Pattern Summary Cards**
- Grid of small stat cards, one per pattern
- Shows: total volume, set count, exercise count, week-over-week trend
- Bodyweight exercises marked with a small "BW" badge

### 3. Modified: `src/components/workout/WorkoutTab.tsx`

Add `MovementBalanceChart` to the Analytics tab, below the existing `StrengthTrendChart` and `VolumeTrendChart`.

### 4. Modified: `src/stores/workoutStore.ts`

Add a new method `fetchMovementVolume(weeks: number)` that:
1. Fetches completed workouts + exercises + sets for the time range
2. Fetches the user's latest body weight from `user_body_entries`
3. For each exercise, classifies it and calculates raw + normalized volume
4. Returns `Record<MovementPattern, { rawVolume, normalizedVolume, sets, exercises }>` per week

### 5. Modified: `src/components/workout/WorkoutLogger.tsx` (Session Stats Footer)

Replace the single "Volume" number with a mini breakdown showing which patterns were hit in the current session (small colored dots or a tiny inline bar). Non-intrusive — just adds context.

### 6. New component: `src/components/workout/BodyweightBanner.tsx`

A small dismissible banner that appears in the workout logger if no body weight entry exists within the last 30 days. "Log your body weight for accurate volume tracking on bodyweight exercises."

## No Database Changes Required

All computation is done client-side by joining existing tables:
- `workouts` → `workout_exercises` → `exercise_sets` (already fetched)
- `user_body_entries.weight_kg` (single query for latest entry)

The movement pattern classification is a pure mapping — no new columns or tables needed. This keeps the system fast and avoids migrations.

## UI Design Principles

- Radar chart uses muted, distinct colors per pattern — not rainbow, but a professional palette
- Pattern names use short labels on mobile (e.g., "SL" for Single Leg)
- Volume numbers use the user's preferred unit (lbs/kg)
- Empty states guide users: "Complete workouts to see your movement balance"
- Bodyweight exercises show "(BW)" suffix in tooltips so users understand the calculation

