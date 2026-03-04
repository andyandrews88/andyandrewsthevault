

# Fix: ExerciseCard Video Button Triggering Collapse

## Root Cause

The `CardHeader` on line 173 has an `onClick` handler that toggles collapse state. All buttons in the header (video play, move up/down, menu, collapse icon) are children of this header. While the exercise name area (left side) correctly calls `e.stopPropagation()`, the **right-side button container** (line 199) does NOT stop propagation. 

So when you click the Play/Video button, two things happen simultaneously:
1. `setShowVideo(!showVideo)` toggles the video on
2. The click bubbles up to `CardHeader`, which calls `setIsCollapsed(!isCollapsed)` and collapses the card

The video opens but the card collapses at the same time, making the video invisible inside `CollapsibleContent`.

## Fix

Add `onClick={(e) => e.stopPropagation()}` to the right-side button container div (line 199). This prevents clicks on ANY header button (video, move, menu, collapse chevron) from bubbling up to the `CardHeader` collapse handler.

Then make the `ChevronsUpDown` icon (line 301) a proper clickable element that explicitly toggles collapse, since it's currently just a passive icon relying on the header click.

## File Changes

**`src/components/workout/ExerciseCard.tsx`**:
- Line 199: Add `onClick={(e) => e.stopPropagation()}` to the buttons container div
- This single change fixes the video button, move buttons, and menu button all accidentally toggling collapse

