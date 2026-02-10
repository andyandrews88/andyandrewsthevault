
# AI-Powered Weekly Review

## What Changes

Replace the template-based `generateWriteup()` in `WeeklyReview.tsx` with a call to Lovable AI that receives all the user's weekly data and returns a personalised, coach-style write-up.

## How It Works

1. User opens the Dashboard tab
2. The stats grid loads as usual (instant, from the store)
3. A "Generate Review" button (or auto-trigger) sends the weekly data to an edge function
4. The edge function builds a prompt with all the numbers and asks Gemini to write a 3-4 sentence coaching-style summary
5. The response streams back and renders in the write-up box

## Files to Create

### 1. Edge Function: `supabase/functions/weekly-review/index.ts`

- Receives the weekly data object (workouts, volume, PRs, readiness avg/trend, lowest day, weight change)
- Builds a system prompt: *"You are a concise performance coach. Given this athlete's weekly data, write a 3-4 sentence review. Be direct, supportive, and actionable. Mention specific numbers. If something needs attention, say so."*
- Calls Lovable AI gateway (`google/gemini-3-flash-preview`) with streaming disabled (short response, no need to stream)
- Returns the generated text

### 2. Update `supabase/config.toml`

Add the `weekly-review` function entry with `verify_jwt = true` (only authenticated users should generate reviews).

### 3. Update `src/components/dashboard/WeeklyReview.tsx`

- Add state for `aiReview` (string) and `isGenerating` (boolean)
- Add a "Generate AI Review" button below the stats grid
- On click, call the edge function via `supabase.functions.invoke('weekly-review', { body: weeklyData })`
- Display the AI response in the write-up box, replacing the template text
- Cache the result in component state so it doesn't re-fetch on every render
- Keep the template-based fallback visible until the user clicks generate (so the card is never empty)
- Handle 429/402 errors with toast messages

## Edge Function Prompt Design

The prompt will include all available data points:

```
This athlete's past 7 days:
- Workouts completed: 4
- Total volume: 45,200 lbs
- New PRs: 1
- Average readiness: 78% (trending up from last week)
- Lowest readiness day: Wednesday
- Bodyweight: 185.2 -> 184.8 lbs (-0.4 lbs)

Write a 3-4 sentence weekly performance review. Be direct and coaching-oriented.
Mention specific numbers. If a metric needs attention, call it out with a suggestion.
```

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/weekly-review/index.ts` | Create -- edge function calling Lovable AI |
| `supabase/config.toml` | Update -- add function entry |
| `src/components/dashboard/WeeklyReview.tsx` | Update -- add AI generation button + state |

## UX Flow

- Stats grid loads instantly from the store (no change)
- Template write-up shows by default as a baseline
- User clicks "Generate AI Review" button
- Button shows loading spinner while generating
- AI review replaces the template text
- Error states show a toast and keep the template visible
