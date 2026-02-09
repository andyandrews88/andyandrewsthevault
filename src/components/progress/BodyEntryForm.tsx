import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Scale, Ruler, Scan, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/progressStore";
import { toast } from "sonner";
import { 
  type BodyEntryFormData, 
  type MeasurementSource,
  MEASUREMENT_SOURCE_LABELS,
  lbsToKg,
  inchesToCm,
  kgToLbs,
  cmToInches
} from "@/types/progress";

interface BodyEntryFormProps {
  onSuccess?: () => void;
}

export function BodyEntryForm({ onSuccess }: BodyEntryFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [usesImperial, setUsesImperial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [measurementSource, setMeasurementSource] = useState<MeasurementSource | "">("");
  
  const { addBodyEntry } = useProgressStore();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const weightUnit = usesImperial ? "lbs" : "kg";
  const lengthUnit = usesImperial ? "in" : "cm";

  const onSubmit = async (data: Record<string, string | number | undefined>) => {
    setIsSubmitting(true);
    try {
      // Convert values to metric if using imperial
      const formData: BodyEntryFormData = {
        entry_date: date,
        weight: data.weight ? (usesImperial ? lbsToKg(Number(data.weight)) : Number(data.weight)) : null,
        height: data.height ? (usesImperial ? inchesToCm(Number(data.height)) : Number(data.height)) : null,
        body_fat_percent: data.body_fat_percent ? Number(data.body_fat_percent) : null,
        measurement_source: measurementSource || null,
        
        // Circumferences
        neck: data.neck ? (usesImperial ? inchesToCm(Number(data.neck)) : Number(data.neck)) : null,
        shoulders: data.shoulders ? (usesImperial ? inchesToCm(Number(data.shoulders)) : Number(data.shoulders)) : null,
        chest: data.chest ? (usesImperial ? inchesToCm(Number(data.chest)) : Number(data.chest)) : null,
        waist: data.waist ? (usesImperial ? inchesToCm(Number(data.waist)) : Number(data.waist)) : null,
        hips: data.hips ? (usesImperial ? inchesToCm(Number(data.hips)) : Number(data.hips)) : null,
        left_bicep: data.left_bicep ? (usesImperial ? inchesToCm(Number(data.left_bicep)) : Number(data.left_bicep)) : null,
        right_bicep: data.right_bicep ? (usesImperial ? inchesToCm(Number(data.right_bicep)) : Number(data.right_bicep)) : null,
        left_forearm: data.left_forearm ? (usesImperial ? inchesToCm(Number(data.left_forearm)) : Number(data.left_forearm)) : null,
        right_forearm: data.right_forearm ? (usesImperial ? inchesToCm(Number(data.right_forearm)) : Number(data.right_forearm)) : null,
        left_thigh: data.left_thigh ? (usesImperial ? inchesToCm(Number(data.left_thigh)) : Number(data.left_thigh)) : null,
        right_thigh: data.right_thigh ? (usesImperial ? inchesToCm(Number(data.right_thigh)) : Number(data.right_thigh)) : null,
        left_calf: data.left_calf ? (usesImperial ? inchesToCm(Number(data.left_calf)) : Number(data.left_calf)) : null,
        right_calf: data.right_calf ? (usesImperial ? inchesToCm(Number(data.right_calf)) : Number(data.right_calf)) : null,
        
        // Advanced scan data
        lean_mass: data.lean_mass ? (usesImperial ? lbsToKg(Number(data.lean_mass)) : Number(data.lean_mass)) : null,
        fat_mass: data.fat_mass ? (usesImperial ? lbsToKg(Number(data.fat_mass)) : Number(data.fat_mass)) : null,
        bone_density: data.bone_density ? Number(data.bone_density) : null,
        visceral_fat_rating: data.visceral_fat_rating ? Number(data.visceral_fat_rating) : null,
        
        // Regional body fat
        trunk_fat_percent: data.trunk_fat_percent ? Number(data.trunk_fat_percent) : null,
        left_arm_fat_percent: data.left_arm_fat_percent ? Number(data.left_arm_fat_percent) : null,
        right_arm_fat_percent: data.right_arm_fat_percent ? Number(data.right_arm_fat_percent) : null,
        left_leg_fat_percent: data.left_leg_fat_percent ? Number(data.left_leg_fat_percent) : null,
        right_leg_fat_percent: data.right_leg_fat_percent ? Number(data.right_leg_fat_percent) : null,
        
        notes: String(data.notes || ""),
        uses_imperial: usesImperial,
      };

      await addBodyEntry(formData);
      toast.success("Entry added successfully!");
      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error adding entry:", error);
      toast.error("Failed to add entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Date and Unit Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1.5",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="unit-toggle">Metric</Label>
          <Switch
            id="unit-toggle"
            checked={usesImperial}
            onCheckedChange={setUsesImperial}
          />
          <Label htmlFor="unit-toggle">Imperial</Label>
        </div>
      </div>

      {/* Tabs for different entry types */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="measurements" className="flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Measurements
          </TabsTrigger>
          <TabsTrigger value="scans" className="flex items-center gap-2">
            <Scan className="w-4 h-4" />
            Scans
          </TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Weight ({weightUnit})</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder={usesImperial ? "e.g., 180" : "e.g., 82"}
                {...register("weight")}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="height">Height ({lengthUnit})</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                placeholder={usesImperial ? "e.g., 70" : "e.g., 178"}
                {...register("height")}
                className="mt-1.5 h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="body_fat_percent">Body Fat %</Label>
              <Input
                id="body_fat_percent"
                type="number"
                step="0.1"
                placeholder="e.g., 15"
                {...register("body_fat_percent")}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="measurement_source">Measurement Method</Label>
              <Select value={measurementSource} onValueChange={(v) => setMeasurementSource(v as MeasurementSource)}>
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEASUREMENT_SOURCE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="measurements" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter circumference measurements in {lengthUnit}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="neck">Neck</Label>
              <Input
                id="neck"
                type="number"
                step="0.1"
                {...register("neck")}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="shoulders">Shoulders</Label>
              <Input
                id="shoulders"
                type="number"
                step="0.1"
                {...register("shoulders")}
                className="mt-1.5 h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chest">Chest</Label>
              <Input
                id="chest"
                type="number"
                step="0.1"
                {...register("chest")}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="waist">Waist</Label>
              <Input
                id="waist"
                type="number"
                step="0.1"
                {...register("waist")}
                className="mt-1.5 h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hips">Hips</Label>
              <Input
                id="hips"
                type="number"
                step="0.1"
                {...register("hips")}
                className="mt-1.5 h-11"
              />
            </div>
          </div>

          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
            {showAdvanced ? "Hide" : "Show"} Arm & Leg Measurements
          </Button>

          {showAdvanced && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="left_bicep">Left Bicep</Label>
                  <Input
                    id="left_bicep"
                    type="number"
                    step="0.1"
                    {...register("left_bicep")}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="right_bicep">Right Bicep</Label>
                  <Input
                    id="right_bicep"
                    type="number"
                    step="0.1"
                    {...register("right_bicep")}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="left_forearm">Left Forearm</Label>
                  <Input
                    id="left_forearm"
                    type="number"
                    step="0.1"
                    {...register("left_forearm")}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="right_forearm">Right Forearm</Label>
                  <Input
                    id="right_forearm"
                    type="number"
                    step="0.1"
                    {...register("right_forearm")}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="left_thigh">Left Thigh</Label>
                  <Input
                    id="left_thigh"
                    type="number"
                    step="0.1"
                    {...register("left_thigh")}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="right_thigh">Right Thigh</Label>
                  <Input
                    id="right_thigh"
                    type="number"
                    step="0.1"
                    {...register("right_thigh")}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="left_calf">Left Calf</Label>
                  <Input
                    id="left_calf"
                    type="number"
                    step="0.1"
                    {...register("left_calf")}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="right_calf">Right Calf</Label>
                  <Input
                    id="right_calf"
                    type="number"
                    step="0.1"
                    {...register("right_calf")}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Scans Tab */}
        <TabsContent value="scans" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter data from DEXA, InBody, Bod Pod, or other body composition scans
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lean_mass">Lean Mass ({weightUnit})</Label>
              <Input
                id="lean_mass"
                type="number"
                step="0.1"
                {...register("lean_mass")}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="fat_mass">Fat Mass ({weightUnit})</Label>
              <Input
                id="fat_mass"
                type="number"
                step="0.1"
                {...register("fat_mass")}
                className="mt-1.5 h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bone_density">Bone Density (g/cm²)</Label>
              <Input
                id="bone_density"
                type="number"
                step="0.001"
                {...register("bone_density")}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="visceral_fat_rating">Visceral Fat Rating</Label>
              <Input
                id="visceral_fat_rating"
                type="number"
                {...register("visceral_fat_rating")}
                className="mt-1.5 h-11"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Regional Body Fat %</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trunk_fat_percent">Trunk</Label>
                <Input
                  id="trunk_fat_percent"
                  type="number"
                  step="0.1"
                  {...register("trunk_fat_percent")}
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label htmlFor="left_arm_fat_percent">Left Arm</Label>
                <Input
                  id="left_arm_fat_percent"
                  type="number"
                  step="0.1"
                  {...register("left_arm_fat_percent")}
                  className="mt-1.5 h-11"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="right_arm_fat_percent">Right Arm</Label>
                <Input
                  id="right_arm_fat_percent"
                  type="number"
                  step="0.1"
                  {...register("right_arm_fat_percent")}
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label htmlFor="left_leg_fat_percent">Left Leg</Label>
                <Input
                  id="left_leg_fat_percent"
                  type="number"
                  step="0.1"
                  {...register("left_leg_fat_percent")}
                  className="mt-1.5 h-11"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="right_leg_fat_percent">Right Leg</Label>
                <Input
                  id="right_leg_fat_percent"
                  type="number"
                  step="0.1"
                  {...register("right_leg_fat_percent")}
                  className="mt-1.5 h-11"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any additional notes about this entry..."
          {...register("notes")}
          className="mt-1.5"
        />
      </div>

      {/* Submit */}
      <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Entry"}
      </Button>
    </form>
  );
}
