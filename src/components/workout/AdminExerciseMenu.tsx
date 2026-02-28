import { useState } from "react";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dumbbell, Wrench, Video, Timer } from "lucide-react";
import { MOVEMENT_PATTERN_LABELS, type MovementPattern, EQUIPMENT_MODIFIER_VALUES, type EquipmentType } from "@/lib/movementPatterns";
import { upsertExerciseLibraryField } from "@/lib/exerciseLibraryUpsert";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const PATTERNS = Object.entries(MOVEMENT_PATTERN_LABELS) as [MovementPattern, string][];
const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  kettlebell: 'Kettlebell',
  machine: 'Machine',
  cable: 'Cable',
  sandbag: 'Sandbag',
  bodyweight: 'Bodyweight',
  other: 'Other',
};
const EQUIPMENT = Object.entries(EQUIPMENT_LABELS) as [EquipmentType, string][];

interface AdminExerciseMenuProps {
  exerciseName: string;
}

export function AdminExerciseMenu({ exerciseName }: AdminExerciseMenuProps) {
  const { isAdmin } = useAdminCheck();
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");

  if (!isAdmin) return null;

  const handleSaveVideo = async () => {
    await upsertExerciseLibraryField(exerciseName, { video_url: videoUrlInput.trim() || null });
    setShowVideoDialog(false);
    setVideoUrlInput("");
  };

  const handleToggleTimed = async (isTimed: boolean) => {
    await upsertExerciseLibraryField(exerciseName, { is_timed: isTimed });
  };

  return (
    <>
      <DropdownMenuSeparator />
      <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Admin</div>
      
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Dumbbell className="h-4 w-4 mr-2" />
          Movement Pattern
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {PATTERNS.map(([key, label]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => upsertExerciseLibraryField(exerciseName, { movement_pattern: key })}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Wrench className="h-4 w-4 mr-2" />
          Equipment Type
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {EQUIPMENT.map(([key, label]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => upsertExerciseLibraryField(exerciseName, { equipment_type: key })}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Timer className="h-4 w-4 mr-2" />
          Time-Based
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={() => handleToggleTimed(true)}>
            ✓ Yes (duration in seconds)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleToggleTimed(false)}>
            ✗ No (reps)
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuItem onClick={() => setShowVideoDialog(true)}>
        <Video className="h-4 w-4 mr-2" />
        Set Video URL
      </DropdownMenuItem>

      {showVideoDialog && (
        <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Set Video URL</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Video URL for {exerciseName}</Label>
                <Input
                  value={videoUrlInput}
                  onChange={e => setVideoUrlInput(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveVideo} className="flex-1">Save</Button>
                <Button variant="outline" onClick={() => setShowVideoDialog(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
