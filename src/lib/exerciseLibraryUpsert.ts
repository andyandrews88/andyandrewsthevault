import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Upsert a field on exercise_library by exercise name.
 * If the exercise doesn't exist, creates a new row.
 */
export async function upsertExerciseLibraryField(
  exerciseName: string,
  field: Record<string, string | null>
) {
  const name = exerciseName.trim();
  if (!name) return;

  // Check if exists
  const { data: existing } = await supabase
    .from('exercise_library' as any)
    .select('id')
    .ilike('name', name)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('exercise_library' as any)
      .update(field)
      .eq('id', (existing as any).id);
    if (error) { toast.error(error.message); return; }
  } else {
    const { error } = await supabase
      .from('exercise_library' as any)
      .insert({ name, category: 'strength', ...field });
    if (error) { toast.error(error.message); return; }
  }

  const fieldName = Object.keys(field)[0];
  const labels: Record<string, string> = {
    movement_pattern: 'Movement pattern',
    equipment_type: 'Equipment type',
    video_url: 'Video URL',
  };
  toast.success(`${labels[fieldName] || fieldName} saved for ${name}`);
}
