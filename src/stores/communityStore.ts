import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_coach: boolean;
}

export interface CommunityMessage {
  id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_thread_root: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  reply_count?: number;
}

interface CommunityState {
  posts: CommunityMessage[];
  currentThread: CommunityMessage | null;
  threadReplies: CommunityMessage[];
  userLikes: Set<string>;
  isLoading: boolean;
  threadDrawerOpen: boolean;
  profileCache: Map<string, UserProfile>;
  
  // Actions
  fetchPosts: () => Promise<void>;
  fetchThread: (messageId: string) => Promise<void>;
  fetchUserLikes: (userId: string) => Promise<void>;
  fetchProfile: (userId: string) => Promise<UserProfile | null>;
  createPost: (content: string, userId: string) => Promise<void>;
  createReply: (content: string, parentId: string, userId: string) => Promise<void>;
  toggleLike: (messageId: string, userId: string) => Promise<void>;
  deletePost: (messageId: string) => Promise<void>;
  openThreadDrawer: (message: CommunityMessage) => void;
  closeThreadDrawer: () => void;
  addRealtimePost: (post: CommunityMessage) => void;
  removeRealtimePost: (postId: string) => void;
  updateRealtimePost: (post: CommunityMessage) => void;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  currentThread: null,
  threadReplies: [],
  userLikes: new Set(),
  isLoading: false,
  threadDrawerOpen: false,
  profileCache: new Map(),

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

  fetchPosts: async () => {
    set({ isLoading: true });
    try {
      // Get all root posts
      const { data: posts, error: postsError } = await supabase
        .from('community_messages')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false });

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

      // Fetch profiles for each post
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

      // Get the parent message
      const { data: parent, error: parentError } = await supabase
        .from('community_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (parentError) throw parentError;

      const parentProfile = await fetchProfile(parent.user_id);

      // Get replies
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
    try {
      const { error } = await supabase
        .from('community_messages')
        .insert({
          content,
          user_id: userId,
          is_thread_root: true,
        });

      if (error) throw error;
      // Realtime will handle adding the post
    } catch (error) {
      console.error('Error creating post:', error);
    }
  },

  createReply: async (content: string, parentId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .insert({
          content,
          user_id: userId,
          parent_id: parentId,
          is_thread_root: false,
        });

      if (error) throw error;
      // Refresh thread to show new reply
      await get().fetchThread(parentId);
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  },

  toggleLike: async (messageId: string, userId: string) => {
    const { userLikes } = get();
    const isLiked = userLikes.has(messageId);

    // Optimistic update
    const newLikes = new Set(userLikes);
    if (isLiked) {
      newLikes.delete(messageId);
    } else {
      newLikes.add(messageId);
    }
    set({ userLikes: newLikes });

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
      
      // Refresh posts to get updated like counts
      await get().fetchPosts();
    } catch (error) {
      // Rollback on error
      set({ userLikes });
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
      // Realtime will handle removing the post
    } catch (error) {
      console.error('Error deleting post:', error);
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
    const { fetchProfile } = get();
    const profile = await fetchProfile(post.user_id);
    const postWithProfile = { ...post, user_profile: profile || undefined };

    if (post.is_thread_root) {
      set((state) => ({
        posts: [{ ...postWithProfile, reply_count: 0 }, ...state.posts],
      }));
    } else {
      // It's a reply - add to thread if viewing
      const { currentThread } = get();
      if (currentThread && post.parent_id === currentThread.id) {
        set((state) => ({
          threadReplies: [...state.threadReplies, postWithProfile],
        }));
      }
      // Update reply count on parent post
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
}));
