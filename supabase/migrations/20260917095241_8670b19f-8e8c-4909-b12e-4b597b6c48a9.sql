
-- Path convention: <user_id>/<filename>
CREATE POLICY "Own meal photos read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'meal-photos' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.has_client_access(((storage.foldername(name))[1])::uuid)));
CREATE POLICY "Own meal photos write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own meal photos update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own meal photos delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Own progress photos read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'progress-photos' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.has_client_access(((storage.foldername(name))[1])::uuid)));
CREATE POLICY "Own progress photos write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own progress photos update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own progress photos delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Voice notes read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voice-notes' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.has_client_access(((storage.foldername(name))[1])::uuid)
    OR public.is_coach_of(((storage.foldername(name))[1])::uuid, auth.uid())));
CREATE POLICY "Voice notes write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Voice notes delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Security: pin search_path
CREATE OR REPLACE FUNCTION public.calc_estimated_1rm(_weight numeric, _reps integer)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _weight IS NULL OR _reps IS NULL OR _weight <= 0 OR _reps <= 0 OR _reps > 12 THEN NULL
    ELSE round((_weight * (1 + (_reps::numeric / 30)))::numeric, 1)
  END
$$;

-- Security: no signed-out execution of internal helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_private_coaching(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_coach_of(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_client_access(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_any_coach(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.shares_coach_with(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_private_coaching(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_coach_of(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_client_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_any_coach(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_coach_with(uuid, uuid) TO authenticated;

-- Trigger-only functions: not callable from the API at all
REVOKE EXECUTE ON FUNCTION public.sync_personal_record() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_workout_volume() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_message_likes_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.assign_andy_admin_role() FROM anon, authenticated, public;
