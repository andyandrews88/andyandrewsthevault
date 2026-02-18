
-- Fix Security Definer View warning: recreate view with SECURITY INVOKER
-- so it respects the querying user's RLS policies, not the view creator's.

DROP VIEW IF EXISTS public.user_wearable_connections_safe;

CREATE OR REPLACE VIEW public.user_wearable_connections_safe
  WITH (security_invoker = true)
AS
  SELECT
    id,
    user_id,
    device_type,
    is_connected,
    last_sync_at,
    sync_error,
    external_user_id,
    created_at,
    updated_at
  FROM public.user_wearable_connections;

COMMENT ON VIEW public.user_wearable_connections_safe IS 
  'Safe view of wearable connections that excludes OAuth tokens (access_token, refresh_token, token_expires_at). Uses SECURITY INVOKER so the callers RLS policies apply. Client code must use this view. Token operations must go through Edge Functions using the service role key.';
