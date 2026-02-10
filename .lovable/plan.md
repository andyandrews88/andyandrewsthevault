

# Fix: Admin Not Working on Mobile + Library Showing Demo Data

## Problem 1: Admin Not Recognized on Mobile

**Root cause:** The `useAdminCheck` effect depends on the `user` object reference (`[user, isAuthenticated, isInitialized]`). On mobile, `onAuthStateChange` fires multiple times in quick succession (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED), and each event creates a NEW `user` object. Even though it's the same user, the different object reference triggers the effect to re-run and cancel the previous in-flight database query via `isCancelled`. On a slow mobile connection, the admin query never gets a chance to complete before being cancelled by the next auth event.

**Fix in `src/hooks/useAdminCheck.ts`:**
- Change dependency from `user` to `user?.id` (a stable string, not a changing object reference)
- This means the effect only re-runs when the actual user changes, not when the session refreshes
- Add a `setTimeout` debounce (300ms) before running the query to let all rapid auth events settle first

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

        if (isCancelled) return;

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

    // Debounce to let rapid auth events settle (mobile)
    const timeoutId = setTimeout(() => {
      checkAdminRole();
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [user?.id, isAuthenticated, isInitialized]);
  //    ^^^^^^^ stable string instead of object reference

  return { isAdmin, isLoading };
}
```

---

## Problem 2: Library Showing Demo Data

**Root cause:** Two compounding issues:

1. The `vault_resources` table has RLS enabled with a SELECT policy that only allows the `authenticated` role. When the LibraryTab mounts and calls `fetchResources()`, the auth session may not be established yet (especially on mobile). The query runs as `anon`, gets back 0 rows (not an error), and the code sees `dbResources.length === 0` and falls back to static demo data.

2. `loadResources()` runs once on mount via `useEffect([], [])` and never retries, even after auth succeeds.

**Fix 1 -- Database: Allow public read access to vault_resources:**
Resources are educational content meant to be visible to all users. Add an `anon` SELECT policy so resources load regardless of auth state.

```sql
CREATE POLICY "Anyone can view resources public"
  ON public.vault_resources
  FOR SELECT
  TO anon
  USING (true);
```

**Fix 2 -- `src/components/vault/LibraryTab.tsx`:**
Add auth state awareness so resources are refetched once auth is ready (for cases where the initial load returned empty):

```typescript
// Add import
import { useAuthStore } from '@/stores/authStore';

// Inside component
const { isAuthenticated } = useAuthStore();

// Change useEffect to also trigger on auth changes
useEffect(() => {
  loadResources();
}, [isAuthenticated]);
```

This ensures that even if the first fetch returned empty due to auth timing, it retries once the user is authenticated.

---

## Summary of All Changes

| File / Area | Change |
|-------------|--------|
| `src/hooks/useAdminCheck.ts` | Use `user?.id` instead of `user` in deps; add 300ms debounce |
| Database migration | Add `anon` SELECT policy on `vault_resources` |
| `src/components/vault/LibraryTab.tsx` | Refetch resources when auth state changes |

No breaking changes. No schema changes beyond the new policy.

