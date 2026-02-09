import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Dumbbell, Timer } from "lucide-react";
import { 
  EXERCISE_CATEGORIES, 
  STRENGTH_EXERCISES, 
  CONDITIONING_EXERCISES,
  CATEGORY_LABELS 
} from "@/types/workout";

interface ExerciseSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExercise: (name: string) => void;
  recentExercises?: string[];
}

type CategoryKey = keyof typeof EXERCISE_CATEGORIES;

export function ExerciseSearch({ 
  open, 
  onOpenChange, 
  onSelectExercise,
  recentExercises = []
}: ExerciseSearchProps) {
  const [search, setSearch] = useState("");
  const [exerciseType, setExerciseType] = useState<'strength' | 'conditioning'>('strength');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');

  const categories: (CategoryKey | 'all')[] = useMemo(() => {
    if (exerciseType === 'conditioning') {
      return ['all', 'conditioning'];
    }
    return ['all', 'chest', 'back', 'shoulders', 'quadriceps', 'hamstrings_glutes', 'calves', 'biceps', 'triceps', 'core', 'olympic', 'functional'];
  }, [exerciseType]);

  const filteredExercises = useMemo(() => {
    let exercises: string[] = exerciseType === 'conditioning' 
      ? [...CONDITIONING_EXERCISES] 
      : [...STRENGTH_EXERCISES];
    
    // Filter by category
    if (selectedCategory !== 'all' && selectedCategory in EXERCISE_CATEGORIES) {
      exercises = [...EXERCISE_CATEGORIES[selectedCategory as CategoryKey]];
    }
    
    // Filter by search
    if (search.length > 0) {
      exercises = exercises.filter(e => 
        e.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return exercises;
  }, [search, exerciseType, selectedCategory]);

  const handleSelect = (name: string) => {
    onSelectExercise(name);
    setSearch("");
    onOpenChange(false);
  };

  const handleCustomExercise = () => {
    if (search.trim()) {
      handleSelect(search.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Add Exercise
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Type Toggle */}
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
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or type custom exercise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          
          {/* Category Pills */}
          {exerciseType === 'strength' && !search && (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="shrink-0"
                  >
                    {cat === 'all' ? 'All' : CATEGORY_LABELS[cat as CategoryKey]}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
          
          {/* Recent Exercises */}
          {recentExercises.length > 0 && !search && selectedCategory === 'all' && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent</h4>
              <div className="flex flex-wrap gap-2">
                {recentExercises.slice(0, 5).map(name => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelect(name)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Exercise List */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-1 pr-4">
              {/* Custom exercise option when searching */}
              {search && !filteredExercises.some(e => 
                e.toLowerCase() === search.toLowerCase()
              ) && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-primary"
                  onClick={handleCustomExercise}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add "{search}"
                </Button>
              )}
              
              {filteredExercises.map(name => (
                <Button
                  key={name}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleSelect(name)}
                >
                  {name}
                </Button>
              ))}
              
              {filteredExercises.length === 0 && !search && (
                <p className="text-center text-muted-foreground py-4">
                  No exercises found
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
