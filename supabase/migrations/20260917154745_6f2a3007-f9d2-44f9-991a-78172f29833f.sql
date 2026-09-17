
REVOKE EXECUTE ON FUNCTION public.can_direct_message(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.can_direct_message(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_client_access(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_client_access(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_any_coach(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_any_coach(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_coach_of(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_coach_of(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.shares_coach_with(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shares_coach_with(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_private_coaching(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_private_coaching(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.calc_estimated_1rm(numeric, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.calc_estimated_1rm(numeric, integer) TO authenticated;
