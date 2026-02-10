

# Complete Fix: Mobile Auth, Admin, and Data Sync

## Root Cause (affects EVERYTHING on mobile)

The `authStore.ts` `initialize()` function has a fundamental race condition between TWO competing auth state sources:

```text
Timeline on mobile:
1. onAuthStateChange registered
2. getSession() starts (network call to refresh expired token)
3. onAuthStateChange fires INITIAL_SESSION → sets user, isAuthenticated
   BUT does NOT set isInitialized (still false)
4. useAdminCheck sees isInitialized=false → bails, sets isAdmin=false
5. useUserDataSync sees isInitialized=false → bails, no data loaded
6. getSession() resolves → sets isInitialized=true
7. onAuthStateChange fires TOKEN_REFRESHED → sets NEW user object
   BUT user?.id is the same, so effects DON'T re-run
8. User sees: no admin, no data, no resources
```

On laptop, steps 2-6 happen almost instantly so the race doesn't matter. On mobile with slower networks, there's a significant gap.

Additionally, `useUserDataSync` sets `hasFetchedRef = true` BEFORE the database queries run. If those queries fail (expired token, network timeout), it never retries.

## Fix 1: authStore.ts - Eliminate the race condition

Remove `getSession()` entirely. Use `onAuthStateChange` with INITIAL_SESSION as the sole source of truth (this is the Supabase-recommended approach). Set `isInitialized: true` from within the listener itself, so auth state and initialization are ALWAYS atomic.

```typescript
initialize: async () => {
  if (get().isInitialized) return;

  supabase.auth.onAuthStateChange((event, session) => {
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session?.user,
      isInitialized: true, // Set on EVERY auth event, not separately
    });
  });
},
```

This guarantees that when `isInitialized` becomes `true`, the session/user/isAuthenticated are already correct -- no gap, no race.

## Fix 2: useAdminCheck.ts - Re-run on session changes

The current dependency `[user?.id, isAuthenticated, isInitialized]` misses token refreshes (same user ID, new session). Add the `session` object from authStore so the admin check re-runs when the session changes (e.g., after token refresh).

```typescript
export function useAdminCheck() {
  const { user, session, isAuthenticated, isInitialized } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function checkAdminRole() {
      if (!isInitialized || !isAuthenticated || !user) {
        if (!isCancelled) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (isCancelled) return;
        setIsAdmin(!error && !!data);
      } catch {
        if (!isCancelled) setIsAdmin(false);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    const timeoutId = setTimeout(() => checkAdminRole(), 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [user?.id, session?.access_token, isAuthenticated, isInitialized]);
  //          ^^^^^^^^^^^^^^^^^^^^^ NEW: re-run on token refresh

  return { isAdmin, isLoading };
}
```

## Fix 3: useUserDataSync.ts - Don't mark fetched before success

Move `hasFetchedRef.current = true` from BEFORE the queries to AFTER they succeed. This way, if the initial fetch fails (expired token, network issue), it will retry when auth state changes.

```typescript
// BEFORE (broken):
hasFetchedRef.current = true; // Set BEFORE queries
try {
  // queries that might fail...
}

// AFTER (fixed):
try {
  // queries...
  hasFetchedRef.current = true; // Set AFTER success
} catch (error) {
  // hasFetchedRef stays false, will retry
}
```

## Summary of All Changes

| File | Change | Why |
|------|--------|-----|
| `src/stores/authStore.ts` | Remove `getSession()`, set `isInitialized` inside `onAuthStateChange` | Eliminates the race condition between two competing state sources |
| `src/hooks/useAdminCheck.ts` | Add `session?.access_token` to effect dependencies | Re-runs admin check after token refresh |
| `src/hooks/useUserDataSync.ts` | Move `hasFetchedRef.current = true` after successful queries | Allows retry if initial fetch fails with expired token |

Three files changed. No database changes. These fixes address the root timing issues that cause all mobile failures.
