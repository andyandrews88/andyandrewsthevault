UPDATE public.exercise_library SET movement_pattern = 'push' WHERE movement_pattern IS NULL AND name IN ('Banded Dips','Behind-the-Neck Press','Bench Press (Barbell)','Bench Press (Dumbbell)','Decline Bench Press','Deficit Push-Up','Diamond Push-Up','Floor Press','Larsen Press','Overhead Press (Barbell)','Parallel Bar Dip','Push-Up');

UPDATE public.exercise_library SET movement_pattern = 'pull' WHERE movement_pattern IS NULL AND name IN ('banded pull apart','banded pull aparts','Banded Rows','Barbell Row (Overhand)','Incline Dumbbell Row','Landmine Row','Lat Pulldown (Wide)','Meadows Row','Pull-Up','SA Dumbbell Row','Strict Pull-Up','Shrug (Kettlebell)');

UPDATE public.exercise_library SET movement_pattern = 'squat' WHERE movement_pattern IS NULL AND name IN ('Back Squat (High Bar)','Box Squat','Cyclist Squat','Goblet Squat','Safety Bar Squat','zercher squat');

UPDATE public.exercise_library SET movement_pattern = 'hinge' WHERE movement_pattern IS NULL AND name IN ('Deadlift (Sumo)','Romanian Deadlift','Glute Bridge');

UPDATE public.exercise_library SET movement_pattern = 'single_leg' WHERE movement_pattern IS NULL AND name IN ('Alternating Front Rack Barbell Reverse Lunge','Back Rack Reverse Lunge','Cossack Squat','Reverse Lunge','Single-Leg Romanian Deadlift','Walking Lunge');

UPDATE public.exercise_library SET movement_pattern = 'core' WHERE movement_pattern IS NULL AND name IN ('Hollow Rocks','Side Plank');

UPDATE public.exercise_library SET movement_pattern = 'isolation' WHERE movement_pattern IS NULL AND name IN ('Barbell calf raise','Bicep Curl','deficit calf raise','Dumbbell Curl (Incline)','Kettlebell Horn Curl','Leg Extension','Standing Calf Raise (Smith)');