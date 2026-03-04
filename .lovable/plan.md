

# Performance Audit & Deployment Sync — Remediation Plan

## Findings

### 1. Performance — Expensive Dashboard Queries (HIGH IMPACT)

**`src/stores/dashboardStore.ts` lines 103-105**: The conditioning and RIR queries fetch ALL rows from `conditioning_sets` and `exercise_sets` across ALL users, then filter client-side. With growing data, these become progressively slower and return massive payloads.

```text
Current:  SELECT * FROM conditioning_sets (ALL ROWS) → filter JS-side by user_id
Should:   SELECT ... FROM conditioning_sets WHERE user_id=X AND date>=Y (server-side)
```

**Fix**: Rewrite these two queries to use proper `.eq('exercise.workout.user_id', user.id)` filters or restructure as a joined query that filters at the DB level. Alternatively, use a dedicated database view or RPC function.

### 2. Performance — Per-Exercise DB Calls in ExerciseCard (MEDIUM IMPACT)

**`src/components/workout/ExerciseCard.tsx` lines 119-148**: Every `ExerciseCard` instance fires TWO independent Supabase queries on mount (`exercise_library` fetch + `getLastSessionSets`). A workout with 8 exercises = 16 concurrent API calls on page load.

**Fix**: Batch-fetch exercise library metadata once at the `WorkoutLogger` level and pass it down as props, eliminating N+1 queries.

### 3. Performance — Realtime Channel Overfiring (MEDIUM IMPACT)

**`src/hooks/useWorkoutRealtime.ts`**: The `workout_exercises` and `exercise_sets` channels have no user filter — they fire on ALL changes across ALL users. Each event triggers `fetchActiveWorkout()` which is another multi-query call.

**Fix**: Add `filter: user_id=eq.${user.id}` to the `workout_exercises` channel. For `exercise_sets`, filter via a DB function or debounce the handler.

### 4. Performance — Redundant Fetches on Mount (LOW-MEDIUM IMPACT)

**`src/components/workout/WorkoutLogger.tsx` line 126-129**: Calls `fetchActiveWorkout()`, `fetchPersonalRecords()`, and `fetchWorkoutDays(12)` on every mount with no staleness guard. Tab-switching between Logger/Calendar/Analytics re-mounts and re-fires all three.

**Fix**: Add a timestamp-based fetch guard (similar to what `programStore` already uses — 30s window) to `fetchActiveWorkout`, `fetchPersonalRecords`, and `fetchWorkoutDays`.

### 5. Build/Deployment — PWA Cache Serving Stale Code (HIGH IMPACT)

**`vite.config.ts` lines 24-26**: The Workbox config uses `globPatterns: ["**/*.{html,ico,png,svg,woff2}"]` which correctly excludes JS/CSS from precache. However, the `NetworkFirst` runtime cache for JS/CSS (lines 29-38) has a 24-hour expiration. After a deploy, the service worker may serve cached JS chunks until the SW itself updates, which can take up to 1 hour with `registerType: "autoUpdate"`.

**Fix**: 
- Add `skipWaiting: true` and `clientsClaim: true` to the Workbox config so the new SW activates immediately
- Reduce the JS/CSS cache `maxAgeSeconds` from 24 hours to 1 hour
- Add a `navigateFallback` to ensure the root HTML is always fresh

### 6. Build/Deployment — No SW Update Prompt (MEDIUM IMPACT)

There is no mechanism to notify the user that a new version is available. The app silently waits for the SW to update in the background.

**Fix**: Add a `useRegisterSW` hook from `vite-plugin-pwa` that shows a toast prompting the user to refresh when a new build is available.

## Remediation Steps (Ordered by Impact)

| # | File | Change | Impact |
|---|------|--------|--------|
| 1 | `vite.config.ts` | Add `skipWaiting: true`, `clientsClaim: true`, reduce JS cache to 1hr | Fixes stale production deploys |
| 2 | `src/stores/dashboardStore.ts` | Rewrite conditioning/RIR queries to filter server-side by user_id and date range | Eliminates full-table scans |
| 3 | `src/hooks/useWorkoutRealtime.ts` | Add user_id filter to workout_exercises channel; debounce exercise_sets handler | Reduces unnecessary refetches |
| 4 | `src/stores/workoutStore.ts` | Add 30s staleness guard to `fetchActiveWorkout`, `fetchPersonalRecords`, `fetchWorkoutDays` | Prevents redundant API calls on tab switch |
| 5 | `src/components/workout/WorkoutLogger.tsx` | Batch-fetch exercise library metadata and pass to ExerciseCards | Eliminates N+1 queries |
| 6 | `src/App.tsx` or new `src/hooks/useServiceWorkerUpdate.ts` | Add SW update toast using `useRegisterSW` | Forces users to load latest code |

