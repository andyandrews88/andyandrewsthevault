

# Feed Daily Check-In Notes into AI Weekly Review

## What Changes

The `dashboardStore` already fetches check-in data for readiness scores but discards the `notes` field. We'll collect those notes for the past 7 days and pass them to the `weekly-review` edge function, where the AI prompt will be updated to interpret subjective context (sleep issues, stress, pain, nutrition, mood) alongside the hard numbers.

## Implementation

### 1. dashboardStore.ts -- Collect notes from check-ins

- The existing check-in query already fetches from `user_daily_checkins` for the past 7 days
- Add `notes` to the select fields and collect them into a new `WeeklyData` field: `checkinNotes: { date: string; note: string }[]`
- Only include entries where `notes` is non-empty

### 2. WeeklyReview.tsx -- Pass notes to edge function

- Include the `checkinNotes` array in the `weeklyData` payload sent to the `weekly-review` function
- No UI changes needed -- the notes are already visible in the Daily Check-In card

### 3. weekly-review edge function -- Update prompt

- If `checkinNotes` exists and has entries, add a new section to the prompt:
  ```
  Daily check-in notes from this week:
  - Monday: "Didn't sleep well, stressed about work"
  - Wednesday: "Felt great, energy was high"
  - Friday: "Lower back tight after deadlifts"
  ```
- Each note truncated to 150 characters to manage prompt size
- Update the system prompt to instruct the AI to:
  - Look for patterns in the subjective notes (recurring stress, sleep issues, pain)
  - Correlate notes with readiness scores and workout performance
  - Provide lifestyle recommendations based on what the user reported (not just training advice)
  - Never echo back sensitive personal details verbatim -- synthesize and advise
  - Keep the review to 4-6 sentences (slight increase from 3-5 to accommodate the richer data)

## Files Changed

| File | Change |
|------|--------|
| `src/stores/dashboardStore.ts` | Add `checkinNotes` to `WeeklyData`, collect notes from existing check-in query |
| `src/components/dashboard/WeeklyReview.tsx` | No change needed -- `weeklyData` already passed as-is to edge function |
| `supabase/functions/weekly-review/index.ts` | Add notes section to prompt, update system prompt for subjective data interpretation |

## Technical Details

### dashboardStore.ts

Add to `WeeklyData` interface:
```typescript
checkinNotes: { date: string; note: string }[];
```

In the existing check-in fetch block, after computing readiness scores, also collect notes:
```typescript
const notes = checkins
  .filter(c => c.notes && c.notes.trim())
  .map(c => ({ date: c.check_date, note: c.notes.slice(0, 150) }));
```

### weekly-review/index.ts

Add after the existing data lines:
```typescript
if (d.checkinNotes && d.checkinNotes.length > 0) {
  lines.push("");
  lines.push("Daily check-in notes from this week:");
  for (const n of d.checkinNotes) {
    lines.push(`- ${n.date}: "${n.note}"`);
  }
}
```

Update system prompt to include:
```
If daily check-in notes are provided, look for patterns (recurring stress, sleep issues, pain, nutrition problems) and correlate them with the performance data. Provide lifestyle recommendations where relevant. Do not echo back sensitive details verbatim — synthesize and advise.
```
