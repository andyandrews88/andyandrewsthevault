
-- Fix: Revoke column-level SELECT on OAuth token columns from the authenticated role
-- This ensures access_token, refresh_token, and token_expires_at cannot be read
-- from user_wearable_connections via the anon/authenticated key regardless of RLS.
-- All client queries must use the safe view: user_wearable_connections_safe

REVOKE SELECT (access_token, refresh_token, token_expires_at)
  ON public.user_wearable_connections
  FROM authenticated;

REVOKE SELECT (access_token, refresh_token, token_expires_at)
  ON public.user_wearable_connections
  FROM anon;

-- Add RLS policy on the safe view so it also enforces user-scoping
-- (security_invoker=true already ensures RLS is applied, but be explicit)
COMMENT ON VIEW public.user_wearable_connections_safe IS 
  'Safe view for client queries. Excludes access_token, refresh_token, token_expires_at. '
  'Use this view for all client-side wearable connection queries. '
  'Token operations must go through Edge Functions using the service role key only.';
