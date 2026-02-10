import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

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

    checkAdminRole();

    return () => {
      isCancelled = true;
    };
  }, [user, isAuthenticated, isInitialized]);

  return { isAdmin, isLoading };
}
