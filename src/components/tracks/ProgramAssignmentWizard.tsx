import { useState } from "react";
import { format, addDays } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { useProgramStore, Program } from "@/stores/programStore";
import { toast } from "@/hooks/use-toast";

const DAYS = [
  { label: "Su", value: 0 },
  { label: "M",  value: 1 },
  { label: "Tu", value: 2 },
  { label: "W",  value: 3 },
  { label: "Th", value: 4 },
  { label: "F",  value: 5 },
  { label: "Sa", value: 6 },
];

const DEFAULT_DAYS: Record<string, number[]> = {
  wendler:    [1, 2, 4, 5],   // Mon, Tue, Thu, Fri
  fbb:        [1, 2, 4, 5],
  oly:        [1, 2, 4, 5],
  foundation: [1, 3, 5],      // Mon, Wed, Fri
  running:    [2, 4, 6],      // Tue, Thu, Sat
  rowing:     [2, 4, 6],
};

interface Props {
  program: Program | null;
  open: boolean;
  onClose: () => void;
}

export function ProgramAssignmentWizard({ program, open, onClose }: Props) {
  const { enrollInProgram, isEnrolling } = useProgramStore();
  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [addonPlacement, setAddonPlacement] = useState<"strength_days" | "rest_days">("rest_days");

  const isAddon = program?.category === "conditioning";
  const requiredDays = program?.days_per_week ?? 3;

  // Reset state when program changes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setTimeout(() => {
        setStep(1);
        setStartDate(new Date());
        setSelectedDays([]);
      }, 300);
    }
  };

  // Initialize default days when opening step 2
  const goToStep2 = () => {
    if (selectedDays.length === 0 && program) {
      setSelectedDays(DEFAULT_DAYS[program.program_style ?? ""] ?? [1, 3, 5]);
    }
    setStep(2);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : prev.length < requiredDays
          ? [...prev, day].sort((a, b) => a - b)
          : prev
    );
  };

  const handleConfirm = async () => {
    if (!program) return;
    try {
      await enrollInProgram(
        program.id,
        startDate,
        selectedDays,
        isAddon ? addonPlacement : undefined
      );
      toast({
        title: "Program started! 🎉",
        description: `Your first ${program.name} workout is on ${format(
          addDays(startDate, 0), "EEEE, MMM d"
        )}.`,
      });
      handleOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Enrollment failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!program) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">Step {step} of 2</Badge>
          </div>
          <DialogTitle className="text-lg">{program.name}</DialogTitle>
          <DialogDescription>
            {step === 1 && "When do you want to start your program?"}
            {step === 2 && `Which ${requiredDays} days will you train each week?`}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Date picker */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "EEEE, MMMM d, yyyy") : "Pick a start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) { setStartDate(date); setCalOpen(false); }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Your first workout will be scheduled starting {format(startDate, "EEEE, MMM d")}.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={goToStep2} className="gap-2">
                Choose Training Days
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Day selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Select exactly <strong>{requiredDays} days</strong> ({selectedDays.length}/{requiredDays} selected)
              </p>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(({ label, value }) => {
                  const active = selectedDays.includes(value);
                  const maxed = selectedDays.length >= requiredDays && !active;
                  return (
                    <button
                      key={value}
                      onClick={() => toggleDay(value)}
                      disabled={maxed}
                      className={cn(
                        "w-10 h-10 rounded-full text-sm font-semibold border-2 transition-all",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : maxed
                          ? "border-border text-muted-foreground opacity-40 cursor-not-allowed"
                          : "border-border text-foreground hover:border-primary hover:text-primary"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {isAddon && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Add this to which days?</p>
                <div className="flex gap-2">
                  {(["strength_days", "rest_days"] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setAddonPlacement(opt)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-md border-2 text-xs font-medium transition-all",
                        addonPlacement === opt
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary"
                      )}
                    >
                      {opt === "strength_days" ? "My existing strength days" : "My rest days"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedDays.length !== requiredDays || isEnrolling}
                variant="elite"
                className="gap-2"
              >
                {isEnrolling ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Scheduling…</>
                ) : (
                  <>Start Program →</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
