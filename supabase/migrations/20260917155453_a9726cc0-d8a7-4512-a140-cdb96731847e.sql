CREATE UNIQUE INDEX IF NOT EXISTS program_availability_unique_scope
  ON public.program_availability (coach_id, program_id, service_tier, client_id) NULLS NOT DISTINCT;