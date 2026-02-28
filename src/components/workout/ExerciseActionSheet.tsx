import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  History, Trash2, Link, Unlink, RefreshCw,
  Dumbbell, Wrench, Video, Timer, ArrowLeftRight,
  ChevronRight, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkoutExercise } from "@/types/workout";
import {
  MOVEMENT_PATTERN_LABELS,
  type MovementPattern,
  EQUIPMENT_MODIFIER_VALUES,
  type EquipmentType,
} from "@/lib/movementPatterns";
import { upsertExerciseLibraryField } from "@/lib/exerciseLibraryUpsert";

const PATTERNS = Object.entries(MOVEMENT_PATTERN_LABELS) as [MovementPattern, string][];
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
}

function SheetItem({
  icon: Icon, label, onClick, destructive, className,
}: {
  icon: React.ElementType; label: string; onClick: () => void;
  destructive?: boolean; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors active:bg-accent/60",
        destructive ? "text-destructive" : "text-foreground hover:bg-accent",
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

function ExpandableSection({
  icon: Icon, label, children,
}: {
  icon: React.ElementType; label: string; children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent active:bg-accent/60"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="ml-7 mb-1 space-y-0.5 border-l-2 border-border pl-3">
          {children}
        </div>
      )}
    </div>
  );
}

export function ExerciseActionSheet({
  open, onOpenChange, exercise, isAdmin, isSupersetted,
  linkableExercises, onLoadLastSession, isLoadingPrevious,
  onLinkSuperset, onUnlinkSuperset, onReplace, onRemove,
}: ExerciseActionSheetProps) {
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");

  const handleAction = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  const handleSaveVideo = async () => {
    await upsertExerciseLibraryField(exercise.exercise_name, {
      video_url: videoUrlInput.trim() || null,
    });
    setShowVideoDialog(false);
    setVideoUrlInput("");
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base uppercase tracking-wide">
              {exercise.exercise_name}
            </DrawerTitle>
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-6 space-y-1">
            {/* Core actions */}
            <SheetItem
              icon={History}
              label="Load Last Session"
              onClick={() => handleAction(onLoadLastSession)}
            />

            {/* Superset linking */}
            {linkableExercises.length > 0 && (
              <ExpandableSection icon={Link} label="Link Superset">
                {linkableExercises.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => handleAction(() => onLinkSuperset(e.id))}
                    className="w-full rounded-md px-3 py-2.5 text-left text-sm text-foreground hover:bg-accent active:bg-accent/60"
                  >
                    {e.exercise_name}
                  </button>
                ))}
              </ExpandableSection>
            )}

            {isSupersetted && (
              <SheetItem
                icon={Unlink}
                label="Unlink Superset"
                onClick={() => handleAction(onUnlinkSuperset)}
              />
            )}

            <SheetItem
              icon={RefreshCw}
              label="Replace Exercise"
              onClick={() => handleAction(onReplace)}
            />

            {/* Admin section */}
            {isAdmin && (
              <>
                <Separator className="my-2" />
                <p className="px-3 pt-1 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>

                <ExpandableSection icon={Dumbbell} label="Movement Pattern">
                  {PATTERNS.map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() =>
                        handleAction(() =>
                          upsertExerciseLibraryField(exercise.exercise_name, {
                            movement_pattern: key,
                          })
                        )
                      }
                      className="w-full rounded-md px-3 py-2.5 text-left text-sm text-foreground hover:bg-accent active:bg-accent/60"
                    >
                      {label}
                    </button>
                  ))}
                </ExpandableSection>

                <ExpandableSection icon={Wrench} label="Equipment Type">
                  {EQUIPMENT.map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() =>
                        handleAction(() =>
                          upsertExerciseLibraryField(exercise.exercise_name, {
                            equipment_type: key,
                          })
                        )
                      }
                      className="w-full rounded-md px-3 py-2.5 text-left text-sm text-foreground hover:bg-accent active:bg-accent/60"
                    >
                      {label}
                    </button>
                  ))}
                </ExpandableSection>

                <ExpandableSection icon={Timer} label="Time-Based">
                  <button
                    onClick={() =>
                      handleAction(() =>
                        upsertExerciseLibraryField(exercise.exercise_name, {
                          is_timed: true,
                        })
                      )
                    }
                    className="w-full rounded-md px-3 py-2.5 text-left text-sm text-foreground hover:bg-accent active:bg-accent/60"
                  >
                    ✓ Yes (duration in seconds)
                  </button>
                  <button
                    onClick={() =>
                      handleAction(() =>
                        upsertExerciseLibraryField(exercise.exercise_name, {
                          is_timed: false,
                        })
                      )
                    }
                    className="w-full rounded-md px-3 py-2.5 text-left text-sm text-foreground hover:bg-accent active:bg-accent/60"
                  >
                    ✗ No (reps)
                  </button>
                </ExpandableSection>

                <ExpandableSection icon={ArrowLeftRight} label="Unilateral (L/R)">
                  <button
                    onClick={() =>
                      handleAction(() =>
                        upsertExerciseLibraryField(exercise.exercise_name, {
                          is_unilateral: true,
                        })
                      )
                    }
                    className="w-full rounded-md px-3 py-2.5 text-left text-sm text-foreground hover:bg-accent active:bg-accent/60"
                  >
                    ✓ Yes (left &amp; right)
                  </button>
                  <button
                    onClick={() =>
                      handleAction(() =>
                        upsertExerciseLibraryField(exercise.exercise_name, {
                          is_unilateral: false,
                        })
                      )
                    }
                    className="w-full rounded-md px-3 py-2.5 text-left text-sm text-foreground hover:bg-accent active:bg-accent/60"
                  >
                    ✗ No (bilateral)
                  </button>
                </ExpandableSection>

                <SheetItem
                  icon={Video}
                  label="Set Video URL"
                  onClick={() => {
                    onOpenChange(false);
                    setTimeout(() => setShowVideoDialog(true), 200);
                  }}
                />
              </>
            )}

            <Separator className="my-2" />

            <SheetItem
              icon={Trash2}
              label="Remove Exercise"
              destructive
              onClick={() => handleAction(onRemove)}
            />
          </div>
        </DrawerContent>
      </Drawer>

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
              <Button onClick={handleSaveVideo} className="flex-1">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowVideoDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
