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
  Sparkles,
  RefreshCw,
  Heart,
  Dumbbell,
  Apple,
  BarChart3,
  Brain,
  MessageSquare,
  ArrowRight,
  Rocket,
  TrendingUp,
  Lightbulb,
} from "lucide-react";

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  tip?: string;
  diagram?: boolean;
}

const steps: OnboardingStep[] = [
  {
    icon: Sparkles,
    title: "Welcome to The Vault",
    description:
      "This isn't a collection of separate trackers — it's one connected system. Everything you log feeds an AI coaching engine that gives you a personalised weekly performance review.",
  },
  {
    icon: RefreshCw,
    title: "The Loop",
    description:
      "You log your training, nutrition, and lifestyle data throughout the week. Your AI coach pulls all of it together into a single review — with specific feedback on what's working, what needs attention, and what to focus on next.",
    diagram: true,
  },
  {
    icon: Heart,
    title: "Daily Check-In",
    description:
      "Start each day with a 30-second check-in. Rate your sleep, stress, energy, and drive — these generate your Readiness Score. But the real power is in the notes field. Write what's going on: 'bad sleep, lower back tight, stressed about work.' The AI reads every note and connects the dots you might miss.",
    tip: "The notes field is the most valuable input in the entire app. The AI uses your words to understand context that numbers alone can't capture.",
  },
  {
    icon: Dumbbell,
    title: "Training",
    description:
      "Log your strength and conditioning work. The app tracks volume, PRs, and trends automatically. If you add RIR (Reps in Reserve) to your sets, the AI can tell whether you're pushing too hard or leaving too much in the tank — and adjust its recommendations.",
  },
  {
    icon: Apple,
    title: "Nutrition & Progress",
    description:
      "Track your macros, scan barcodes, and log bodyweight. The AI uses weight trends and nutrition data to spot patterns — like whether a calorie deficit is affecting your training performance.",
  },
  {
    icon: BarChart3,
    title: "The Weekly Review",
    description:
      "Every week, the AI pulls together your training volume, conditioning work, readiness scores, check-in notes, bodyweight trends, and RIR data into a single coaching review. The more you log, the smarter and more specific the feedback gets. This is why every input matters.",
  },
  {
    icon: TrendingUp,
    title: "The More You Log, The Better It Gets",
    description:
      "You don't have to fill in everything on day one. But the more data the AI has, the better it can coach you. Notes on your check-ins are especially valuable — they give the AI context that numbers alone can't provide.",
  },
  {
    icon: Rocket,
    title: "Get Started",
    description:
      "Head to the Lifestyle tab to do your first Daily Check-In. Start building the data that powers your coaching.",
  },
];

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

const STORAGE_KEY = "vault_onboarding_complete";

interface OnboardingWalkthroughProps {
  onComplete?: (tab?: string) => void;
}

export function OnboardingWalkthrough({ onComplete }: OnboardingWalkthroughProps) {
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

  const handleFinish = () => {
    dismiss();
    onComplete?.("lifestyle");
  };

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

        {/* Loop diagram on step 2 */}
        {current.diagram && <LoopDiagram />}

        {/* Pro tip callout */}
        {current.tip && (
          <div className="flex gap-2.5 rounded-lg bg-accent/10 border border-accent/20 p-3 mt-1">
            <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-accent leading-relaxed">{current.tip}</p>
          </div>
        )}

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
            {isLast ? (
              <Button size="sm" onClick={handleFinish}>
                Do Your First Check-In
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep(step + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
