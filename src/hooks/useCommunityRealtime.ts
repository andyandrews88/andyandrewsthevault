import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityStore, CommunityMessage } from '@/stores/communityStore';

export function useCommunityRealtime() {
  const { addRealtimePost, removeRealtimePost, updateRealtimePost, fetchPosts } = useCommunityStore();

  useEffect(() => {
    const channel = supabase
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

    // Initial fetch
    fetchPosts();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addRealtimePost, removeRealtimePost, updateRealtimePost, fetchPosts]);
}
