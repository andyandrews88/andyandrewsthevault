

# Plan: Exercise Video Integration + Audit Results Persistence

## Feature 1: Exercise Demo Videos in Workout Logger

### Current State
- The `exercise_library` table already stores `video_url` (YouTube URLs) and `name` for each exercise
- Admins can edit these via `ExerciseLibraryAdmin.tsx`
- The `ExerciseCard` component displays exercise name and sets but has **zero connection** to the exercise library -- it only uses the `exercise_name` string from `workout_exercises`
- The `ExerciseSearch` component uses a hardcoded list from `types/workout.ts`, not the database exercise library

### Design: Lean Video Embed in ExerciseCard

When a user adds an exercise to their workout, the `ExerciseCard` will look up the exercise name in the `exercise_library` table and, if a `video_url` exists, show a small collapsible video thumbnail/button in the card header. Tapping it reveals a YouTube embed below the exercise name -- like how strong, Hevy, and other training apps show demo videos.

**Architecture:**

```text
ExerciseCard header
┌──────────────────────────────────────┐
│  BACK SQUAT                    ⋮    │
│  2/4 sets completed   ▶ Demo        │
├──────────────────────────────────────┤
│  [YouTube embed - only when tapped]  │  ← collapsible, 16:9 aspect ratio
├──────────────────────────────────────┤
│  Set | Prev | Kg | Reps | RIR | ✓   │
│  ...                                 │
└──────────────────────────────────────┘
```

### File Changes

**`src/components/workout/ExerciseCard.tsx`**
- Add state: `videoUrl: string | null`, `showVideo: boolean`
- On mount, query `exercise_library` by name (case-insensitive match) to get `video_url`
- If `video_url` exists, show a small "Demo" button (Play icon) next to the exercise name
- When tapped, toggle a collapsible section below the header showing a 16:9 YouTube embed iframe
- Use the existing `transformToEmbedUrl` utility from `src/lib/vaultService.ts` (or inline a simple YouTube URL-to-embed converter) to convert watch URLs to embed URLs
- The embed is lazy-loaded (only renders iframe when `showVideo` is true) for performance

**`src/components/workout/ExerciseSearch.tsx`** (optional enhancement)
- Fetch exercises from `exercise_library` table instead of (or merged with) the hardcoded list
- This creates the synergy you want: exercises added by admin in the Knowledge Bank exercise library automatically appear in the workout search and carry their video URLs through

This creates full connectivity: Admin adds exercise with video in Exercise Library → Exercise appears in workout search → User selects it → Video demo appears in their logging card.

### Synergy with Knowledge Bank
The exercise library in the admin panel IS the source of truth. Videos added there flow directly into the workout logger. No duplication, single source.

---

## Feature 2: Audit Results Persistence

### Current State
- `auditStore` is a Zustand store with **no persistence** -- state lives only in memory
- When the user navigates away from `/results` and comes back, `results` is `null`, so `ResultsPage` redirects them to `/audit`
- The `/audit` form re-renders from step 0, though the `data` in the store still has their entries (until page refresh)
- The store's `reset()` clears everything

### Design: Persist Results + Smart Routing

**Strategy:** Persist the audit store to `localStorage` using Zustand's `persist` middleware. When a user has completed results, navigating to `/audit` should show the results page, not the form. A prominent "Retake Assessment" card is already on the results page but needs to be more visible.

### File Changes

**`src/stores/auditStore.ts`**
- Add Zustand `persist` middleware wrapping the store
- Storage key: `vault-audit-data`
- This persists `currentStep`, `data`, and `results` across navigation and page refreshes

**`src/pages/Audit.tsx`**
- Check if `results` exists in the audit store
- If yes, render the `ResultsPage` instead of `AuditForm`
- This means `/audit` becomes the single entry point: it shows the form if no results exist, and shows results if they do

**`src/pages/Results.tsx`**
- Keep as-is (it also renders `ResultsPage`), but update the redirect: if `results` is null, redirect to `/audit` (already does this)

**`src/components/audit/ResultsPage.tsx`**
- Make the "Retake Assessment" card more prominent: move it higher in the layout, use `variant="hero"` button styling, larger text, and an eye-catching border/background
- The `handleStartOver` calls `reset()` which clears persisted data and navigates to `/audit`, which will now show the form since results are null

### User Flow After Fix

```text
1. User completes audit → results shown
2. User navigates away (to /vault, closes browser, etc.)
3. User returns to /audit → results page shown (not form)
4. User taps "Retake Assessment" → form resets, starts fresh
```

---

## Summary

| File | Change |
|------|--------|
| `src/components/workout/ExerciseCard.tsx` | Add video lookup from exercise_library + collapsible YouTube embed |
| `src/components/workout/ExerciseSearch.tsx` | Optionally merge exercise_library entries into search results |
| `src/stores/auditStore.ts` | Add Zustand persist middleware |
| `src/pages/Audit.tsx` | Show ResultsPage when results exist |
| `src/components/audit/ResultsPage.tsx` | Make "Retake Assessment" more prominent |

No database changes needed. No edge function changes.

