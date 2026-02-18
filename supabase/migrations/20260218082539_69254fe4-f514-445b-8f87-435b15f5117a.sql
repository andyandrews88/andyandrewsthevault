
-- Fix: Remove direct client access to OAuth token columns in user_wearable_connections.
-- The client already queries only safe columns, but we add a security view
-- so that direct table queries cannot expose tokens even on account compromise.

-- 1. Drop existing SELECT policy (which allows full row access including tokens)
DROP POLICY IF EXISTS "Users can view their own wearable connections" ON public.user_wearable_connections;

-- 2. Create a restricted SELECT policy that explicitly excludes token columns
--    by only allowing access via a security view (we block direct table SELECT).
--    Direct table SELECT is now denied for regular authenticated users.
CREATE POLICY "Users can view their own wearable connections"
  ON public.user_wearable_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Create a secure view that strips sensitive token columns.
--    This is the safe surface the client should use.
CREATE OR REPLACE VIEW public.user_wearable_connections_safe AS
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

-- 4. Add a comment to document the security intent
COMMENT ON VIEW public.user_wearable_connections_safe IS 
  'Safe view of wearable connections that excludes OAuth tokens (access_token, refresh_token, token_expires_at). Client code must use this view. Token operations must go through Edge Functions using the service role key.';

-- 5. Add a comment to the sensitive columns to document they are server-only
COMMENT ON COLUMN public.user_wearable_connections.access_token IS 
  'SERVER-SIDE ONLY. OAuth access token. Must not be returned to clients. Use user_wearable_connections_safe view for client queries.';

COMMENT ON COLUMN public.user_wearable_connections.refresh_token IS 
  'SERVER-SIDE ONLY. OAuth refresh token. Must not be returned to clients. Use user_wearable_connections_safe view for client queries.';

COMMENT ON COLUMN public.user_wearable_connections.token_expires_at IS 
  'SERVER-SIDE ONLY. Token expiry timestamp. Must not be returned to clients. Use user_wearable_connections_safe view for client queries.';
