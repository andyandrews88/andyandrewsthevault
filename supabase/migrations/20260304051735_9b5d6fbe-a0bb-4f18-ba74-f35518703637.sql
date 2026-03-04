
-- Fix announcements: drop restrictive policies, recreate as permissive
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can view active announcements" ON public.announcements;

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can select all announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (is_active = true);

-- Fix announcement_dismissals: same issue
DROP POLICY IF EXISTS "Users can dismiss announcements" ON public.announcement_dismissals;
DROP POLICY IF EXISTS "Users can view their own dismissals" ON public.announcement_dismissals;

CREATE POLICY "Users can dismiss announcements"
  ON public.announcement_dismissals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own dismissals"
  ON public.announcement_dismissals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
