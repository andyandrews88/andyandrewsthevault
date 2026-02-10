

# Goal Setting Engine & Readiness-Driven Training Suggestions

## Overview

Two tightly connected features:

1. **Goal Setting & Progress Tracking** -- Users set specific, measurable goals with deadlines. The app tracks their actual rate of progress and projects whether they're on track, ahead, or behind.
2. **Readiness-Driven Training Suggestions** -- The dashboard uses today's readiness score to recommend session intensity (push hard, train normally, go light, or take a recovery day).

---

## Part 1: Goal Setting & Periodisation Engine

### Goal Types Supported

| Type | Example | Data Source | How Progress is Measured |
|------|---------|-------------|--------------------------|
| Strength | "Squat 150kg by June" | `personal_records` table | Latest PR weight for the named exercise |
| Body Weight | "Lose 5kg in 12 weeks" | `user_body_entries` table | Latest weight entry |
| Conditioning | "Run sub-25 min 5k" | `conditioning_sets` table | Best time for "Running (Outdoor)" at 5km distance |

### Database

New table: `user_goals`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | References auth user |
| goal_type | text | 'strength', 'body_weight', or 'conditioning' |
| title | text | User-friendly label e.g. "Squat 150kg" |
| exercise_name | text | Nullable -- for strength/conditioning goals, matches exercise library |
| target_value | numeric | The target number (weight in kg, time in seconds, bodyweight in kg) |
| start_value | numeric | The value when the goal was created (baseline) |
| current_value | numeric | Updated when progress is logged |
| target_date | date | Deadline |
| unit | text | 'kg', 'lbs', 'seconds', 'minutes' |
| status | text | 'active', 'achieved', 'missed', 'cancelled' |
| created_at | timestamptz | Default now() |
| achieved_at | timestamptz | Nullable |

RLS: Users can only CRUD their own goals.

### UI Components

- **`src/components/goals/GoalForm.tsx`** -- Modal/drawer form to create a new goal. User picks the type, selects an exercise (for strength/conditioning), enters the target value, and sets a deadline. The form auto-populates the start value from their current data (latest PR, latest weight, latest conditioning time).

- **`src/components/goals/GoalCard.tsx`** -- A card showing one goal with:
  - Title and target
  - Progress bar (start value to target value, current position marked)
  - Projected completion date based on rate of change (linear regression from data points)
  - Status badge: "On Track", "Ahead", "Behind", "Achieved"
  - Days remaining

- **`src/components/goals/GoalsPanel.tsx`** -- Container that lists active goals + button to add new ones. Sits on the Dashboard tab above the Weekly Review.

### Projection Logic (Client-Side)

For strength goals: query the user's PR history for that exercise, calculate the weekly rate of increase, and project when they'll hit the target.

For body weight goals: query body entries over the last 4 weeks, calculate the weekly rate of change, and project when they'll hit the target.

For conditioning goals: query conditioning sets for the relevant exercise, find the best time per week, calculate improvement rate, and project.

The projection status is determined by comparing the projected date to the target date:
- Projected date is before target date = "Ahead"
- Projected date is within 1 week of target date = "On Track"
- Projected date is after target date = "Behind"

### State Management

- **`src/stores/goalStore.ts`** -- Zustand store for CRUD operations on goals + projection calculations.

---

## Part 2: Readiness-Driven Training Suggestions

### How It Works

Based on today's readiness score from the daily check-in, the Dashboard shows a training suggestion banner. No new database tables needed -- this reads from the existing `user_daily_checkins` data already in the dashboard store.

### Suggestion Logic

| Readiness Score | Zone | Suggestion | Color |
|----------------|------|------------|-------|
| 85-100% | Green (Push) | "Readiness is high. Great day to push intensity -- go for PRs or increase volume." | Green |
| 70-84% | Blue (Normal) | "Solid readiness. Train as programmed. Stay consistent." | Blue/Primary |
| 50-69% | Amber (Moderate) | "Readiness is moderate. Consider reducing volume by 10-20% or skipping heavy compounds." | Amber |
| Below 50% | Red (Recovery) | "Readiness is low. Prioritise recovery today -- light mobility, a walk, or complete rest." | Red |
| No check-in | Grey | "Complete your daily check-in to get a training recommendation." | Grey |

### UI Component

- **`src/components/dashboard/TrainingSuggestion.tsx`** -- A banner/card placed on the Dashboard between the Today's Snapshot and the Goals Panel. Shows:
  - The zone name and colour
  - The suggestion text
  - Optionally: which sub-scores are dragging readiness down (e.g. "Sleep and stress are low today")

### Dashboard Integration

The updated VaultDashboard layout will be:

```
[Today's Snapshot - 3 cards]
[Training Suggestion Banner]
[Active Goals Panel]
[Weekly Review]
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/goals/GoalForm.tsx` | Goal creation form (type selector, exercise picker, target, deadline) |
| `src/components/goals/GoalCard.tsx` | Individual goal progress card with projection |
| `src/components/goals/GoalsPanel.tsx` | Container listing active goals + add button |
| `src/stores/goalStore.ts` | Zustand store for goal CRUD + projection logic |
| `src/components/dashboard/TrainingSuggestion.tsx` | Readiness-based training recommendation banner |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/VaultDashboard.tsx` | Add TrainingSuggestion and GoalsPanel between snapshot and weekly review |

## Database Migration

One new table (`user_goals`) with RLS policies for user-scoped CRUD.

---

## Implementation Order

1. Create the `user_goals` table with RLS policies
2. Build the goal store with CRUD and projection logic
3. Build the GoalForm, GoalCard, and GoalsPanel components
4. Build the TrainingSuggestion component (reads from existing dashboard store)
5. Wire everything into VaultDashboard in the correct layout order

