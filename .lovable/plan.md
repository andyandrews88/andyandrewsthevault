

# Fix: Sign-Out Dead Button and Admin Recognition

## Issue 1: Sign-Out Button Not Working

**Root cause:** The `signOut` function in `authStore.ts` sets `isLoading: true` before calling `supabase.auth.signOut()`. When sign-out succeeds, the `onAuthStateChange` listener fires and sets `isAuthenticated: false`, which causes the Navbar to immediately re-render and unmount the dropdown menu -- killing the `handleSignOut` function mid-execution before `navigate("/")` can run.

**Fix in `src/stores/authStore.ts`:**
- Remove `set({ isLoading: true })` from the `signOut` function. There's no UI reason to show a loading state for sign-out -- it should be instant. This prevents the race condition with the re-render.

**Fix in `src/components/layout/Navbar.tsx`:**
- Change `handleSignOut` to navigate FIRST, then sign out. This ensures the navigation happens before the auth state change triggers a re-render that unmounts the dropdown.

## Issue 2: Admin Role Not Recognized

**Root cause:** `andyandrewscf@gmail.com` IS the admin in the database (confirmed). The issue is that `initialize()` is called in BOTH `App.tsx` (line 24) and `Auth.tsx` (line 26). Each call to `initialize()` registers a NEW `onAuthStateChange` listener without cleaning up the previous one. This causes duplicate listener registrations and potential race conditions where auth state updates fire multiple times with stale closures.

**Fix in `src/stores/authStore.ts`:**
- Add a guard in `initialize()` to prevent multiple listener registrations. Track whether initialization has already been done and skip if so.

**Fix in `src/pages/Auth.tsx`:**
- Remove the redundant `initialize()` call since `App.tsx` already handles initialization at the app root level.

## Summary of Changes

| File | Change |
|------|--------|
| `src/stores/authStore.ts` | Remove `isLoading` from signOut; add initialization guard to prevent duplicate listeners |
| `src/components/layout/Navbar.tsx` | Navigate before signing out to avoid unmount race |
| `src/pages/Auth.tsx` | Remove duplicate `initialize()` call |

No database changes. No flow changes.

