
CREATE OR REPLACE VIEW public.weekly_volume_summary AS
SELECT w.user_id,
       date_trunc('week', w.date::timestamp) AS week_start,
       SUM(COALESCE(s.weight, 0) * COALESCE(s.reps, 0)) AS total_tonnage,
       COUNT(DISTINCT w.id) AS workout_count
FROM workouts w
JOIN workout_exercises we ON we.workout_id = w.id
JOIN exercise_sets s ON s.exercise_id = we.id
WHERE w.is_completed = true AND s.is_completed = true AND s.set_type = 'working'
GROUP BY w.user_id, date_trunc('week', w.date::timestamp);

CREATE OR REPLACE VIEW public.weekly_rir_summary AS
SELECT w.user_id,
       date_trunc('week', w.date::timestamp) AS week_start,
       ROUND(AVG(s.rir)::numeric, 1) AS avg_rir,
       COUNT(*) AS sets_with_rir
FROM workouts w
JOIN workout_exercises we ON we.workout_id = w.id
JOIN exercise_sets s ON s.exercise_id = we.id
WHERE w.is_completed = true AND s.is_completed = true
  AND s.set_type = 'working' AND s.rir IS NOT NULL
GROUP BY w.user_id, date_trunc('week', w.date::timestamp);
