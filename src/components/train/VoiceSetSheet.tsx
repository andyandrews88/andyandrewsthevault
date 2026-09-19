import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Check, Loader2, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { parseSpokenSet } from "@/lib/voiceSetParser";
import { useSessionStore } from "@/stores/sessionStore";
import type { WorkoutExercise } from "@/types/workout";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: WorkoutExercise[];
  /** exercise the athlete is currently working on, used when none is spoken */
  defaultExerciseId?: string | null;
}

type Stage = "idle" | "listening" | "processing" | "review";

interface Draft {
  exerciseId: string | null;
  spokenMovement: string | null;
  setNumber: string;
  weight: string;
  unit: "kg" | "lb";
  reps: string;
  rpe: string;
}

function matchExercise(spoken: string | null, exercises: WorkoutExercise[]) {
  if (!spoken) return null;
  const want = spoken.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  if (!want) return null;
  const exact = exercises.find((e) => e.exercise_name.toLowerCase() === want);
  if (exact) return exact;
  const partial = exercises.find(
    (e) =>
      e.exercise_name.toLowerCase().includes(want) || want.includes(e.exercise_name.toLowerCase())
  );
  if (partial) return partial;
  const wantWords = want.split(/\s+/).filter((w) => w.length > 2);
  let best: { ex: WorkoutExercise; score: number } | null = null;
  for (const ex of exercises) {
    const words = ex.exercise_name.toLowerCase().split(/\s+/);
    const score = wantWords.filter((w) => words.some((n) => n.startsWith(w) || w.startsWith(n))).length;
    if (score > 0 && (!best || score > best.score)) best = { ex, score };
  }
  return best?.ex ?? null;
}

/**
 * Voice set logging. Speech -> structured parse -> confirmation card -> explicit
 * Confirm. Nothing is written to the database before Confirm is tapped, and any
 * value that was not clearly heard is left blank for the athlete to fill in.
 */
export function VoiceSetSheet({ open, onOpenChange, exercises, defaultExerciseId }: Props) {
  const speech = useSpeechInput();
  const { logVoiceSet } = useSessionStore();
  const [stage, setStage] = useState<Stage>("idle");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [finalText, setFinalText] = useState("");
  const [movementMismatch, setMovementMismatch] = useState(false);
  const [saving, setSaving] = useState(false);

  const strength = useMemo(
    () => exercises.filter((e) => e.exercise_type !== "conditioning"),
    [exercises]
  );

  const resetAll = () => {
    setStage("idle");
    setDraft(null);
    setFinalText("");
    setMovementMismatch(false);
    speech.reset();
  };

  useEffect(() => {
    if (!open) {
      speech.stop();
      resetAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Parse only once the browser has finished listening — interim text is never shown.
  useEffect(() => {
    if (stage !== "processing" || speech.listening) return;
    const raw = speech.transcript.trim();
    if (!raw) {
      setStage("idle");
      toast.error("Didn't catch that. Try again or log it manually.");
      return;
    }
    const parsed = parseSpokenSet(raw);
    const matched = matchExercise(parsed.movement, strength);
    const fallback = strength.find((e) => e.id === defaultExerciseId) ?? null;
    const chosen = matched ?? (parsed.movement ? null : fallback);

    setMovementMismatch(!!parsed.movement && !matched);
    setFinalText(parsed.normalised);
    setDraft({
      exerciseId: chosen?.id ?? null,
      spokenMovement: parsed.movement,
      setNumber: parsed.setNumber ? String(parsed.setNumber) : "",
      weight: parsed.weight !== null ? String(parsed.weight) : "",
      unit: parsed.unit ?? "kg",
      reps: parsed.reps !== null ? String(parsed.reps) : "",
      rpe: parsed.rpe !== null ? String(parsed.rpe) : "",
    });
    setStage("review");
    speech.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, speech.listening, speech.transcript]);

  const startListening = () => {
    speech.reset();
    setDraft(null);
    setFinalText("");
    setStage("listening");
    speech.start();
  };

  const stopListening = () => {
    speech.stop();
    setStage("processing");
  };

  const selected = draft?.exerciseId ? strength.find((e) => e.id === draft.exerciseId) : null;
  const nextSetNumber = useMemo(() => {
    if (!selected) return 1;
    const sets = selected.sets ?? [];
    const firstOpen = sets.find((s) => !s.is_completed);
    return firstOpen?.set_number ?? sets.length + 1;
  }, [selected]);

  const confirm = async () => {
    if (!draft || !draft.exerciseId) {
      toast.error("Choose the movement first.");
      return;
    }
    const setNumber = Number(draft.setNumber || nextSetNumber);
    if (!setNumber || setNumber < 1) {
      toast.error("Enter which set this was.");
      return;
    }
    setSaving(true);
    const ok = await logVoiceSet(draft.exerciseId, setNumber, {
      weight: draft.weight === "" ? null : Number(draft.weight),
      unit: draft.unit,
      reps: draft.reps === "" ? null : Number(draft.reps),
      rpe: draft.rpe === "" ? null : Number(draft.rpe),
    });
    setSaving(false);
    if (!ok) {
      toast.error("Could not save that set. Log it manually.");
      return;
    }
    toast.success("Set logged");
    resetAll();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Log a set by voice</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8 space-y-4">
          {!speech.supported && (
            <p className="text-sm text-muted-foreground">
              Voice input isn't available in this browser. Log the set using the normal rows.
            </p>
          )}

          {speech.supported && stage !== "review" && (
            <div className="space-y-3 text-center py-4">
              <p className="text-xs text-muted-foreground">
                Say it naturally — "Bench press, set three, 80 kilos, eight reps, RPE eight"
              </p>
              {stage === "processing" ? (
                <p className="text-sm font-medium flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Transcribing…
                </p>
              ) : stage === "listening" ? (
                <p className="text-sm font-medium text-destructive">Listening…</p>
              ) : null}
              <Button
                variant={stage === "listening" ? "destructive" : "elite"}
                className="w-full h-12"
                disabled={stage === "processing"}
                onClick={stage === "listening" ? stopListening : startListening}
              >
                {stage === "listening" ? (
                  <><MicOff className="h-4 w-4 mr-2" /> Stop and review</>
                ) : (
                  <><Mic className="h-4 w-4 mr-2" /> Start speaking</>
                )}
              </Button>
              {speech.error && <p className="text-xs text-destructive">{speech.error}</p>}
            </div>
          )}

          {stage === "review" && draft && (
            <div className="space-y-4">
              <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2">
                <p className="text-xs font-semibold text-accent">Check this before saving</p>
                {finalText && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">"{finalText}"</p>
                )}
              </div>

              {movementMismatch && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-xs text-destructive">
                    "{draft.spokenMovement}" isn't in this session. Pick the right movement below.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Movement</Label>
                <div className="grid gap-1.5">
                  {strength.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => {
                        setDraft({ ...draft, exerciseId: ex.id });
                        setMovementMismatch(false);
                      }}
                      className={cn(
                        "min-h-[44px] rounded-lg border px-3 text-left text-sm",
                        draft.exerciseId === ex.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card"
                      )}
                    >
                      {ex.exercise_name}
                    </button>
                  ))}
                  {strength.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No strength movements in this session yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Set</Label>
                  <Input
                    inputMode="numeric"
                    value={draft.setNumber}
                    placeholder={String(nextSetNumber)}
                    onChange={(e) => setDraft({ ...draft, setNumber: e.target.value })}
                    className="h-11 text-center"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Reps</Label>
                  <Input
                    inputMode="numeric"
                    value={draft.reps}
                    placeholder="—"
                    onChange={(e) => setDraft({ ...draft, reps: e.target.value })}
                    className="h-11 text-center"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Load</Label>
                  <div className="flex gap-1.5">
                    <Input
                      inputMode="decimal"
                      value={draft.weight}
                      placeholder="—"
                      onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
                      className="h-11 text-center"
                    />
                    <button
                      onClick={() =>
                        setDraft({ ...draft, unit: draft.unit === "kg" ? "lb" : "kg" })
                      }
                      className="h-11 min-w-[48px] rounded-md border border-border bg-card text-xs font-semibold"
                    >
                      {draft.unit}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">RPE</Label>
                  <Input
                    inputMode="decimal"
                    value={draft.rpe}
                    placeholder="—"
                    onChange={(e) => setDraft({ ...draft, rpe: e.target.value })}
                    className="h-11 text-center"
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Anything left blank wasn't clearly heard — fill it in or leave it out.
              </p>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-12" onClick={startListening}>
                  <Mic className="h-4 w-4 mr-2" /> Redo
                </Button>
                <Button
                  variant="elite"
                  className="flex-1 h-12"
                  onClick={confirm}
                  disabled={saving || !draft.exerciseId}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Confirm & log
                </Button>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
