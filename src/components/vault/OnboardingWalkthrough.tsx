import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  RefreshCw,
  Heart,
  Dumbbell,
  Apple,
  Brain,
  MessageSquare,
  ArrowRight,
  Rocket,
  Lightbulb,
  LayoutDashboard,
  Activity,
  Wind,
  Library,
  Radio,
  Users,
  Target,
  X,
} from "lucide-react";

interface TourStep {
  icon: React.ElementType;
  title: string;
  description: string;
  tip?: string;
  tab?: string; // which vault tab to navigate to
  isDialog?: boolean; // render as centered dialog vs floating card
}

const tourSteps: TourStep[] = [
  {
    icon: Sparkles,
    title: "Welcome to The Vault",
    description:
      "This isn't a collection of separate trackers — it's one connected system. Everything you log feeds an AI coaching engine that gives you a personalised weekly performance review.",
    isDialog: true,
  },
  {
    icon: RefreshCw,
    title: "The Loop",
    description:
      "You log your training, nutrition, and lifestyle data throughout the week. Your AI coach pulls all of it together into a single review — with specific feedback on what's working, what needs attention, and what to focus on next.",
    isDialog: true,
  },
  {
    icon: LayoutDashboard,
    title: "Your Dashboard",
    description:
      "This is your command center. Your AI coaching review appears here each week — pulling together training, nutrition, and lifestyle data into one actionable summary.",
    tab: "dashboard",
  },
  {
    icon: Heart,
    title: "Daily Check-In",
    description:
      "Start each day with a 30-second check-in. Rate your sleep, stress, energy, and drive — these generate your Readiness Score.",
    tip: "The notes field is the most valuable input in the entire app. The AI reads every note and connects the dots you might miss.",
    tab: "lifestyle",
  },
  {
    icon: Dumbbell,
    title: "Training",
    description:
      "Log your strength and conditioning work. The app tracks volume, PRs, and trends automatically. Add RIR (Reps in Reserve) to your sets so the AI can assess your intensity.",
    tab: "workouts",
  },
  {
    icon: Activity,
    title: "Progress Tracking",
    description:
      "Track bodyweight, body measurements, and composition data here. The AI uses weight trends to spot patterns — like whether a calorie deficit is affecting your training.",
    tab: "progress",
  },
  {
    icon: Rocket,
    title: "You're Ready",
    description:
      "Head to the Lifestyle tab and do your first Daily Check-In. The more you log, the smarter and more specific your coaching gets.",
    tab: "lifestyle",
  },
];

const STORAGE_KEY = "vault_onboarding_complete";

interface OnboardingWalkthroughProps {
  onComplete?: (tab?: string) => void;
  onTabChange?: (tab: string) => void;
  currentTab?: string;
}

export function OnboardingWalkthrough({ onComplete, onTabChange }: OnboardingWalkthroughProps) {
  const [isComplete] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [open, setOpen] = useState(!isComplete);
  const [step, setStep] = useState(0);

  if (isComplete) return null;
  if (!open) return null;

  const current = tourSteps[step];
  const isLast = step === tourSteps.length - 1;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const goToStep = (nextStep: number) => {
    setStep(nextStep);
    const nextDef = tourSteps[nextStep];
    if (nextDef.tab && onTabChange) {
      onTabChange(nextDef.tab);
    }
  };

  const handleNext = () => {
    if (isLast) {
      dismiss();
      onComplete?.("lifestyle");
    } else {
      goToStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) goToStep(step - 1);
  };

  const dots = (
    <div className="flex justify-center gap-1.5 py-2">
      {tourSteps.map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );

  const navButtons = (
    <div className="flex items-center justify-between pt-2">
      <Button variant="ghost" size="sm" onClick={dismiss}>
        Skip
      </Button>
      <div className="flex gap-2">
        {step > 0 && (
          <Button variant="outline" size="sm" onClick={handleBack}>
            Back
          </Button>
        )}
        <Button size="sm" onClick={handleNext}>
          {isLast ? "Do Your First Check-In" : "Next"}
        </Button>
      </div>
    </div>
  );

  // Steps 0-1: centered dialog
  if (current.isDialog) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <current.icon className="h-5 w-5 text-primary" />
              {current.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed pt-2">
              {current.description}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && <LoopDiagram />}

          {dots}
          {navButtons}
        </DialogContent>
      </Dialog>
    );
  }

  // Steps 2+: floating card at bottom
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Subtle backdrop */}
      <div className="absolute inset-0 bg-background/40 pointer-events-auto" onClick={dismiss} />

      {/* Floating card */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg pointer-events-auto">
        <Card className="p-5 shadow-xl border-primary/20 bg-card relative">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <current.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{current.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                {current.description}
              </p>
            </div>
          </div>

          {current.tip && (
            <div className="flex gap-2.5 rounded-lg bg-accent/10 border border-accent/20 p-3 mb-3">
              <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-accent leading-relaxed">{current.tip}</p>
            </div>
          )}

          {dots}
          {navButtons}
        </Card>
      </div>
    </div>
  );
}

function LoopDiagram() {
  const nodes = [
    { icon: Dumbbell, label: "Log Data" },
    { icon: Brain, label: "AI Analyzes" },
    { icon: MessageSquare, label: "You Get Coached" },
    { icon: RefreshCw, label: "Adjust" },
  ];

  return (
    <div className="flex items-center justify-center gap-1 py-4 flex-wrap sm:flex-nowrap">
      {nodes.map((node, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <node.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight w-16">
              {node.label}
            </span>
          </div>
          {i < nodes.length - 1 && (
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 mb-5 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
