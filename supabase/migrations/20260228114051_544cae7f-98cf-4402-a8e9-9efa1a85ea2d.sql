
ALTER TABLE exercise_sets ADD COLUMN side text;
ALTER TABLE exercise_library ADD COLUMN is_unilateral boolean NOT NULL DEFAULT false;
