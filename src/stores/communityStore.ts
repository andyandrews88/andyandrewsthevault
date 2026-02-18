import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_coach: boolean;
}

export interface CommunityChannel {
  id: string;
  name: string;
  description: string | null;
  category: string;
  order_index: number;
  is_locked: boolean;
  created_at: string;
}

export interface CommunityMessage {
  id: string;
  user_id: string;
  parent_id: string | null;
  channel_id: string | null;
  content: string;
  is_thread_root: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  reply_count?: number;
  isOptimistic?: boolean;
}

export interface DirectMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  from_profile?: UserProfile;
}

interface CommunityState {
  posts: CommunityMessage[];
  channels: CommunityChannel[];
  activeChannelId: string | null;
  currentThread: CommunityMessage | null;
  threadReplies: CommunityMessage[];
  userLikes: Set<string>;
  isLoading: boolean;
  isChannelsLoading: boolean;
  threadDrawerOpen: boolean;
  profileCache: Map<string, UserProfile>;
  directMessages: DirectMessage[];
  unreadDmCount: number;
  activeDmUserId: string | null;

  // Actions
  fetchChannels: () => Promise<void>;
  setActiveChannel: (channelId: string) => void;
  fetchPosts: () => Promise<void>;
  fetchThread: (messageId: string) => Promise<void>;
  fetchUserLikes: (userId: string) => Promise<void>;
  fetchProfile: (userId: string) => Promise<UserProfile | null>;
  createPost: (content: string, userId: string) => Promise<void>;
  createReply: (content: string, parentId: string, userId: string) => Promise<void>;
  toggleLike: (messageId: string, userId: string) => Promise<void>;
  deletePost: (messageId: string) => Promise<void>;
  updatePost: (messageId: string, content: string) => Promise<void>;
  openThreadDrawer: (message: CommunityMessage) => void;
  closeThreadDrawer: () => void;
  addRealtimePost: (post: CommunityMessage) => void;
  removeRealtimePost: (postId: string) => void;
  updateRealtimePost: (post: CommunityMessage) => void;

  // Channel management (admin)
  updateChannel: (channelId: string, updates: Partial<Pick<CommunityChannel, 'name' | 'description' | 'category' | 'is_locked'>>) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
  createChannel: (name: string, description: string, category: string) => Promise<void>;

  // DM actions
  fetchDirectMessages: (currentUserId: string) => Promise<void>;
  sendDirectMessage: (fromUserId: string, toUserId: string, content: string) => Promise<void>;
  markDmsRead: (fromUserId: string, currentUserId: string) => Promise<void>;
  setActiveDmUser: (userId: string | null) => void;
  addRealtimeDm: (dm: DirectMessage) => void;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  channels: [],
  activeChannelId: null,
  currentThread: null,
  threadReplies: [],
  userLikes: new Set(),
  isLoading: false,
  isChannelsLoading: false,
  threadDrawerOpen: false,
  profileCache: new Map(),
  directMessages: [],
  unreadDmCount: 0,
  activeDmUserId: null,

  fetchProfile: async (userId: string) => {
    const { profileCache } = get();
    if (profileCache.has(userId)) {
      return profileCache.get(userId)!;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    const profile: UserProfile = {
      id: data.id,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
      is_coach: data.is_coach,
    };

    set((state) => ({
      profileCache: new Map(state.profileCache).set(userId, profile),
    }));

    return profile;
  },

  fetchChannels: async () => {
    set({ isChannelsLoading: true });
    try {
      const { data, error } = await supabase
        .from('community_channels')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      const channels = (data || []) as CommunityChannel[];
      set({ channels, isChannelsLoading: false });

      // Auto-select 'general' if no active channel
      const { activeChannelId } = get();
      if (!activeChannelId && channels.length > 0) {
        const general = channels.find(c => c.name === 'general') || channels[0];
        set({ activeChannelId: general.id });
        get().fetchPosts();
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      set({ isChannelsLoading: false });
    }
  },

  setActiveChannel: (channelId: string) => {
    set({ activeChannelId: channelId, posts: [], activeDmUserId: null });
    get().fetchPosts();
  },

  fetchPosts: async () => {
    const { activeChannelId } = get();
    if (!activeChannelId) return;

    set({ isLoading: true });
    try {
      const { data: posts, error: postsError } = await supabase
        .from('community_messages')
        .select('*')
        .is('parent_id', null)
        .eq('channel_id', activeChannelId)
        .order('created_at', { ascending: true });

      if (postsError) throw postsError;

      if (!posts || posts.length === 0) {
        set({ posts: [], isLoading: false });
        return;
      }

      // Get reply counts
      const postIds = posts.map(p => p.id);
      const { data: replyCounts } = await supabase
        .from('community_messages')
        .select('parent_id')
        .in('parent_id', postIds);

      const countMap = (replyCounts || []).reduce((acc, reply) => {
        acc[reply.parent_id!] = (acc[reply.parent_id!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const { fetchProfile } = get();
      const postsWithProfiles = await Promise.all(
        posts.map(async (post) => {
          const profile = await fetchProfile(post.user_id);
          return {
            ...post,
            user_profile: profile || undefined,
            reply_count: countMap[post.id] || 0,
          } as CommunityMessage;
        })
      );

      set({ posts: postsWithProfiles, isLoading: false });
    } catch (error) {
      console.error('Error fetching posts:', error);
      set({ isLoading: false });
    }
  },

  fetchThread: async (messageId: string) => {
    try {
      const { fetchProfile } = get();

      const { data: parent, error: parentError } = await supabase
        .from('community_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (parentError) throw parentError;

      const parentProfile = await fetchProfile(parent.user_id);

      const { data: replies, error: repliesError } = await supabase
        .from('community_messages')
        .select('*')
        .eq('parent_id', messageId)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      const repliesWithProfiles = await Promise.all(
        (replies || []).map(async (reply) => {
          const profile = await fetchProfile(reply.user_id);
          return {
            ...reply,
            user_profile: profile || undefined,
          } as CommunityMessage;
        })
      );

      set({
        currentThread: { ...parent, user_profile: parentProfile || undefined } as CommunityMessage,
        threadReplies: repliesWithProfiles,
      });
    } catch (error) {
      console.error('Error fetching thread:', error);
    }
  },

  fetchUserLikes: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_likes')
        .select('message_id')
        .eq('user_id', userId);

      if (error) throw error;

      const likedIds = new Set(data?.map(l => l.message_id) || []);
      set({ userLikes: likedIds });
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  },

  createPost: async (content: string, userId: string) => {
    const { activeChannelId, fetchProfile } = get();
    if (!activeChannelId) return;

    // Optimistic update
    const optimisticId = `optimistic-${Date.now()}`;
    const profile = await fetchProfile(userId);

    const optimisticPost: CommunityMessage = {
      id: optimisticId,
      user_id: userId,
      parent_id: null,
      channel_id: activeChannelId,
      content,
      is_thread_root: true,
      likes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_profile: profile || undefined,
      reply_count: 0,
      isOptimistic: true,
    };

    set((state) => ({ posts: [...state.posts, optimisticPost] }));

    try {
      const { error } = await supabase
        .from('community_messages')
        .insert({
          content,
          user_id: userId,
          channel_id: activeChannelId,
          is_thread_root: true,
        });

      if (error) throw error;
      // Realtime will replace the optimistic post
    } catch (error) {
      // Rollback optimistic update
      set((state) => ({ posts: state.posts.filter(p => p.id !== optimisticId) }));
      console.error('Error creating post:', error);
    }
  },

  createReply: async (content: string, parentId: string, userId: string) => {
    try {
      const { activeChannelId } = get();
      const { error } = await supabase
        .from('community_messages')
        .insert({
          content,
          user_id: userId,
          parent_id: parentId,
          channel_id: activeChannelId,
          is_thread_root: false,
        });

      if (error) throw error;
      await get().fetchThread(parentId);
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  },

  toggleLike: async (messageId: string, userId: string) => {
    const { userLikes } = get();
    const isLiked = userLikes.has(messageId);

    const newLikes = new Set(userLikes);
    if (isLiked) {
      newLikes.delete(messageId);
    } else {
      newLikes.add(messageId);
    }
    set({ userLikes: newLikes });

    // Optimistic like count update
    set((state) => ({
      posts: state.posts.map(p =>
        p.id === messageId
          ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) }
          : p
      ),
    }));

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('community_likes')
          .delete()
          .eq('user_id', userId)
          .eq('message_id', messageId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('community_likes')
          .insert({ user_id: userId, message_id: messageId });

        if (error) throw error;
      }
    } catch (error) {
      // Rollback
      set({ userLikes });
      set((state) => ({
        posts: state.posts.map(p =>
          p.id === messageId
            ? { ...p, likes_count: p.likes_count + (isLiked ? 1 : -1) }
            : p
        ),
      }));
      console.error('Error toggling like:', error);
    }
  },

  deletePost: async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  },

  updatePost: async (messageId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .update({ content })
        .eq('id', messageId);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === messageId ? { ...p, content } : p
        ),
        threadReplies: state.threadReplies.map((r) =>
          r.id === messageId ? { ...r, content } : r
        ),
        currentThread:
          state.currentThread?.id === messageId
            ? { ...state.currentThread, content }
            : state.currentThread,
      }));
    } catch (error) {
      console.error('Error updating post:', error);
    }
  },

  updateChannel: async (channelId, updates) => {
    try {
      const { data, error } = await supabase
        .from('community_channels')
        .update(updates)
        .eq('id', channelId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        channels: state.channels.map((ch) =>
          ch.id === channelId ? { ...ch, ...data } : ch
        ),
      }));
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  },

  deleteChannel: async (channelId) => {
    try {
      const { error } = await supabase
        .from('community_channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;

      set((state) => {
        const remaining = state.channels.filter((ch) => ch.id !== channelId);
        const newActiveId =
          state.activeChannelId === channelId
            ? remaining[0]?.id || null
            : state.activeChannelId;
        return { channels: remaining, activeChannelId: newActiveId };
      });

      // Reload posts for the new active channel
      const { activeChannelId } = get();
      if (activeChannelId) get().fetchPosts();
    } catch (error) {
      console.error('Error deleting channel:', error);
      throw error;
    }
  },

  createChannel: async (name, description, category) => {
    try {
      const maxOrder = Math.max(0, ...get().channels.map((ch) => ch.order_index));
      const { data, error } = await supabase
        .from('community_channels')
        .insert({ name, description, category, order_index: maxOrder + 1 })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        channels: [...state.channels, data as CommunityChannel],
      }));
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  },

  openThreadDrawer: (message: CommunityMessage) => {
    set({ threadDrawerOpen: true, currentThread: message });
    get().fetchThread(message.id);
  },

  closeThreadDrawer: () => {
    set({ threadDrawerOpen: false, currentThread: null, threadReplies: [] });
  },

  addRealtimePost: async (post: CommunityMessage) => {
    const { fetchProfile, activeChannelId } = get();

    // Only show posts for the active channel
    if (post.channel_id !== activeChannelId) return;

    // Remove any optimistic post with same content from same user
    set((state) => ({
      posts: state.posts.filter(p => !p.isOptimistic || p.user_id !== post.user_id),
    }));

    const profile = await fetchProfile(post.user_id);
    const postWithProfile = { ...post, user_profile: profile || undefined };

    if (post.is_thread_root || !post.parent_id) {
      set((state) => ({
        posts: [...state.posts.filter(p => !p.isOptimistic), { ...postWithProfile, reply_count: 0 }],
      }));
    } else {
      const { currentThread } = get();
      if (currentThread && post.parent_id === currentThread.id) {
        set((state) => ({
          threadReplies: [...state.threadReplies, postWithProfile],
        }));
      }
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === post.parent_id
            ? { ...p, reply_count: (p.reply_count || 0) + 1 }
            : p
        ),
      }));
    }
  },

  removeRealtimePost: (postId: string) => {
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
      threadReplies: state.threadReplies.filter((r) => r.id !== postId),
    }));
  },

  updateRealtimePost: (post: CommunityMessage) => {
    set((state) => ({
      posts: state.posts.map((p) => (p.id === post.id ? { ...p, ...post } : p)),
      threadReplies: state.threadReplies.map((r) =>
        r.id === post.id ? { ...r, ...post } : r
      ),
      currentThread:
        state.currentThread?.id === post.id
          ? { ...state.currentThread, ...post }
          : state.currentThread,
    }));
  },

  // DM actions
  fetchDirectMessages: async (currentUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`to_user_id.eq.${currentUserId},from_user_id.eq.${currentUserId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const { fetchProfile } = get();
      const dmsWithProfiles = await Promise.all(
        (data || []).map(async (dm) => {
          const fromProfile = await fetchProfile(dm.from_user_id);
          return { ...dm, from_profile: fromProfile || undefined } as DirectMessage;
        })
      );

      const unreadCount = dmsWithProfiles.filter(
        dm => dm.to_user_id === currentUserId && !dm.is_read
      ).length;

      set({ directMessages: dmsWithProfiles, unreadDmCount: unreadCount });
    } catch (error) {
      console.error('Error fetching DMs:', error);
    }
  },

  sendDirectMessage: async (fromUserId: string, toUserId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({ from_user_id: fromUserId, to_user_id: toUserId, content });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending DM:', error);
      throw error;
    }
  },

  markDmsRead: async (fromUserId: string, currentUserId: string) => {
    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', currentUserId)
        .eq('is_read', false);

      set((state) => ({
        directMessages: state.directMessages.map(dm =>
          dm.from_user_id === fromUserId && dm.to_user_id === currentUserId
            ? { ...dm, is_read: true }
            : dm
        ),
        unreadDmCount: Math.max(0, state.unreadDmCount - state.directMessages.filter(
          dm => dm.from_user_id === fromUserId && dm.to_user_id === currentUserId && !dm.is_read
        ).length),
      }));
    } catch (error) {
      console.error('Error marking DMs read:', error);
    }
  },

  setActiveDmUser: (userId: string | null) => {
    set({ activeDmUserId: userId, activeChannelId: userId ? null : get().activeChannelId });
  },

  addRealtimeDm: async (dm: DirectMessage) => {
    const { fetchProfile } = get();
    const fromProfile = await fetchProfile(dm.from_user_id);
    const dmWithProfile = { ...dm, from_profile: fromProfile || undefined };

    set((state) => ({
      directMessages: [...state.directMessages, dmWithProfile],
      unreadDmCount: state.unreadDmCount + (dm.is_read ? 0 : 1),
    }));
  },
}));
