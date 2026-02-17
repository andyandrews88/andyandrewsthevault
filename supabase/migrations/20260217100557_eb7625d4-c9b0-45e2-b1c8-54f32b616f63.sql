-- Backfill existing "Anonymous" user profiles with email-derived display names
UPDATE public.user_profiles
SET display_name = split_part(
  (SELECT email FROM auth.users WHERE auth.users.id = user_profiles.id),
  '@', 1
)
WHERE display_name = 'Anonymous';