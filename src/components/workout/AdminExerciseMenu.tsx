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
import { Dumbbell, Wrench, Video, Timer, ArrowLeftRight, Zap } from "lucide-react";
import { MOVEMENT_PATTERN_LABELS, type MovementPattern, EQUIPMENT_MODIFIER_VALUES, type EquipmentType, PLYO_METRIC_LABELS, type PlyoMetric } from "@/lib/movementPatterns";
import { upsertExerciseLibraryField } from "@/lib/exerciseLibraryUpsert";

const PATTERNS = Object.entries(MOVEMENT_PATTERN_LABELS).filter(([k]) => k !== 'plyometric') as [MovementPattern, string][];
const PLYO_METRICS = Object.entries(PLYO_METRIC_LABELS) as [PlyoMetric, string][];
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
  isAdmin: boolean;
  onMetadataChange?: (field: string, value: any) => void;
}

export function AdminExerciseMenu({ exerciseName, isAdmin, onMetadataChange }: AdminExerciseMenuProps) {
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");

  if (!isAdmin) return null;

  const handleSaveVideo = async () => {
    const url = videoUrlInput.trim() || null;
    await upsertExerciseLibraryField(exerciseName, { video_url: url });
    onMetadataChange?.("videoUrl", url);
    setShowVideoDialog(false);
    setVideoUrlInput("");
  };

  const handleToggleTimed = async (isTimed: boolean) => {
    await upsertExerciseLibraryField(exerciseName, { is_timed: isTimed });
    onMetadataChange?.("isTimed", isTimed);
  };

  const handleToggleUnilateral = async (isUnilateral: boolean) => {
    await upsertExerciseLibraryField(exerciseName, { is_unilateral: isUnilateral });
    onMetadataChange?.("isUnilateral", isUnilateral);
  };

  const handleSetPlyoMetric = async (metric: PlyoMetric) => {
    const isPlyometric = metric !== 'standard';
    await upsertExerciseLibraryField(exerciseName, { 
      movement_pattern: 'plyometric', 
      is_plyometric: isPlyometric, 
      plyo_metric: metric 
    });
    onMetadataChange?.("movementPattern", "plyometric");
    onMetadataChange?.("isPlyometric", isPlyometric);
    onMetadataChange?.("plyoMetric", metric);
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
              onClick={() => { 
                upsertExerciseLibraryField(exerciseName, { movement_pattern: key, is_plyometric: false, plyo_metric: 'standard' }); 
                onMetadataChange?.("movementPattern", key); 
                onMetadataChange?.("isPlyometric", false);
                onMetadataChange?.("plyoMetric", "standard");
              }}
            >
              {label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Zap className="h-4 w-4 mr-2" />
              Plyometric
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {PLYO_METRICS.map(([key, label]) => (
                <DropdownMenuItem key={key} onClick={() => handleSetPlyoMetric(key)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
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
              onClick={() => { upsertExerciseLibraryField(exerciseName, { equipment_type: key }); onMetadataChange?.("equipmentType", key); }}
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

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <ArrowLeftRight className="h-4 w-4 mr-2" />
          Unilateral (L/R)
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={() => handleToggleUnilateral(true)}>
            ✓ Yes (left &amp; right)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleToggleUnilateral(false)}>
            ✗ No (bilateral)
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
