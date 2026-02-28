import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

export type PresetKey = "1W" | "2W" | "1M" | "3M" | "6M" | "1Y";

interface DateRangeSelectorProps {
  onRangeChange: (from: Date, to: Date) => void;
  defaultPreset?: PresetKey;
  presets?: PresetKey[];
  className?: string;
}

const ALL_PRESETS: PresetKey[] = ["1W", "2W", "1M", "3M", "6M", "1Y"];

function computeRange(preset: PresetKey): { from: Date; to: Date } {
  const to = new Date();
  switch (preset) {
    case "1W": return { from: subWeeks(to, 1), to };
    case "2W": return { from: subWeeks(to, 2), to };
    case "1M": return { from: subMonths(to, 1), to };
    case "3M": return { from: subMonths(to, 3), to };
    case "6M": return { from: subMonths(to, 6), to };
    case "1Y": return { from: subMonths(to, 12), to };
  }
}

export function DateRangeSelector({
  onRangeChange,
  defaultPreset = "1M",
  presets = ALL_PRESETS,
  className,
}: DateRangeSelectorProps) {
  const [active, setActive] = useState<PresetKey | "custom">(defaultPreset);
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);

  const handlePreset = useCallback((p: PresetKey) => {
    setActive(p);
    const range = computeRange(p);
    onRangeChange(range.from, range.to);
  }, [onRangeChange]);

  const handleApplyCustom = useCallback(() => {
    if (customFrom && customTo) {
      setActive("custom");
      onRangeChange(customFrom, customTo);
      setOpen(false);
    }
  }, [customFrom, customTo, onRangeChange]);

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      <div className="flex rounded-md border border-border overflow-hidden">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => handlePreset(p)}
            className={cn(
              "px-2 py-1 text-xs font-medium transition-colors",
              active === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-border transition-colors",
              active === "custom"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            {active === "custom" && customFrom && customTo
              ? `${format(customFrom, "MMM d")} – ${format(customTo, "MMM d")}`
              : "Custom"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="end">
          <div className="flex flex-col sm:flex-row gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">From</p>
              <Calendar
                mode="single"
                selected={customFrom}
                onSelect={setCustomFrom}
                disabled={(date) => date > new Date()}
                className="p-2 pointer-events-auto"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">To</p>
              <Calendar
                mode="single"
                selected={customTo}
                onSelect={setCustomTo}
                disabled={(date) => date > new Date() || (customFrom ? date < customFrom : false)}
                className="p-2 pointer-events-auto"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="w-full mt-2"
            disabled={!customFrom || !customTo}
            onClick={handleApplyCustom}
          >
            Apply
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { computeRange };
