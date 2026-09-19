import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Camera, Loader2, Mic, MicOff, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import {
  useNutritionLogStore,
  type LogSource,
  type MealSlot,
} from "@/stores/nutritionLogStore";

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryDate: string;
  defaultSlot?: MealSlot;
  onSaved?: () => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function LogMealSheet({ open, onOpenChange, entryDate, defaultSlot = "lunch", onSaved }: Props) {
  const { addEntry, saving } = useNutritionLogStore();
  const speech = useSpeechInput();
  const fileRef = useRef<HTMLInputElement>(null);

  const [slot, setSlot] = useState<MealSlot>(defaultSlot);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [isEstimate, setIsEstimate] = useState(false);
  const [aiRaw, setAiRaw] = useState<Record<string, unknown> | null>(null);
  const [macros, setMacros] = useState({ calories: "", protein: "", carbs: "", fats: "" });

  const [usedVoice, setUsedVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);

  // Interim browser recognition text is noisy, so it is never shown. Only the
  // final result is folded into the description once the user stops speaking.
  useEffect(() => {
    if (speech.listening || !speech.transcript) return;
    const final = speech.transcript.trim();
    if (!final) return;
    setDescription((prev) => (prev ? `${prev} ${final}`.trim() : final));
    setVoiceTranscript((prev) => (prev ? `${prev} ${final}`.trim() : final));
    setUsedVoice(true);
    speech.reset();
  }, [speech.listening, speech.transcript, speech]);

  const text = description;

  const reset = () => {
    setSlot(defaultSlot);
    setDescription("");
    setPhoto(null);
    setPhotoPreview(null);
    setIsEstimate(false);
    setAiRaw(null);
    setMacros({ calories: "", protein: "", carbs: "", fats: "" });
    setUsedVoice(false);
    setVoiceTranscript(null);
    speech.reset();
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const runEstimate = async () => {
    if (!text && !photo) {
      toast.error("Add a photo or describe the meal first.");
      return;
    }
    setEstimating(true);
    try {
      const imageBase64 = photo ? await fileToDataUrl(photo) : null;
      const { data, error } = await supabase.functions.invoke("nutrition-estimate", {
        body: { description: text, imageBase64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const est = data.estimate;
      setMacros({
        calories: String(Math.round(est.calories)),
        protein: String(Math.round(est.protein)),
        carbs: String(Math.round(est.carbs)),
        fats: String(Math.round(est.fats)),
      });
      if (!description && est.summary) setDescription(est.summary);
      setAiRaw(est);
      setIsEstimate(true);
    } catch (e) {
      toast.error((e as Error).message || "Could not estimate this meal. Enter the numbers yourself.");
    } finally {
      setEstimating(false);
    }
  };

  const save = async () => {
    const finalDescription = text.trim();
    if (!finalDescription && !photo) {
      toast.error("Describe the meal or add a photo.");
      return;
    }
    const source: LogSource = photo ? "photo" : usedVoice ? "voice" : "manual";
    const ok = await addEntry({
      entry_date: entryDate,
      meal_slot: slot,
      description: finalDescription || "Meal photo",
      macros: {
        calories: Number(macros.calories) || 0,
        protein: Number(macros.protein) || 0,
        carbs: Number(macros.carbs) || 0,
        fats: Number(macros.fats) || 0,
      },
      source,
      photoFile: photo,
      transcript: speech.transcript || null,
      aiEstimate: aiRaw,
    });
    if (!ok) {
      toast.error("Could not save that. Check your connection and try again.");
      return;
    }
    toast.success("Logged");
    reset();
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) speech.stop(); onOpenChange(o); }}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Log food</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8 space-y-4">
          {/* Meal slot */}
          <div className="grid grid-cols-4 gap-1.5">
            {SLOTS.map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className={cn(
                  "min-h-[44px] rounded-lg border text-xs font-medium capitalize transition-colors",
                  slot === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Photo */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Meal" className="w-full h-44 object-cover rounded-xl" />
                <button
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button variant="outline" className="w-full h-11" onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4 mr-2" /> Add meal photo
              </Button>
            )}
          </div>

          {/* Description + voice */}
          <div className="space-y-2">
            <Label className="text-xs">What did you eat?</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chicken, rice and veg — big bowl"
              className="min-h-[72px]"
            />
            {speech.transcript && (
              <p className="text-xs text-muted-foreground italic">Heard: "{speech.transcript}"</p>
            )}
            {speech.supported ? (
              <Button
                variant={speech.listening ? "destructive" : "outline"}
                className="w-full h-11"
                onClick={() => (speech.listening ? speech.stop() : speech.start())}
              >
                {speech.listening ? (
                  <><MicOff className="h-4 w-4 mr-2" /> Stop recording</>
                ) : (
                  <><Mic className="h-4 w-4 mr-2" /> Describe it out loud</>
                )}
              </Button>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Voice input isn't available in this browser — type the description instead.
              </p>
            )}
            {speech.error && <p className="text-xs text-destructive">{speech.error}</p>}
          </div>

          {/* AI estimate */}
          <Button variant="secondary" className="w-full h-11" onClick={runEstimate} disabled={estimating}>
            {estimating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Estimate calories & macros
          </Button>

          {isEstimate && (
            <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2">
              <p className="text-xs font-semibold text-accent">Estimate — check before saving</p>
              {typeof aiRaw?.note === "string" && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{aiRaw.note as string}</p>
              )}
            </div>
          )}

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2">
            {([
              ["calories", "kcal"],
              ["protein", "Protein"],
              ["carbs", "Carbs"],
              ["fats", "Fat"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
                <Input
                  inputMode="decimal"
                  value={macros[key]}
                  onChange={(e) => setMacros({ ...macros, [key]: e.target.value })}
                  className="h-11 text-center"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <Button variant="elite" className="w-full h-12" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEstimate ? "Confirm & save" : "Save entry"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
