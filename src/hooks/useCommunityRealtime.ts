import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityStore, CommunityMessage, DirectMessage } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';

export function useCommunityRealtime() {
  const { addRealtimePost, removeRealtimePost, updateRealtimePost, fetchPosts, activeChannelId, addRealtimeDm } = useCommunityStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const channelSub = supabase
      .channel('community_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          const newPost = payload.new as CommunityMessage;
          addRealtimePost(newPost);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          removeRealtimePost((payload.old as { id: string }).id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          const updatedPost = payload.new as CommunityMessage;
          updateRealtimePost(updatedPost);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [addRealtimePost, removeRealtimePost, updateRealtimePost, activeChannelId]);

  // DM realtime subscription
  useEffect(() => {
    if (!user) return;

    const dmSub = supabase
      .channel('direct_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `to_user_id=eq.${user.id}`,
        },
        (payload) => {
          addRealtimeDm(payload.new as DirectMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dmSub);
    };
  }, [user, addRealtimeDm]);

  // Re-fetch when channel changes
  useEffect(() => {
    if (activeChannelId) {
      fetchPosts();
    }
  }, [activeChannelId, fetchPosts]);
}
