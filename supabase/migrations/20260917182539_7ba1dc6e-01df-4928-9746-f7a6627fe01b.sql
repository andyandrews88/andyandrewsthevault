
DROP POLICY IF EXISTS "Relationship insert via admin or self only" ON public.coach_client_relationships;
CREATE POLICY "Only admins can create relationships"
ON public.coach_client_relationships
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.protect_privileged_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_coach := OLD.is_coach;
    NEW.private_coaching_enabled := OLD.private_coaching_enabled;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_protect_privileged ON public.user_profiles;
CREATE TRIGGER user_profiles_protect_privileged
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_privileged_profile_columns();
