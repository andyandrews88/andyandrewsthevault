CREATE POLICY "Coaches manage their own templates"
ON public.coach_program_templates
FOR ALL
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches manage their own template workouts"
ON public.coach_template_workouts
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.coach_program_templates t WHERE t.id = coach_template_workouts.template_id AND t.coach_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.coach_program_templates t WHERE t.id = coach_template_workouts.template_id AND t.coach_id = auth.uid()));