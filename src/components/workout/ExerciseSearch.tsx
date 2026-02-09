import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Dumbbell } from "lucide-react";
import { COMMON_EXERCISES } from "@/types/workout";

interface ExerciseSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExercise: (name: string) => void;
  recentExercises?: string[];
}

export function ExerciseSearch({ 
  open, 
  onOpenChange, 
  onSelectExercise,
  recentExercises = []
}: ExerciseSearchProps) {
  const [search, setSearch] = useState("");

  const filteredExercises = search.length > 0
    ? COMMON_EXERCISES.filter(e => 
        e.toLowerCase().includes(search.toLowerCase())
      )
    : COMMON_EXERCISES;

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Add Exercise
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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
          
          {/* Recent Exercises */}
          {recentExercises.length > 0 && !search && (
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
          <ScrollArea className="h-64">
            <div className="space-y-1">
              {/* Custom exercise option when searching */}
              {search && !COMMON_EXERCISES.some(e => 
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
