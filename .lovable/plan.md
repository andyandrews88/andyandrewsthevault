

# Fix Admin Options Not Showing in Exercise Menu

## Root Cause
The `AdminExerciseMenu` component calls `useAdminCheck()` internally, which has a **300ms delay** before querying the database. Since the component mounts when the dropdown opens, it initially renders with `isAdmin = false` and returns `null`. By the time the async check completes, the menu is already rendered without the admin items.

## Fix
Lift the admin check up to `ExerciseCard` (which is already mounted and has time to resolve) and pass `isAdmin` as a prop to `AdminExerciseMenu`.

### `src/components/workout/ExerciseCard.tsx`
- Import `useAdminCheck`
- Call `useAdminCheck()` at the component level (already mounted, plenty of time to resolve)
- Pass `isAdmin` prop to `AdminExerciseMenu`

### `src/components/workout/AdminExerciseMenu.tsx`
- Change props to accept `isAdmin: boolean` instead of calling `useAdminCheck()` internally
- Remove the `useAdminCheck` import and hook call
- Keep the `if (!isAdmin) return null` guard using the prop

## Files Changed

| File | Change |
|------|--------|
| `src/components/workout/ExerciseCard.tsx` | Add `useAdminCheck()` call, pass `isAdmin` prop |
| `src/components/workout/AdminExerciseMenu.tsx` | Accept `isAdmin` prop instead of internal hook |

