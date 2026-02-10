import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

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

  return { isAdmin, isLoading };
}
