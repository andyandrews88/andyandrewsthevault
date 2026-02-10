

# Fix: Sign-In Button Showing "Signing In" Before User Input

## Root Cause

In `authStore.ts`, `isLoading` defaults to `true` (line 16). The Auth page button uses `isLoading` to both disable itself and display "Signing in..." text. Since `initialize()` is async, there's a window where `isLoading` is `true` before the session check completes, causing the button to appear stuck.

The real problem: `isLoading` is being used for TWO different purposes:
1. Initial auth initialization (should the whole page show a loader?)
2. Active sign-in/sign-up form submission (should the button show progress?)

These need to be separated.

## Fix

### File: `src/stores/authStore.ts`

- Change `isLoading` default from `true` to `false` -- this field should only represent active sign-in/sign-up actions
- The existing `isInitialized` field (defaults to `false`) already handles the initialization state separately
- No other changes needed -- `ProtectedRoute.tsx` already checks `isInitialized` independently

### File: `src/pages/Auth.tsx`

- No changes needed -- the button logic (`isLoading ? "Signing in..." : "Sign In"`) will now work correctly since `isLoading` starts as `false` and only becomes `true` during an actual sign-in attempt

## Summary

| File | Change |
|------|--------|
| `src/stores/authStore.ts` | Change `isLoading` initial value from `true` to `false` |

One line change. No database changes. No flow changes.

