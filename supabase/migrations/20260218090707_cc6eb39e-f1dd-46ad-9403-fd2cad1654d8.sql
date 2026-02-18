-- Fix: Restrict user_profiles SELECT to authenticated users only
-- Previously "Anyone can view profiles" used USING (true), allowing unauthenticated scraping
-- of all user display names and IDs. Restricting to authenticated users preserves all
-- app functionality (community posts still show profiles) while blocking unauthenticated harvesting.

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.user_profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);
