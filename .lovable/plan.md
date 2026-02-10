

# Fix: Admin Role Not Recognized on Phone

## Root Cause

The `useAdminCheck` hook has a race condition. During initialization, `onAuthStateChange` fires multiple times (INITIAL_SESSION, then TOKEN_REFRESHED), each updating `user` and `isAuthenticated`. Every change triggers a new admin role query. On slower devices/networks (phone), these overlapping queries can:

1. Start a query before the session token is fully ready, causing it to fail
2. Have an older query's "not admin" result overwrite a newer query's "admin" result
3. Run with a stale or incomplete auth state

## Fix

### File: `src/hooks/useAdminCheck.ts`

Add proper cleanup/cancellation to the effect so stale queries don't overwrite fresh results:

- Add an `isCancelled` flag in the effect that gets set on cleanup
- Don't update state if the effect has been superseded by a newer run
- Add a small debounce: only run the check after auth state has settled (user and session both present)
- Use the session from authStore to ensure the token is ready before querying

```typescript
export function useAdminCheck() {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
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

        if (isCancelled) return; // Don't update if superseded

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error checking admin role:', err);
          setIsAdmin(false);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    checkAdminRole();

    return () => {
      isCancelled = true; // Cancel stale queries
    };
  }, [user, isAuthenticated, isInitialized]);

  return { isAdmin, isLoading };
}
```

Key changes:
- Added `isInitialized` to dependencies -- won't query until auth is fully ready
- Added `isCancelled` cleanup flag -- prevents stale results from overwriting fresh ones
- This ensures on phone, even if the effect fires 3 times in quick succession, only the last query's result sticks

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/useAdminCheck.ts` | Add cancellation flag and `isInitialized` gate to prevent race conditions |

One file changed. No database changes.
