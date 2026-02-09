import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { format } from "date-fns";

export function PRBoard() {
  const { personalRecords, fetchPersonalRecords } = useWorkoutStore();

  useEffect(() => {
    fetchPersonalRecords();
  }, [fetchPersonalRecords]);

  // Sort by max weight descending
  const sortedRecords = [...personalRecords].sort((a, b) => b.max_weight - a.max_weight);

  const formatExerciseName = (name: string) => {
    return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          Personal Records
        </CardTitle>
        <CardDescription>Your all-time bests</CardDescription>
      </CardHeader>
      
      <CardContent>
        {sortedRecords.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Medal className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No personal records yet</p>
            <p className="text-sm">Complete some sets to set your first PR!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRecords.slice(0, 10).map((pr, index) => (
              <div 
                key={pr.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <span className="text-2xl">🥇</span>
                  )}
                  {index === 1 && (
                    <span className="text-2xl">🥈</span>
                  )}
                  {index === 2 && (
                    <span className="text-2xl">🥉</span>
                  )}
                  {index > 2 && (
                    <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                  )}
                  
                  <div>
                    <p className="font-medium">{formatExerciseName(pr.exercise_name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(pr.achieved_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold">{pr.max_weight} lbs</p>
                  {pr.max_reps && (
                    <Badge variant="outline" className="text-xs">
                      × {pr.max_reps} reps
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
