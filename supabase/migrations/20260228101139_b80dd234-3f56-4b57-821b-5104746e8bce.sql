ALTER TABLE exercise_sets ADD COLUMN duration_seconds integer;
ALTER TABLE exercise_library ADD COLUMN is_timed boolean NOT NULL DEFAULT false;