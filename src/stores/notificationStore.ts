import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

const COMMUNITY_VISITED_KEY = 'community_last_visited';

export interface NotificationPrefs {
  announcement_alerts: boolean;
  pr_badge_alerts: boolean;
}

interface NotificationState {
  hasNewAnnouncement: boolean;
  prefs: NotificationPrefs;
  isPrefsLoaded: boolean;

  // Actions
  checkForNewAnnouncements: () => Promise<void>;
  markCommunityVisited: () => void;
  markAnnouncementsRead: () => void;
  loadNotificationPrefs: (userId: string) => Promise<void>;
  saveNotificationPrefs: (userId: string, prefs: NotificationPrefs) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  hasNewAnnouncement: false,
  prefs: {
    announcement_alerts: true,
    pr_badge_alerts: true,
  },
  isPrefsLoaded: false,

  checkForNewAnnouncements: async () => {
    const { prefs } = get();
    // If user disabled announcement alerts, never show the dot
    if (!prefs.announcement_alerts) {
      set({ hasNewAnnouncement: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        set({ hasNewAnnouncement: false });
        return;
      }

      const lastVisited = localStorage.getItem(COMMUNITY_VISITED_KEY);
      const mostRecentAnnouncementAt = data[0].created_at;

      if (!lastVisited) {
        // Never visited — show the dot
        set({ hasNewAnnouncement: true });
        return;
      }

      const hasNew = new Date(mostRecentAnnouncementAt) > new Date(lastVisited);
      set({ hasNewAnnouncement: hasNew });
    } catch (err) {
      console.error('Error checking announcements:', err);
    }
  },

  markCommunityVisited: () => {
    localStorage.setItem(COMMUNITY_VISITED_KEY, new Date().toISOString());
    set({ hasNewAnnouncement: false });
  },

  markAnnouncementsRead: () => {
    localStorage.setItem(COMMUNITY_VISITED_KEY, new Date().toISOString());
    set({ hasNewAnnouncement: false });
  },

  loadNotificationPrefs: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (error || !data) return;

      const raw = data.notification_preferences as Record<string, unknown>;
      const prefs: NotificationPrefs = {
        announcement_alerts: raw?.announcement_alerts !== false,
        pr_badge_alerts: raw?.pr_badge_alerts !== false,
      };

      set({ prefs, isPrefsLoaded: true });

      // Re-check announcement state with the loaded prefs applied
      get().checkForNewAnnouncements();
    } catch (err) {
      console.error('Error loading notification prefs:', err);
    }
  },

  saveNotificationPrefs: async (userId: string, prefs: NotificationPrefs) => {
    set({ prefs });

    // If announcements just got disabled, clear the dot
    if (!prefs.announcement_alerts) {
      set({ hasNewAnnouncement: false });
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ notification_preferences: prefs as unknown as import('@/integrations/supabase/types').Json })
        .eq('id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error saving notification prefs:', err);
    }
  },
}));
