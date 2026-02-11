import { Dumbbell, Apple, Activity, Heart, Wind, Library, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Dumbbell,
    title: "Workout Tracker",
    description: "Log sessions, track PRs, and visualize volume trends with a mobile-first logger built for the gym floor.",
    tab: "workouts",
  },
  {
    icon: Apple,
    title: "Nutrition",
    description: "Engineering-grade macro calculator, barcode scanning, food diary, and a 50+ recipe library.",
    tab: "nutrition",
  },
  {
    icon: Activity,
    title: "Progress Tracking",
    description: "Bodyweight, body composition, and circumference measurements — all charted over time.",
    tab: "progress",
  },
  {
    icon: Heart,
    title: "Lifestyle & Readiness",
    description: "Daily check-ins for sleep, stress, energy, and drive generate a Readiness Score that shapes your training.",
    tab: "lifestyle",
  },
  {
    icon: Wind,
    title: "Guided Breathwork",
    description: "Five evidence-based protocols — Box Breathing, 4-7-8, Wim Hof, and more — with visual and audio guidance.",
    tab: "lifestyle",
  },
  {
    icon: Library,
    title: "Knowledge Bank",
    description: "Curated coaching resources on training, nutrition, and lifestyle — articles, videos, and podcasts.",
    tab: "library",
  },
];

export function FeaturesSection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28 relative bg-card/30">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need. <span className="text-gradient-primary">Nothing You Don't.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Six integrated modules that talk to each other — so your data actually means something.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-lg border border-border bg-card p-5 hover:border-primary/40 hover:shadow-glow transition-all duration-300 flex flex-col"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {feature.description}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 self-start text-primary hover:text-primary/80 px-0"
                onClick={() => navigate(`/vault?tab=${feature.tab}`)}
              >
                Try It <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
