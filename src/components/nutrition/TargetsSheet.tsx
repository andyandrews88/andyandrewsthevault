import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNutritionLogStore, type NutritionTarget } from "@/stores/nutritionLogStore";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  current: NutritionTarget | null;
}

export function TargetsSheet({ open, onOpenChange, userId, current }: Props) {
  const { saveTarget, saving } = useNutritionLogStore();
  const [values, setValues] = useState({
    calories: current?.calories?.toString() ?? "",
    protein_g: current?.protein_g?.toString() ?? "",
    carbs_g: current?.carbs_g?.toString() ?? "",
    fats_g: current?.fats_g?.toString() ?? "",
    notes: current?.notes ?? "",
  });

  const submit = async () => {
    const ok = await saveTarget(userId, format(new Date(), "yyyy-MM-dd"), {
      calories: values.calories ? Number(values.calories) : null,
      protein_g: values.protein_g ? Number(values.protein_g) : null,
      carbs_g: values.carbs_g ? Number(values.carbs_g) : null,
      fats_g: values.fats_g ? Number(values.fats_g) : null,
      notes: values.notes || null,
    });
    if (!ok) {
      toast.error("Could not save the targets.");
      return;
    }
    toast.success("Targets updated from today");
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle>Daily targets</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-4">
          <p className="text-xs text-muted-foreground">
            These apply from today onwards. Past days keep the targets they were set with.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {([
              ["calories", "Calories"],
              ["protein_g", "Protein (g)"],
              ["carbs_g", "Carbs (g)"],
              ["fats_g", "Fat (g)"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input
                  inputMode="decimal"
                  className="h-11"
                  value={values[key]}
                  onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                  placeholder="—"
                />
              </div>
            ))}
          </div>
          <div>
            <Label className="text-xs">Note</Label>
            <Textarea
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
              placeholder="Optional guidance"
            />
          </div>
          <Button variant="elite" className="w-full h-12" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save targets
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
