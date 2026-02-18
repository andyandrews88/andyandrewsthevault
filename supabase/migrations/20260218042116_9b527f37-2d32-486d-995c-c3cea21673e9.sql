-- Part 1: Fix Anonymous names - insert missing profiles for all auth users
INSERT INTO public.user_profiles (id, display_name)
SELECT 
  au.id,
  COALESCE(
    NULLIF(au.raw_user_meta_data->>'full_name', ''),
    split_part(au.email, '@', 1)
  )
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE up.id IS NULL;

-- Also update any existing "Anonymous" profiles with email-derived names
UPDATE public.user_profiles up
SET display_name = COALESCE(
  NULLIF(au.raw_user_meta_data->>'full_name', ''),
  split_part(au.email, '@', 1)
)
FROM auth.users au
WHERE up.id = au.id AND up.display_name = 'Anonymous';

-- Part 2: Create community_channels table
CREATE TABLE IF NOT EXISTS public.community_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'THE VAULT',
  order_index integer NOT NULL DEFAULT 0,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view channels"
  ON public.community_channels FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage channels"
  ON public.community_channels FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default channels
INSERT INTO public.community_channels (name, description, category, order_index) VALUES
  ('announcements', 'Official updates from Andy', 'THE VAULT', 0),
  ('general', 'General discussion', 'THE VAULT', 1),
  ('introductions', 'Introduce yourself to the community', 'THE VAULT', 2),
  ('pr-board', 'Share your personal records', 'TRAINING', 3),
  ('form-checks', 'Post videos for form feedback', 'TRAINING', 4),
  ('programming', 'Training program questions', 'TRAINING', 5),
  ('nutrition', 'Nutrition questions and wins', 'LIFESTYLE', 6),
  ('recovery', 'Sleep, mobility, recovery discussion', 'LIFESTYLE', 7);

-- Part 3: Add channel_id to community_messages
ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.community_channels(id) ON DELETE SET NULL;

-- Default existing messages to "general" channel
UPDATE public.community_messages
SET channel_id = (SELECT id FROM public.community_channels WHERE name = 'general' LIMIT 1)
WHERE channel_id IS NULL;

-- Enable realtime for community_channels
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_channels;

-- Part 4: Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their DMs"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Admins can send DMs"
  ON public.direct_messages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;