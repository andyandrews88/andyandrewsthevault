
-- Membership helper: admin, any coach, or an active client of any coach.
CREATE OR REPLACE FUNCTION public.is_vault_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL
     AND (
       public.has_role(_user_id, 'admin'::app_role)
       OR EXISTS (
         SELECT 1 FROM public.coach_client_relationships r
         WHERE (r.coach_id = _user_id AND r.status = 'active')
            OR (r.client_id = _user_id AND r.status = 'active')
       )
     )
$$;

REVOKE EXECUTE ON FUNCTION public.is_vault_member(uuid) FROM anon;

-- Vault resources: members only, no anonymous access
DROP POLICY IF EXISTS "Anyone can view resources public" ON public.vault_resources;
DROP POLICY IF EXISTS "Anyone can view resources" ON public.vault_resources;
CREATE POLICY "Members can view resources"
ON public.vault_resources
FOR SELECT
TO authenticated
USING (public.is_vault_member(auth.uid()));

REVOKE SELECT ON public.vault_resources FROM anon;

-- Vault podcasts: members only
DROP POLICY IF EXISTS "Anyone can view podcasts" ON public.vault_podcasts;
CREATE POLICY "Members can view podcasts"
ON public.vault_podcasts
FOR SELECT
TO authenticated
USING (public.is_vault_member(auth.uid()));

REVOKE SELECT ON public.vault_podcasts FROM anon;

-- Vault files storage: members only (was any authenticated user)
DROP POLICY IF EXISTS "Authenticated users can access vault files via signed URLs" ON storage.objects;
CREATE POLICY "Members can read vault files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'vault-files' AND public.is_vault_member(auth.uid()));
