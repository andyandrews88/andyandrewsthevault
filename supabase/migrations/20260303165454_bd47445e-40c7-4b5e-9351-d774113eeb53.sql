
-- Create a security definer function to check private_coaching_enabled
CREATE OR REPLACE FUNCTION public.has_private_coaching(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = _user_id
      AND private_coaching_enabled = true
  )
$$;

-- Drop existing policies on direct_messages
DROP POLICY IF EXISTS "Admins can send DMs" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can read their DMs" ON public.direct_messages;

-- SELECT: users can read their own DMs, admins can read ALL DMs
CREATE POLICY "Users can read their own DMs"
ON public.direct_messages
FOR SELECT
USING (
  auth.uid() = to_user_id
  OR auth.uid() = from_user_id
  OR public.has_role(auth.uid(), 'admin')
);

-- INSERT: admins can send to anyone; private coaching clients can send to admins
CREATE POLICY "Users can send DMs"
ON public.direct_messages
FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_private_coaching(auth.uid())
  )
);

-- UPDATE: allow marking messages as read (recipient only) or admin
CREATE POLICY "Users can update their DMs"
ON public.direct_messages
FOR UPDATE
USING (
  auth.uid() = to_user_id
  OR public.has_role(auth.uid(), 'admin')
);
