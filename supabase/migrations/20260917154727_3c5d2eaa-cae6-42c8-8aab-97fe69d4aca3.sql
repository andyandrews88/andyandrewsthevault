
-- 1. Relationship-based messaging entitlement (multi-coach ready)
CREATE OR REPLACE FUNCTION public.can_direct_message(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_a, 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.coach_client_relationships r
        WHERE r.status = 'active'
          AND r.service_tier = 'tier_1'
          AND ((r.coach_id = _a AND r.client_id = _b) OR (r.coach_id = _b AND r.client_id = _a))
      )
$$;

DROP POLICY IF EXISTS "Users can send DMs" ON public.direct_messages;
CREATE POLICY "Users can send DMs"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id AND public.can_direct_message(auth.uid(), to_user_id));

-- 2. Movement library: coach-managed only
DROP POLICY IF EXISTS "Users can submit pending exercises" ON public.exercise_library;

DROP POLICY IF EXISTS "Admins can insert exercise library" ON public.exercise_library;
CREATE POLICY "Coaches can insert exercise library"
ON public.exercise_library
FOR INSERT
TO authenticated
WITH CHECK (public.is_any_coach(auth.uid()));

DROP POLICY IF EXISTS "Admins can update exercise library" ON public.exercise_library;
CREATE POLICY "Coaches can update exercise library"
ON public.exercise_library
FOR UPDATE
TO authenticated
USING (public.is_any_coach(auth.uid()))
WITH CHECK (public.is_any_coach(auth.uid()));

-- 3. Integrity guards
CREATE UNIQUE INDEX IF NOT EXISTS coach_client_relationships_unique_pair
  ON public.coach_client_relationships (coach_id, client_id);

CREATE UNIQUE INDEX IF NOT EXISTS client_invites_unique_pending_email
  ON public.client_invites (coach_id, lower(email))
  WHERE status = 'pending';
