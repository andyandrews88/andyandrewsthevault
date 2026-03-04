
-- Add status and submitted_by columns to exercise_library
ALTER TABLE public.exercise_library
  ADD COLUMN status text NOT NULL DEFAULT 'approved',
  ADD COLUMN submitted_by uuid NULL;

-- Backfill existing rows as approved (already default, but explicit)
UPDATE public.exercise_library SET status = 'approved' WHERE status = 'approved';

-- Drop the existing admin-only INSERT policy
DROP POLICY IF EXISTS "Admins can insert exercise library" ON public.exercise_library;

-- Admins can still insert any exercise
CREATE POLICY "Admins can insert exercise library"
ON public.exercise_library
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow any authenticated user to insert PENDING exercises
CREATE POLICY "Users can submit pending exercises"
ON public.exercise_library
FOR INSERT
TO authenticated
WITH CHECK (
  status = 'pending'
  AND submitted_by = auth.uid()
);
