

# Weekly Review: Collapsible Sections with Insufficient-Data Guidance

## What Changes

### 1. Accordion Behavior: One Section Open at a Time (Collapsed by Default)

Currently the accordion uses `type="multiple"` with all sections open by default. This defeats the purpose of sections -- everything is visible at once.

**Change:** Switch to `type="single" collapsible` with no `defaultValue`. All four sections render as collapsed cards. User taps Training to expand it, reads it, taps it to collapse, then taps Nutrition, and so on. Only one section is visible at a time.

Each collapsed card shows the icon + title as a button-like row with a chevron. Spacing between cards via the existing `space-y-2` class (bumped to `space-y-3` for more breathing room).

### 2. Insufficient Data: Per-Section Guidance

When the AI review has not been generated yet (no `aiReview`), instead of showing a single paragraph writeup, render the same 4 accordion cards but with **guidance content** instead of AI analysis.

Each section checks whether the user logged enough data for that category this week:

| Section | Has Data If... | Guidance When Missing |
|---------|---------------|----------------------|
| Training | `workoutsCompleted > 0` | "No workouts logged this week. Head to the Training tab and log your sessions -- include RIR on each set so we can assess your effort." |
| Nutrition | `weightStart && weightEnd` | "No weight entries this week. Log your bodyweight in Progress and track meals in Nutrition to get dietary insights." |
| Lifestyle | `avgReadiness > 0` | "No daily check-ins this week. Open the Lifestyle tab and complete your daily check-in -- rate sleep, stress, energy, and write a short note about your day." |
| Overall Summary | Any of the above missing | "We need more data to build your summary. Log workouts, check in daily, and track your weight. The more consistently you log, the better your AI review becomes." |

When data IS present but the AI review hasn't been generated yet, show the existing `generateWriteup()` text broken into the relevant section. But the key UX improvement is that when data is missing, each section explicitly tells the user what to do.

### 3. Visual Polish

- Each accordion item keeps the current styling: `rounded-lg border border-border/50 bg-muted/30 px-4`
- The trigger row has `hover:no-underline` (already set) so it feels like a card/button tap, not a link
- Add a subtle color accent to the icon when the section has data vs. when it's showing guidance (use `text-primary` for data, `text-muted-foreground` for guidance)

## File Changes

**`src/components/dashboard/WeeklyReview.tsx`** -- the only file that changes:

1. Change `<Accordion type="multiple" defaultValue={...}>` to `<Accordion type="single" collapsible>`
2. Remove `defaultValue` so all sections start collapsed
3. Add a `getGuidanceSections()` function that returns the 4 sections with guidance text when `aiReview` is null but `hasData` is partially true
4. When `aiReview` is null, render the guidance accordion instead of the single paragraph fallback
5. When `aiReview` exists, render the parsed AI sections as before (but now single-open)
6. Keep the "not enough data" empty state for when there is truly zero data across all categories

### Data Sufficiency Check Per Section

```text
Training sufficient:  workoutsCompleted > 0
Nutrition sufficient: weightStart != null && weightEnd != null
Lifestyle sufficient: avgReadiness > 0
Overall sufficient:   all three above are true
```

Each section that lacks data shows a guidance message with specific actions. Sections with data show a brief data summary (from the existing `generateWriteup` logic, split by category).

No edge function changes. No database changes. Single file edit.

