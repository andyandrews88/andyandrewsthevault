
-- Add private coaching flag to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN private_coaching_enabled boolean NOT NULL DEFAULT false;

-- Allow clients to view their own PT packages
CREATE POLICY "Clients can view their own packages"
ON public.pt_packages
FOR SELECT
TO authenticated
USING (auth.uid() = client_user_id);

-- Allow clients to view their own PT sessions
CREATE POLICY "Clients can view their own sessions"
ON public.pt_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = client_user_id);
