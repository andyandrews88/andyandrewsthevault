import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  Activity,
  Heart,
  Library,
} from "lucide-react";

const steps = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "Your command center. See today's readiness, training volume, nutrition targets, and body composition at a glance — plus an AI-generated weekly coaching review.",
  },
  {
    icon: Dumbbell,
    title: "Workouts",
    description:
      "Log strength and conditioning sessions with a mobile-first interface. Track PRs automatically, visualize volume trends, and review any past session from the calendar.",
  },
  {
    icon: Apple,
    title: "Nutrition",
    description:
      "Calculate your macros from first principles, scan barcodes, build meals, and browse a curated recipe library — all feeding into your daily targets.",
  },
  {
    icon: Activity,
    title: "Progress",
    description:
      "Track bodyweight, body composition, and circumference measurements over time. Chart your trajectory and spot trends before they become problems.",
  },
  {
    icon: Heart,
    title: "Lifestyle & Breathwork",
    description:
      "Daily check-ins for sleep, stress, energy, and drive generate a Readiness Score. Five guided breathwork protocols help you recover and focus.",
  },
  {
    icon: Library,
    title: "Knowledge Bank",
    description:
      "Curated articles, videos, and podcasts on training, nutrition, and lifestyle — handpicked coaching resources, not algorithm noise.",
  },
];

const STORAGE_KEY = "vault_onboarding_complete";

export function OnboardingWalkthrough() {
  const [isComplete] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [open, setOpen] = useState(!isComplete);
  const [step, setStep] = useState(0);

  if (isComplete) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <current.icon className="h-5 w-5 text-primary" />
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => (isLast ? dismiss() : setStep(step + 1))}
            >
              {isLast ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
