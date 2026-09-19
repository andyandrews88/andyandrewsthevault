import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { fetchUnreadCount } from "@/stores/conversationStore";

/**
 * Unread private-message count for the signed-in user.
 * Optionally scoped to one partner (used by the coach roster / client workspace).
 */
export function useUnreadMessages(fromUserId?: string) {
  const { user } = useAuthStore();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    setCount(await fetchUnreadCount(user.id, fromUserId));
  }, [user?.id, fromUserId]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const channel = supabase
      .channel(`unread-${user.id}-${fromUserId ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages", filter: `to_user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fromUserId, refresh]);

  return { unreadCount: count, refresh };
}
