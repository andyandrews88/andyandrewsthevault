INSERT INTO public.workouts (id, user_id, date, workout_name, is_completed)
VALUES ('11111111-1111-4111-8111-111111111111','dc93a2be-26f6-40ee-a251-5c8d41525e9a', CURRENT_DATE - 1, 'VOLUME TEST FIXTURE', true);

INSERT INTO public.workout_exercises (id, workout_id, exercise_name, order_index, workout_section)
VALUES ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','Bench Press (Barbell)',0,'main'),
       ('22222222-2222-4222-8222-222222222223','11111111-1111-4111-8111-111111111111','Push-Up',1,'main');

INSERT INTO public.exercise_sets (exercise_id, set_number, weight, reps, unit, is_completed, set_type)
VALUES ('22222222-2222-4222-8222-222222222222',1,100,10,'lb',true,'working'),
       ('22222222-2222-4222-8222-222222222222',2,60,5,'kg',true,'working'),
       ('22222222-2222-4222-8222-222222222223',1,NULL,20,'kg',true,'working');