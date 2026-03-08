

# Fix: Time-Based Metrics Not Updating + Admin Drawer Scroll Frozen on Mobile

## Issue 1: Time-Based Toggle Not Reflecting

**Root cause**: Two problems working together:

1. In `ExerciseActionSheet` (mobile), the `handleAction` wrapper calls `onMetadataChange` and then immediately closes the drawer via `onOpenChange(false)`. While the `setIsTimed(true)` call happens synchronously, closing the drawer triggers a re-render cascade. The Radix Drawer unmount animation can cause React to batch these state updates in a way where the parent's `isTimed` state update is effectively swallowed by the drawer close re-render.

2. The `ExerciseCard` useEffect on lines 118-136 fetches from the DB on mount based on `exercise.exercise_name`. The `upsertExerciseLibraryField` call is async and NOT awaited in the action handler, so if there's any re-mount triggered by the drawer close, the useEffect re-fetches from DB before the upsert has completed, overwriting the optimistic state with the old DB value.

**Fix in `ExerciseActionSheet.tsx`**:
- Make metadata actions NOT close the drawer immediately. Instead, call `onMetadataChange` and let the user see the change, then close manually. Or: delay the close until after the upsert completes.
- Simplest fix: Remove `handleAction` wrapping for metadata changes. Call `onMetadataChange` synchronously, await the upsert, then close the sheet.

**Fix in `ExerciseCard.tsx`**:
- Add a `metadataVersion` counter state that increments when `onMetadataChange` is called. This prevents the mount useEffect from overwriting optimistic state.
- Make the useEffect skip fetching if metadata was just locally updated (guard with a ref).

## Issue 2: Admin Drawer Frozen / Can't Scroll on Mobile

**Root cause**: The `SheetContent` component uses `fixed inset-y-0` positioning with `overflow-y-auto` applied directly. On mobile browsers (especially iOS Safari), scroll inside fixed-position elements often fails because:

1. The Sheet overlay intercepts touch events
2. The `SheetContent` doesn't have a proper flex layout — the header and content area are both inside the scrollable container, but there's no explicit height constraint forcing the content to overflow

**Fix in `AdminDetailDrawer.tsx`**:
- Restructure SheetContent to use `flex flex-col` with the header as a fixed section and the content area as `flex-1 overflow-y-auto`
- Add `overscroll-behavior-y: contain` and `-webkit-overflow-scrolling: touch` to the scrollable content area
- Move `overflow-y-auto` from SheetContent to the inner content div, and give SheetContent `overflow-hidden` instead

## Files to Modify

| File | Change |
|------|--------|
| `src/components/workout/ExerciseActionSheet.tsx` | Stop immediately closing drawer for metadata actions; await upsert then close |
| `src/components/workout/ExerciseCard.tsx` | Add guard to prevent useEffect from overwriting optimistic metadata state |
| `src/components/admin/AdminDetailDrawer.tsx` | Fix flex layout for proper mobile scrolling inside Sheet |

