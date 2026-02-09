

# Workout Tracker Enhancement Plan

## Overview

This plan implements five major enhancements to the workout tracker:
1. **Conditioning/Cardio Section** - Log cardio and conditioning workouts
2. **Comprehensive Exercise List** - Every possible movement organized by category
3. **Workout Calendar Navigation** - View any past workout via calendar (TrainHeroic style)
4. **Unit Toggle (kg/lbs)** - User preference for weight units with conversion
5. **Weight Input Calculator Popup** - TrainHeroic-style numeric keypad popup

---

## Part 1: Conditioning/Cardio Section

### Cardio Entry Types

Different from strength sets, cardio tracks:
- **Duration** (minutes/seconds)
- **Distance** (miles/km)
- **Calories burned**
- **Heart rate zones** (optional)
- **Pace** (calculated from distance/duration)

### Database Updates

Add a new column to `workout_exercises`:

| Column | Type | Description |
|--------|------|-------------|
| `exercise_type` | enum | 'strength' or 'conditioning' |

Add a new table for conditioning sets:

**conditioning_sets**
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `exercise_id` | uuid | FK to workout_exercises |
| `set_number` | integer | Set number |
| `duration_seconds` | integer | Time in seconds |
| `distance` | numeric | Distance covered |
| `distance_unit` | enum | 'miles', 'km', 'meters' |
| `calories` | integer | Calories burned |
| `avg_heart_rate` | integer | Average HR |
| `is_completed` | boolean | Whether completed |

### UI Components

| Component | Purpose |
|-----------|---------|
| `ConditioningCard.tsx` | **NEW** - Exercise card for cardio entries |
| `ConditioningSetRow.tsx` | **NEW** - Row with duration/distance/calories inputs |
| `ExerciseSearch.tsx` | **MODIFIED** - Add tab for Conditioning vs Strength |

---

## Part 2: Comprehensive Exercise List

### Exercise Organization by Category

**Chest Exercises:**
- Bench Press (Barbell)
- Bench Press (Dumbbell)
- Incline Bench Press (Barbell)
- Incline Bench Press (Dumbbell)
- Decline Bench Press
- Close-Grip Bench Press
- Floor Press
- Push-Up
- Diamond Push-Up
- Wide Push-Up
- Decline Push-Up
- Incline Push-Up
- Chest Fly (Dumbbell)
- Chest Fly (Cable)
- Pec Deck
- Machine Chest Press
- Svend Press
- Landmine Press
- Dips (Chest Focus)
- Plate Press

**Back Exercises:**
- Deadlift (Conventional)
- Deadlift (Sumo)
- Romanian Deadlift
- Stiff-Leg Deadlift
- Deficit Deadlift
- Rack Pull
- Pull-Up
- Chin-Up
- Neutral-Grip Pull-Up
- Lat Pulldown (Wide)
- Lat Pulldown (Close)
- Lat Pulldown (Reverse Grip)
- Barbell Row (Overhand)
- Barbell Row (Underhand)
- Pendlay Row
- Dumbbell Row (Single-Arm)
- Dumbbell Row (Two-Arm)
- Cable Row (Seated)
- Cable Row (Standing)
- T-Bar Row
- Meadows Row
- Chest-Supported Row
- Seal Row
- Inverted Row
- Face Pull
- Straight-Arm Pulldown
- Shrug (Barbell)
- Shrug (Dumbbell)
- Shrug (Trap Bar)
- Rack Deadlift
- Good Morning
- Back Extension
- Hyperextension
- Reverse Hyperextension

**Shoulder Exercises:**
- Overhead Press (Barbell)
- Overhead Press (Dumbbell)
- Push Press
- Seated Dumbbell Press
- Arnold Press
- Behind-the-Neck Press
- Z Press
- Landmine Press (Shoulder)
- Machine Shoulder Press
- Lateral Raise (Dumbbell)
- Lateral Raise (Cable)
- Lateral Raise (Machine)
- Front Raise (Dumbbell)
- Front Raise (Barbell)
- Front Raise (Cable)
- Rear Delt Fly (Dumbbell)
- Rear Delt Fly (Cable)
- Rear Delt Fly (Machine)
- Upright Row
- Cable Upright Row
- Lu Raise
- Bus Driver
- Bradford Press
- Plate Front Raise
- Face Pull (Shoulder Focus)
- External Rotation
- Internal Rotation
- Y-T-W Raises

**Leg Exercises (Quadriceps):**
- Back Squat (High Bar)
- Back Squat (Low Bar)
- Front Squat
- Goblet Squat
- Zercher Squat
- Hack Squat
- Safety Bar Squat
- Box Squat
- Pause Squat
- Anderson Squat
- Leg Press
- Leg Press (Single-Leg)
- Leg Extension
- Bulgarian Split Squat
- Walking Lunge
- Reverse Lunge
- Forward Lunge
- Lateral Lunge
- Step-Up
- Box Step-Up
- Pistol Squat
- Sissy Squat
- Wall Sit
- Cyclist Squat
- Heel-Elevated Squat

**Leg Exercises (Hamstrings/Glutes):**
- Romanian Deadlift (Barbell)
- Romanian Deadlift (Dumbbell)
- Single-Leg Romanian Deadlift
- Stiff-Leg Deadlift
- Leg Curl (Lying)
- Leg Curl (Seated)
- Leg Curl (Standing)
- Nordic Curl
- Glute-Ham Raise
- Hip Thrust (Barbell)
- Hip Thrust (Dumbbell)
- Hip Thrust (Single-Leg)
- Hip Thrust (Banded)
- Glute Bridge
- Single-Leg Glute Bridge
- Cable Pull-Through
- Kettlebell Swing
- Sumo Deadlift
- Trap Bar Deadlift
- Hip Abduction (Machine)
- Hip Adduction (Machine)
- Cable Hip Abduction
- Cable Kickback
- Donkey Kick
- Fire Hydrant
- Clamshell

**Calf Exercises:**
- Standing Calf Raise (Machine)
- Standing Calf Raise (Smith)
- Standing Calf Raise (Dumbbell)
- Seated Calf Raise
- Leg Press Calf Raise
- Donkey Calf Raise
- Single-Leg Calf Raise
- Tibialis Raise

**Arm Exercises (Biceps):**
- Barbell Curl
- EZ Bar Curl
- Dumbbell Curl (Standing)
- Dumbbell Curl (Seated)
- Dumbbell Curl (Incline)
- Hammer Curl
- Cable Curl
- Preacher Curl (Barbell)
- Preacher Curl (Dumbbell)
- Preacher Curl (EZ Bar)
- Spider Curl
- Concentration Curl
- Drag Curl
- 21s (Barbell Curl)
- Cross-Body Hammer Curl
- Cable Hammer Curl
- Reverse Curl
- Zottman Curl
- Machine Bicep Curl

**Arm Exercises (Triceps):**
- Close-Grip Bench Press
- Tricep Pushdown (Rope)
- Tricep Pushdown (Bar)
- Tricep Pushdown (V-Bar)
- Overhead Tricep Extension (Cable)
- Overhead Tricep Extension (Dumbbell)
- Overhead Tricep Extension (EZ Bar)
- Skull Crusher (Barbell)
- Skull Crusher (Dumbbell)
- Skull Crusher (EZ Bar)
- Tricep Kickback
- Diamond Push-Up
- Bench Dip
- Parallel Bar Dip
- JM Press
- Tate Press
- French Press
- Cable Tricep Kickback

**Core Exercises:**
- Plank
- Side Plank
- Plank (Weighted)
- Dead Bug
- Bird Dog
- Hollow Body Hold
- Crunch
- Bicycle Crunch
- V-Up
- Sit-Up
- Decline Sit-Up
- Russian Twist
- Russian Twist (Weighted)
- Cable Crunch
- Ab Rollout
- Ab Wheel
- Hanging Leg Raise
- Hanging Knee Raise
- Captain's Chair Leg Raise
- Toe Touch
- Heel Touch
- Mountain Climber
- Flutter Kick
- Pallof Press
- Woodchop (Cable)
- Woodchop (Dumbbell)
- Landmine Rotation
- Suitcase Carry
- Farmer's Walk
- Overhead Carry
- Dragon Flag

**Olympic Lifts:**
- Clean
- Clean & Jerk
- Power Clean
- Hang Clean
- Snatch
- Power Snatch
- Hang Snatch
- Clean Pull
- Snatch Pull
- Muscle Clean
- Muscle Snatch
- Push Jerk
- Split Jerk
- Thruster
- Cluster
- Clean High Pull
- Snatch Grip Deadlift
- Overhead Squat

**Conditioning/Cardio:**
- Running (Treadmill)
- Running (Outdoor)
- Sprint
- Incline Walk (Treadmill)
- Rowing Machine
- Assault Bike
- Stationary Bike
- Spin Class
- Elliptical
- Stair Climber
- StairMaster
- Jump Rope
- Box Jump
- Broad Jump
- Burpee
- Mountain Climbers (Cardio)
- Jumping Jack
- High Knees
- Butt Kicks
- Battle Ropes
- Sled Push
- Sled Pull
- Prowler Push
- Farmer's Walk (Cardio)
- Swimming
- Cycling (Outdoor)
- Hiking
- HIIT Circuit
- Tabata
- EMOM
- AMRAP
- Ski Erg
- VersaClimber
- Bear Crawl
- Crab Walk
- Shuttle Run

**Functional/Accessory:**
- Face Pull
- Band Pull-Apart
- Banded Good Morning
- Banded Hip Circle
- Foam Rolling
- Stretching
- Mobility Work
- Yoga
- Turkish Get-Up
- Windmill (Kettlebell)
- Bottoms-Up Press
- Sots Press
- Jefferson Deadlift
- Deficit Push-Up
- Ring Push-Up
- Ring Row
- Ring Dip
- Muscle-Up
- Kipping Pull-Up
- Strict Pull-Up

### Implementation

Update `src/types/workout.ts` with a comprehensive categorized list:

```typescript
export const EXERCISE_CATEGORIES = {
  chest: [...],
  back: [...],
  shoulders: [...],
  quadriceps: [...],
  hamstrings_glutes: [...],
  calves: [...],
  biceps: [...],
  triceps: [...],
  core: [...],
  olympic: [...],
  conditioning: [...],
  functional: [...]
};

export const ALL_EXERCISES = Object.values(EXERCISE_CATEGORIES).flat();
```

### ExerciseSearch.tsx Updates

- Add category filter tabs
- Add search by category
- Add "Recent" and "Favorites" sections
- Add toggle for Strength vs Conditioning exercises

---

## Part 3: Workout Calendar Navigation (TrainHeroic Style)

### UI Design (Based on Screenshots)

**Header Bar:**
```text
+--------------------------------------------------+
|  [Filter]     FEB '26  ▼      [TODAY]   [🔔 55]  |
+--------------------------------------------------+
|   8   |   9   |   10   |   11   |   12   |   13  |
|   ●●  |       |        |        |        |        |
+--------------------------------------------------+
```

**Calendar View:**
```text
+--------------------------------------------------+
|  [←]        SELECT DATE                [TODAY]   |
+--------------------------------------------------+
|                February 2026                      |
|   1    2    3    4    5    6    7               |
|   8   (9)  10   11   12   13   14               |
|  15   16   17   18   19   20   21               |
|  22   23   24   25   26   27   28               |
+--------------------------------------------------+
|                March 2026                         |
|   1    2    3    4    5    6    7               |
|   ...                                            |
+--------------------------------------------------+
```

### Features

1. **Week Strip Navigation** - Horizontal scrollable week dates at top
2. **Today Button** - Jump back to current date
3. **Full Calendar Popover** - Click month/year to open full calendar
4. **Workout Indicators** - Dots under dates with logged workouts
5. **View Past Workouts** - Tap any date to see completed workout details
6. **Workout Summary Card** - Show workout name, exercises, volume for that date

### New Components

| Component | Purpose |
|-----------|---------|
| `WorkoutCalendar.tsx` | **NEW** - Full page calendar with month/year navigation |
| `WeekStrip.tsx` | **NEW** - Horizontal scrollable week dates |
| `WorkoutHistoryView.tsx` | **NEW** - Read-only view of completed workout |
| `DateSelectorDialog.tsx` | **NEW** - Full calendar dialog for date selection |

### State Updates

Add to `workoutStore.ts`:

```typescript
interface WorkoutState {
  // ... existing
  selectedDate: string; // YYYY-MM-DD format
  viewingWorkout: Workout | null;
  
  setSelectedDate: (date: string) => void;
  fetchWorkoutByDate: (date: string) => Promise<Workout | null>;
}
```

---

## Part 4: Unit Toggle (kg/lbs)

### User Preference Storage

Store preference in the workout store with localStorage persistence:

```typescript
interface WorkoutState {
  preferredUnit: 'lbs' | 'kg';
  setPreferredUnit: (unit: 'lbs' | 'kg') => void;
}
```

### Conversion Logic

```typescript
// Constants
const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;

// Conversion helpers
const toKg = (lbs: number) => Math.round(lbs * LBS_TO_KG * 10) / 10;
const toLbs = (kg: number) => Math.round(kg * KG_TO_LBS * 10) / 10;
```

### UI Updates

1. **Settings Toggle** - Add kg/lbs toggle in workout settings
2. **Input Fields** - Show unit label based on preference
3. **Display Values** - Convert all displayed weights based on preference
4. **Data Storage** - Always store in lbs, convert on display
5. **Weight Calculator** - Show kg/lbs toggle in the popup (as in screenshot)

### Files to Modify

- `src/stores/workoutStore.ts` - Add preferredUnit state
- `src/components/workout/SetRow.tsx` - Display correct unit
- `src/components/workout/PRBoard.tsx` - Display correct unit
- `src/components/workout/StrengthTrendChart.tsx` - Y-axis label

---

## Part 5: Weight Input Calculator Popup (TrainHeroic Style)

### UI Design (From Screenshot)

```text
+------------------------------------------+
|  220          [Kg] [Lb]           ▼     |
+------------------------------------------+
|                                          |
|    (1)      (2)      (3)        [Log]   |
|                                          |
|    (4)      (5)      (6)      [Autofill]|
|                                          |
|    (7)      (8)      (9)        [Miss]  |
|                                          |
|    (.)      (0)      (⌫)                |
|                                          |
+------------------------------------------+
```

### Features

1. **Large Number Display** - Shows current input value prominently
2. **Unit Toggle** - Kg/Lb toggle buttons next to the display
3. **Numeric Keypad** - Touch-friendly circular buttons (1-9, 0, decimal, backspace)
4. **Action Buttons:**
   - **Log** - Complete the set (primary action, blue)
   - **Autofill** - Copy weight from previous set (secondary, blue)
   - **Miss** - Mark set as missed/failed (gray toggle)
5. **Dismiss** - Chevron at top-right to close

### Component Structure

| Component | Purpose |
|-----------|---------|
| `WeightInputPopup.tsx` | **NEW** - Bottom sheet with numeric keypad |
| `NumericKeypad.tsx` | **NEW** - Reusable keypad component |

### Trigger Behavior

- Tapping the weight input field in SetRow opens the popup
- Popup slides up from bottom (Sheet component)
- Mobile-first: full-width on mobile, centered dialog on desktop

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/xxx_conditioning.sql` | Conditioning sets table + exercise_type enum |
| `src/components/workout/ConditioningCard.tsx` | Cardio exercise entry |
| `src/components/workout/ConditioningSetRow.tsx` | Duration/distance/calories row |
| `src/components/workout/WeekStrip.tsx` | Horizontal week date navigator |
| `src/components/workout/WorkoutCalendar.tsx` | Full calendar view |
| `src/components/workout/WorkoutHistoryView.tsx` | Read-only past workout view |
| `src/components/workout/WeightInputPopup.tsx` | Calculator-style weight input |
| `src/components/workout/NumericKeypad.tsx` | Numeric keypad component |
| `src/lib/weightConversion.ts` | Unit conversion utilities |

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/workout.ts` | Add comprehensive exercise list, conditioning types, unit preference |
| `src/stores/workoutStore.ts` | Add preferredUnit, selectedDate, viewingWorkout state |
| `src/components/workout/ExerciseSearch.tsx` | Categorized search with conditioning tab |
| `src/components/workout/SetRow.tsx` | Trigger weight input popup, unit display |
| `src/components/workout/ExerciseCard.tsx` | Support conditioning exercise type |
| `src/components/workout/WorkoutTab.tsx` | Add calendar view option |
| `src/components/workout/WorkoutLogger.tsx` | Add header with week strip navigation |
| `src/components/workout/PRBoard.tsx` | Display preferred unit |
| `src/components/workout/StrengthTrendChart.tsx` | Y-axis unit label |
| `src/components/workout/VolumeTrendChart.tsx` | Y-axis unit label |

---

## Implementation Order

### Phase 1: Comprehensive Exercise List
1. Update `src/types/workout.ts` with full categorized exercise list
2. Update `ExerciseSearch.tsx` with category tabs and improved search

### Phase 2: Unit Toggle
1. Add unit preference to workout store with localStorage persistence
2. Create `src/lib/weightConversion.ts` utilities
3. Update display components to show correct units

### Phase 3: Weight Input Calculator Popup
1. Create `NumericKeypad.tsx` component
2. Create `WeightInputPopup.tsx` sheet component
3. Integrate with `SetRow.tsx` to trigger on weight field tap

### Phase 4: Calendar Navigation
1. Add selectedDate and viewing state to store
2. Create `WeekStrip.tsx` component
3. Create `WorkoutCalendar.tsx` full calendar
4. Create `WorkoutHistoryView.tsx` for viewing past workouts
5. Integrate into `WorkoutTab.tsx`

### Phase 5: Conditioning Section
1. Create database migration for conditioning_sets table
2. Create `ConditioningSetRow.tsx` component
3. Create `ConditioningCard.tsx` component
4. Update `ExerciseSearch.tsx` with conditioning toggle
5. Update store to handle conditioning exercises

---

## Technical Notes

### Exercise Search Categories

```typescript
const EXERCISE_CATEGORIES = [
  { id: 'all', label: 'All', icon: Dumbbell },
  { id: 'chest', label: 'Chest', icon: Heart },
  { id: 'back', label: 'Back', icon: ArrowDown },
  { id: 'shoulders', label: 'Shoulders', icon: ArrowUp },
  { id: 'legs', label: 'Legs', icon: Footprints },
  { id: 'arms', label: 'Arms', icon: Arm },
  { id: 'core', label: 'Core', icon: Circle },
  { id: 'olympic', label: 'Olympic', icon: Medal },
  { id: 'conditioning', label: 'Cardio', icon: Heart },
];
```

### Unit Preference Persistence

```typescript
// In workoutStore.ts
preferredUnit: (localStorage.getItem('workout-unit') as 'lbs' | 'kg') || 'lbs',

setPreferredUnit: (unit) => {
  localStorage.setItem('workout-unit', unit);
  set({ preferredUnit: unit });
},
```

### Weight Input Popup Trigger

Instead of native input, weight field becomes a button that opens the popup:

```tsx
<Button 
  variant="outline" 
  onClick={() => setShowWeightPopup(true)}
  className="h-9 text-center"
>
  {weight || '—'} {preferredUnit}
</Button>
```

### Conditioning Set Metrics

Different cardio types track different metrics:

| Type | Primary Metric | Secondary |
|------|---------------|-----------|
| Running/Cycling | Distance + Time | Pace |
| Rowing/Ski Erg | Distance + Time | Split |
| Assault Bike | Calories + Time | Pace |
| Jump Rope | Reps + Time | — |
| HIIT/Tabata | Rounds + Time | — |
| Swimming | Distance + Time | Split |

