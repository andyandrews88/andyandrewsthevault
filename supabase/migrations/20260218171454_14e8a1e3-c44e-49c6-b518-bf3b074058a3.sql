-- Add notification_preferences JSONB column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{"pr_badge_alerts": true, "announcement_alerts": true}'::jsonb;
