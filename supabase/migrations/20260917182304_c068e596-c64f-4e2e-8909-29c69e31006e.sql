
REVOKE ALL ON FUNCTION public.is_vault_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_vault_member(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_vault_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_vault_member(uuid) TO service_role;
