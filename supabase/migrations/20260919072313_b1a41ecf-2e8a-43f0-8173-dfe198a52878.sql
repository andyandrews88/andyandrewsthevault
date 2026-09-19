INSERT INTO public.workouts (id, user_id, date, workout_name, is_completed)
VALUES ('33333333-3333-4333-8333-333333333333','dc93a2be-26f6-40ee-a251-5c8d41525e9a', CURRENT_DATE, 'VOICE TEST FIXTURE', false);
INSERT INTO public.workout_exercises (id, workout_id, exercise_name, order_index, workout_section)
VALUES ('44444444-4444-4444-8444-444444444444','33333333-3333-4333-8333-333333333333','Bench Press (Barbell)',0,'main');