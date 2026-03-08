
-- Allow admins to read client workout data for coaching analytics (MovementBalanceChart)
CREATE POLICY "Admins can view all workouts"
ON public.workouts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all workout exercises"
ON public.workout_exercises
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM workouts w
  WHERE w.id = workout_exercises.workout_id
  AND has_role(auth.uid(), 'admin'::app_role)
));

CREATE POLICY "Admins can view all exercise sets"
ON public.exercise_sets
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM workout_exercises we
  JOIN workouts w ON w.id = we.workout_id
  WHERE we.id = exercise_sets.exercise_id
  AND has_role(auth.uid(), 'admin'::app_role)
));

CREATE POLICY "Admins can view all body entries"
ON public.user_body_entries
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all personal records"
ON public.personal_records
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
