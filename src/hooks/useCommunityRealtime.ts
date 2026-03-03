import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityStore, CommunityMessage, DirectMessage } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';

export function useCommunityRealtime() {
  const { addRealtimePost, removeRealtimePost, updateRealtimePost, fetchPosts, activeChannelId, addRealtimeDm, fetchDirectMessages } = useCommunityStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const channelSub = supabase
      .channel('community_messages_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, (payload) => {
        addRealtimePost(payload.new as CommunityMessage);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_messages' }, (payload) => {
        removeRealtimePost((payload.old as { id: string }).id);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_messages' }, (payload) => {
        updateRealtimePost(payload.new as CommunityMessage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [addRealtimePost, removeRealtimePost, updateRealtimePost, activeChannelId]);

  // DM realtime: listen for new DMs sent TO this user, or FROM this user (for admin seeing their own sends)
  useEffect(() => {
    if (!user) return;

    const dmSub = supabase
      .channel('direct_messages_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        const dm = payload.new as DirectMessage;
        // Only process if this DM involves the current user
        if (dm.to_user_id === user.id || dm.from_user_id === user.id) {
          // Re-fetch all DMs to rebuild conversations properly
          fetchDirectMessages(user.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dmSub);
    };
  }, [user, fetchDirectMessages]);

  // Re-fetch when channel changes
  useEffect(() => {
    if (activeChannelId) {
      fetchPosts();
    }
  }, [activeChannelId, fetchPosts]);
}
