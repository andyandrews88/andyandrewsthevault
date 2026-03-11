import { useState } from "react";
import {
  BottomSheetMenu,
  BottomSheetItem,
  BottomSheetSeparator,
  BottomSheetExpandable,
  BottomSheetSubItem,
} from "@/components/ui/bottom-sheet-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  History, Trash2, Link, Unlink, RefreshCw,
  Dumbbell, Wrench, Video, Timer, ArrowLeftRight, Zap,
} from "lucide-react";
import { WorkoutExercise } from "@/types/workout";
import {
  MOVEMENT_PATTERN_LABELS,
  type MovementPattern,
  type EquipmentType,
  PLYO_METRIC_LABELS,
  type PlyoMetric,
} from "@/lib/movementPatterns";
import { upsertExerciseLibraryField } from "@/lib/exerciseLibraryUpsert";

const PATTERNS = Object.entries(MOVEMENT_PATTERN_LABELS).filter(([k]) => k !== 'plyometric') as [MovementPattern, string][];
const PLYO_METRICS = Object.entries(PLYO_METRIC_LABELS) as [PlyoMetric, string][];
const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  barbell: "Barbell", dumbbell: "Dumbbell", kettlebell: "Kettlebell",
  machine: "Machine", cable: "Cable", sandbag: "Sandbag",
  bodyweight: "Bodyweight", other: "Other",
};
const EQUIPMENT = Object.entries(EQUIPMENT_LABELS) as [EquipmentType, string][];

interface ExerciseActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: WorkoutExercise;
  isAdmin: boolean;
  isSupersetted: boolean;
  linkableExercises: WorkoutExercise[];
  onLoadLastSession: () => void;
  isLoadingPrevious: boolean;
  onLinkSuperset: (targetId: string) => void;
  onUnlinkSuperset: () => void;
  onReplace: () => void;
  onRemove: () => void;
  onMetadataChange?: (field: string, value: any) => void;
}

export function ExerciseActionSheet({
  open, onOpenChange, exercise, isAdmin, isSupersetted,
  linkableExercises, onLoadLastSession, isLoadingPrevious,
  onLinkSuperset, onUnlinkSuperset, onReplace, onRemove, onMetadataChange,
}: ExerciseActionSheetProps) {
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");

  const handleAction = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  const handleMetadataAction = async (upsertFn: () => Promise<void>, metadataFn: () => void) => {
    metadataFn();
    await upsertFn();
    onOpenChange(false);
  };

  const handleSaveVideo = async () => {
    const url = videoUrlInput.trim() || null;
    await upsertExerciseLibraryField(exercise.exercise_name, { video_url: url });
    onMetadataChange?.("videoUrl", url);
    setShowVideoDialog(false);
    setVideoUrlInput("");
  };

  return (
    <>
      <BottomSheetMenu open={open} onOpenChange={onOpenChange} title={exercise.exercise_name}>
        {/* Core actions */}
        <BottomSheetItem
          icon={History}
          label="Load Last Session"
          onClick={() => handleAction(onLoadLastSession)}
        />

        {/* Superset linking */}
        {linkableExercises.length > 0 && (
          <BottomSheetExpandable icon={Link} label="Link Superset">
            {linkableExercises.map((e) => (
              <BottomSheetSubItem
                key={e.id}
                label={e.exercise_name}
                onClick={() => handleAction(() => onLinkSuperset(e.id))}
              />
            ))}
          </BottomSheetExpandable>
        )}

        {isSupersetted && (
          <BottomSheetItem
            icon={Unlink}
            label="Unlink Superset"
            onClick={() => handleAction(onUnlinkSuperset)}
          />
        )}

        <BottomSheetItem
          icon={RefreshCw}
          label="Replace Exercise"
          onClick={() => handleAction(onReplace)}
        />

        {/* Admin section */}
        {isAdmin && (
          <>
            <BottomSheetSeparator label="Admin" />

            <BottomSheetExpandable icon={Dumbbell} label="Movement Pattern">
              {PATTERNS.map(([key, label]) => (
                <BottomSheetSubItem
                  key={key}
                  label={label}
                  onClick={() =>
                    handleMetadataAction(
                      () => upsertExerciseLibraryField(exercise.exercise_name, {
                        movement_pattern: key, is_plyometric: false, plyo_metric: 'standard',
                      }),
                      () => {
                        onMetadataChange?.("movementPattern", key);
                        onMetadataChange?.("isPlyometric", false);
                        onMetadataChange?.("plyoMetric", "standard");
                      }
                    )
                  }
                />
              ))}
              <BottomSheetExpandable icon={Zap} label="Plyometric">
                {PLYO_METRICS.map(([key, label]) => (
                  <BottomSheetSubItem
                    key={key}
                    label={label}
                    onClick={() =>
                      handleMetadataAction(
                        () => {
                          const isPlyometric = key !== 'standard';
                          return upsertExerciseLibraryField(exercise.exercise_name, {
                            movement_pattern: 'plyometric', is_plyometric: isPlyometric, plyo_metric: key,
                          });
                        },
                        () => {
                          const isPlyometric = key !== 'standard';
                          onMetadataChange?.("movementPattern", "plyometric");
                          onMetadataChange?.("isPlyometric", isPlyometric);
                          onMetadataChange?.("plyoMetric", key);
                        }
                      )
                    }
                  />
                ))}
              </BottomSheetExpandable>
            </BottomSheetExpandable>

            <BottomSheetExpandable icon={Wrench} label="Equipment Type">
              {EQUIPMENT.map(([key, label]) => (
                <BottomSheetSubItem
                  key={key}
                  label={label}
                  onClick={() =>
                    handleMetadataAction(
                      () => upsertExerciseLibraryField(exercise.exercise_name, { equipment_type: key }),
                      () => onMetadataChange?.("equipmentType", key)
                    )
                  }
                />
              ))}
            </BottomSheetExpandable>

            <BottomSheetExpandable icon={Timer} label="Time-Based">
              <BottomSheetSubItem
                label="✓ Yes (duration in seconds)"
                onClick={() =>
                  handleMetadataAction(
                    () => upsertExerciseLibraryField(exercise.exercise_name, { is_timed: true }),
                    () => onMetadataChange?.("isTimed", true)
                  )
                }
              />
              <BottomSheetSubItem
                label="✗ No (reps)"
                onClick={() =>
                  handleMetadataAction(
                    () => upsertExerciseLibraryField(exercise.exercise_name, { is_timed: false }),
                    () => onMetadataChange?.("isTimed", false)
                  )
                }
              />
            </BottomSheetExpandable>

            <BottomSheetExpandable icon={ArrowLeftRight} label="Unilateral (L/R)">
              <BottomSheetSubItem
                label="✓ Yes (left & right)"
                onClick={() =>
                  handleMetadataAction(
                    () => upsertExerciseLibraryField(exercise.exercise_name, { is_unilateral: true }),
                    () => onMetadataChange?.("isUnilateral", true)
                  )
                }
              />
              <BottomSheetSubItem
                label="✗ No (bilateral)"
                onClick={() =>
                  handleMetadataAction(
                    () => upsertExerciseLibraryField(exercise.exercise_name, { is_unilateral: false }),
                    () => onMetadataChange?.("isUnilateral", false)
                  )
                }
              />
            </BottomSheetExpandable>

            <BottomSheetItem
              icon={Video}
              label="Set Video URL"
              onClick={() => {
                onOpenChange(false);
                setTimeout(() => setShowVideoDialog(true), 200);
              }}
            />
          </>
        )}

        <BottomSheetSeparator />

        <BottomSheetItem
          icon={Trash2}
          label="Remove Exercise"
          destructive
          onClick={() => handleAction(onRemove)}
        />
      </BottomSheetMenu>

      {/* Video URL Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Video URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Video URL for {exercise.exercise_name}</Label>
              <Input
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
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
    </>
  );
}
