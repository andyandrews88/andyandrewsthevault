import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dumbbell, Timer, Plus } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { 
  EXERCISE_CATEGORIES, 
  STRENGTH_EXERCISES, 
  CONDITIONING_EXERCISES,
  CATEGORY_LABELS 
} from "@/types/workout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExerciseSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExercise: (name: string) => void;
  recentExercises?: string[];
  mode?: 'add' | 'replace';
  title?: string;
  section?: 'warmup' | 'main' | 'cooldown';
}

type CategoryKey = keyof typeof EXERCISE_CATEGORIES;

export function ExerciseSearch({ 
  open, 
  onOpenChange, 
  onSelectExercise,
  recentExercises = [],
  mode = 'add',
  title,
}: ExerciseSearchProps) {
  const [search, setSearch] = useState("");
  const [exerciseType, setExerciseType] = useState<'strength' | 'conditioning'>('strength');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');
  const [dbExercises, setDbExercises] = useState<{ name: string; category: string }[]>([]);

  // Fetch approved exercises from DB when dialog opens
  useEffect(() => {
    if (!open) return;
    supabase
      .from('exercise_library')
      .select('name, category')
      .eq('status', 'approved')
      .then(({ data }) => {
        if (data) setDbExercises(data);
      });
  }, [open]);

  // Build a combined set of all known exercises (hardcoded + DB)
  const allKnownExercises = useMemo(() => {
    const s = new Set([
      ...STRENGTH_EXERCISES.map(e => e.toLowerCase()),
      ...CONDITIONING_EXERCISES.map(e => e.toLowerCase()),
      ...dbExercises.map(e => e.name.toLowerCase()),
    ]);
    return s;
  }, [dbExercises]);

  const categories: (CategoryKey | 'all')[] = useMemo(() => {
    if (exerciseType === 'conditioning') return ['all', 'conditioning'];
    return ['all', 'chest', 'back', 'shoulders', 'quadriceps', 'hamstrings_glutes', 'calves', 'biceps', 'triceps', 'core', 'olympic', 'functional'];
  }, [exerciseType]);

  const filteredExercises = useMemo(() => {
    // Start with hardcoded list
    let exercises: string[] = exerciseType === 'conditioning' 
      ? [...CONDITIONING_EXERCISES] 
      : [...STRENGTH_EXERCISES];
    
    if (selectedCategory !== 'all' && selectedCategory in EXERCISE_CATEGORIES) {
      exercises = [...EXERCISE_CATEGORIES[selectedCategory as CategoryKey]];
    }

    // Merge DB exercises that aren't already in the hardcoded list
    const existingLower = new Set(exercises.map(e => e.toLowerCase()));
    const dbExtras = dbExercises
      .filter(e => {
        if (existingLower.has(e.name.toLowerCase())) return false;
        if (exerciseType === 'conditioning') return e.category === 'conditioning';
        return e.category !== 'conditioning';
      })
      .map(e => e.name);

    // Only add DB extras when showing 'all' (no specific muscle group filter)
    if (selectedCategory === 'all') {
      exercises = [...exercises, ...dbExtras];
    }
    
    return exercises;
  }, [exerciseType, selectedCategory, dbExercises]);

  const handleSelect = async (name: string) => {
    const isCustom = !allKnownExercises.has(name.toLowerCase());

    if (isCustom) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: existing } = await supabase
            .from('exercise_library')
            .select('id')
            .ilike('name', name.trim())
            .maybeSingle();

          if (!existing) {
            await supabase
              .from('exercise_library')
              .insert({
                name: name.trim(),
                category: exerciseType,
                status: 'pending',
                submitted_by: user.id,
              } as any);
            toast.success("Exercise added! Coach will review shortly.");
          }
        }
      } catch {
        // Don't block the workout
      }
    }

    onSelectExercise(name);
    setSearch("");
    onOpenChange(false);
  };

  const dialogTitle = title || (mode === 'replace' ? 'Replace Exercise' : 'Add Exercise');

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSearch(""); }}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-4 pb-2">
          <Tabs value={exerciseType} onValueChange={(v) => {
            setExerciseType(v as 'strength' | 'conditioning');
            setSelectedCategory('all');
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="strength" className="gap-2">
                <Dumbbell className="h-4 w-4" />
                Strength
              </TabsTrigger>
              <TabsTrigger value="conditioning" className="gap-2">
                <Timer className="h-4 w-4" />
                Conditioning
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {exerciseType === 'strength' && (
          <ScrollArea className="w-full px-4 pb-2">
            <div className="flex gap-2 pb-1">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="shrink-0 text-xs"
                >
                  {cat === 'all' ? 'All' : CATEGORY_LABELS[cat as CategoryKey]}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}

        <Command shouldFilter={true} className="border-t border-border">
          <CommandInput 
            placeholder="Search or type custom exercise..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-4">
              {search.trim() ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-primary"
                  onClick={() => handleSelect(search.trim())}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {mode === 'replace' ? 'Replace with' : 'Add'} "{search.trim()}"
                </Button>
              ) : (
                <span className="text-muted-foreground text-sm">No exercises found</span>
              )}
            </CommandEmpty>

            {recentExercises.length > 0 && !search && selectedCategory === 'all' && (
              <CommandGroup heading="Recent">
                {recentExercises.slice(0, 5).map(name => (
                  <CommandItem key={`recent-${name}`} value={name} onSelect={() => handleSelect(name)}>
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading={exerciseType === 'conditioning' ? 'Conditioning' : (selectedCategory === 'all' ? 'All Exercises' : CATEGORY_LABELS[selectedCategory as CategoryKey])}>
              {filteredExercises.map(name => (
                <CommandItem key={name} value={name} onSelect={() => handleSelect(name)}>
                  {name}
                </CommandItem>
              ))}
            </CommandGroup>

            {search.trim() && !filteredExercises.some(e => e.toLowerCase() === search.toLowerCase()) && (
              <CommandGroup>
                <CommandItem value={`custom-${search.trim()}`} onSelect={() => handleSelect(search.trim())}>
                  <Plus className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-primary">{mode === 'replace' ? 'Replace with' : 'Add'} "{search.trim()}"</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
