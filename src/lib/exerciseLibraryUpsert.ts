import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Upsert a field on exercise_library by exercise name (case-insensitive).
 * If the exercise doesn't exist, creates a new row.
 *
 * Handles unique-violation by retrying as case-insensitive update so
 * we never end up with duplicate rows like "Bench Press" / "bench press".
 */
export async function upsertExerciseLibraryField(
  exerciseName: string,
  field: Partial<{ movement_pattern: string | null; equipment_type: string | null; video_url: string | null; is_timed: boolean; is_unilateral: boolean; is_plyometric: boolean; plyo_metric: string | null }>
) {
  const name = exerciseName.trim();
  if (!name) return;

  // Case-insensitive lookup
  const { data: existing } = await supabase
    .from('exercise_library')
    .select('id')
    .ilike('name', name)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('exercise_library')
      .update(field)
      .eq('id', existing.id);
    if (error) { toast.error(error.message); return; }
  } else {
    const { error } = await supabase
      .from('exercise_library')
      .insert({ name, category: 'strength' as const, ...field });
    if (error) {
      // If unique violation (case-insensitive index), retry as update
      if (error.code === '23505' || /duplicate key|unique/i.test(error.message)) {
        const { data: again } = await supabase
          .from('exercise_library')
          .select('id')
          .ilike('name', name)
          .maybeSingle();
        if (again) {
          const { error: updErr } = await supabase
            .from('exercise_library')
            .update(field)
            .eq('id', again.id);
          if (updErr) { toast.error(updErr.message); return; }
        } else {
          toast.error(error.message);
          return;
        }
      } else {
        toast.error(error.message);
        return;
      }
    }
  }

  const fieldName = Object.keys(field)[0];
  const labels: Record<string, string> = {
    movement_pattern: 'Movement pattern',
    equipment_type: 'Equipment type',
    video_url: 'Video URL',
    is_timed: 'Time-based mode',
    is_unilateral: 'Unilateral mode',
    is_plyometric: 'Plyometric mode',
    plyo_metric: 'Plyometric metric',
  };
  toast.success(`${labels[fieldName] || fieldName} saved for ${name}`);
}
