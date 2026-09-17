
-- 1) Active-only coach access
CREATE OR REPLACE FUNCTION public.is_coach_of(_coach_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_client_relationships r
    WHERE r.coach_id = _coach_id AND r.client_id = _client_id
      AND r.status = 'active'
  )
$$;

-- Historical/audit check that still recognises archived relationships
CREATE OR REPLACE FUNCTION public.was_coach_of(_coach_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_client_relationships r
    WHERE r.coach_id = _coach_id AND r.client_id = _client_id
      AND r.status IN ('active','archived')
  )
$$;
REVOKE ALL ON FUNCTION public.was_coach_of(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.was_coach_of(uuid, uuid) TO authenticated, service_role;

-- 2) No self-granted coach relationships
DROP POLICY IF EXISTS "Coaches manage their relationships insert" ON public.coach_client_relationships;
CREATE POLICY "Relationship insert via admin or self only"
ON public.coach_client_relationships
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (coach_id = auth.uid() AND client_id = auth.uid())
);

-- 3) No cross-client profile visibility
DROP POLICY IF EXISTS "View own, coach, and shared-coach profiles" ON public.user_profiles;
CREATE POLICY "View own and related coach profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.is_coach_of(auth.uid(), id)
  OR public.is_coach_of(id, auth.uid())
);
