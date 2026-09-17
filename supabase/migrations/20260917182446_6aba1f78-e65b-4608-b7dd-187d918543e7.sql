
DROP POLICY IF EXISTS "View own and related coach profiles" ON public.user_profiles;
CREATE POLICY "View own and related coach profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.was_coach_of(auth.uid(), id)
  OR public.is_coach_of(id, auth.uid())
);
