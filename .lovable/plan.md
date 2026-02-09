

# Lifestyle Check-In & Central Dashboard

## Overview

Two interconnected features:

1. **Daily Lifestyle Check-In** -- A quick daily questionnaire (Sleep, Stress, Energy, Drive) that builds a readiness profile over time
2. **Central Dashboard** -- A unified overview that pulls training, nutrition, lifestyle, and body composition data into one view with a weekly summary

---

## Part 1: Daily Lifestyle Check-In

### How It Works

Each day, the user answers 4 questions on a 1-5 scale (or 1-10 if you prefer):

| Metric | Question | Scale |
|--------|----------|-------|
| Sleep Quality | "How well did you sleep last night?" | 1-5 (Poor to Excellent) |
| Stress Level | "How is your stress level today?" | 1-5 (Very High to Very Low) -- inverted so 5 = good |
| Energy Level | "How is your energy right now?" | 1-5 (Depleted to Charged) |
| Drive | "How motivated and excited do you feel today?" | 1-5 (Flat to Fired Up) |

Optional: A free-text notes field for context ("bad night's sleep", "big presentation", etc.)

The scores combine into a **Readiness Score** (average of 4 metrics, displayed as a percentage out of 100). This gives users an at-a-glance sense of how prepared they are to train and perform.

### Database

New table: `user_daily_checkins`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to auth |
| check_date | date | One entry per day |
| sleep_score | integer | 1-5 |
| stress_score | integer | 1-5 (inverted: 5 = low stress) |
| energy_score | integer | 1-5 |
| drive_score | integer | 1-5 |
| notes | text | Optional |
| created_at | timestamptz | Default now() |

Unique constraint on (user_id, check_date) so users can only submit one check-in per day (but can update it).

RLS: Users can only CRUD their own rows.

### UI Components

- `src/components/lifestyle/DailyCheckin.tsx` -- The check-in form with slider/button inputs for each metric. Shows today's scores if already submitted, with option to edit.
- `src/components/lifestyle/ReadinessChart.tsx` -- A line chart showing readiness score over the past 7-30 days using Recharts.
- `src/components/lifestyle/LifestyleTab.tsx` -- Container tab combining the check-in form + trend chart.

### Vault Integration

Add a new "Lifestyle" tab to the Vault between Progress and Workouts:

```
Library | Progress | Lifestyle | Workouts | Podcast | Community | Tracks
```

---

## Part 2: Central Dashboard

### What It Shows

The dashboard becomes the **default tab** in the Vault, replacing the current "Library" default. It gives a real-time snapshot of the user's day and week.

### Dashboard Layout

**Today's Snapshot (top row of cards):**

| Card | Data Source | What It Shows |
|------|------------|---------------|
| Readiness Score | `user_daily_checkins` | Today's readiness % with the 4 sub-scores |
| Training | `workouts` table | Today's workout (if any), or last workout date + total volume |
| Nutrition | `mealBuilderStore` | Today's calories/macros consumed vs targets |
| Body Comp | `user_body_entries` | Latest weight + trend arrow (up/down vs last entry) |

**Weekly Review (below snapshot):**

A summary section that aggregates the past 7 days:

- **Training**: Workouts completed, total volume, any new PRs
- **Nutrition**: Average daily calories vs target, average protein intake
- **Lifestyle**: Average readiness score, trend (improving/declining), lowest day flagged
- **Body Comp**: Weight change over the week

This generates a short text write-up summarising the week. The write-up is computed client-side from the data -- no AI needed. It follows a template like:

> "This week you completed 4 workouts with a total volume of 45,200 lbs. Your average readiness score was 78%, trending up from last week. Nutrition averaged 2,340 cal/day against your 2,500 target (94% adherence). Bodyweight moved from 185.2 to 184.8 lbs. Focus area: your stress scores dipped mid-week -- consider adding a recovery session."

### UI Components

- `src/components/dashboard/VaultDashboard.tsx` -- The main dashboard container
- `src/components/dashboard/TodaySnapshot.tsx` -- The 4-card top row
- `src/components/dashboard/WeeklyReview.tsx` -- The weekly aggregation + text summary
- `src/stores/dashboardStore.ts` -- Zustand store that fetches and aggregates data from workouts, body entries, check-ins, and nutrition

### Vault Tab Update

Add "Dashboard" as the first tab and make it the default:

```
Dashboard | Library | Progress | Lifestyle | Workouts | Podcast | Community | Tracks
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/lifestyle/DailyCheckin.tsx` | Check-in form with 4 metrics |
| `src/components/lifestyle/ReadinessChart.tsx` | 7-30 day readiness trend line chart |
| `src/components/lifestyle/LifestyleTab.tsx` | Container for check-in + chart |
| `src/components/dashboard/VaultDashboard.tsx` | Central dashboard layout |
| `src/components/dashboard/TodaySnapshot.tsx` | Today's 4 summary cards |
| `src/components/dashboard/WeeklyReview.tsx` | Weekly aggregation + generated write-up |
| `src/stores/dashboardStore.ts` | Data aggregation store |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Vault.tsx` | Add Dashboard and Lifestyle tabs, reorder tabs, set Dashboard as default |

## Database Migration

One new table (`user_daily_checkins`) with RLS policies for user-scoped CRUD.

---

## Implementation Order

1. Create the database table with RLS
2. Build the Daily Check-in form and readiness chart (Lifestyle tab)
3. Build the Dashboard store that aggregates cross-feature data
4. Build the Dashboard components (Today's Snapshot + Weekly Review)
5. Wire both new tabs into the Vault

