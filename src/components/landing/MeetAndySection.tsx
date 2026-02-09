import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, UtensilsCrossed, BookOpen, TrendingUp, Search } from "lucide-react";

const features = [
  {
    icon: Dumbbell,
    title: "Training Log",
    description: "Log workouts, track PRs, and visualise volume and strength trends over time.",
  },
  {
    icon: UtensilsCrossed,
    title: "Nutrition Tracker",
    description: "Calculate macros, scan barcodes, and plan meals from 50+ high-protein recipes.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Bank",
    description: "A free library of curated resources on training, nutrition, and lifestyle.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Track bodyweight, body composition, and measurements over time.",
  },
  {
    icon: Search,
    title: "Structural Audit",
    description: "A diagnostic tool that finds gaps in your training, nutrition, and recovery.",
  },
];

export function MeetAndySection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Philosophy */}
          <div className="space-y-6">
            <Badge variant="elite" className="mb-2">
              WHY THE VAULT EXISTS
            </Badge>

            <h2 className="text-3xl md:text-4xl font-bold">
              Built From <span className="text-gradient-gold">Frustration</span>
            </h2>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                I built The Vault because I was tired of the fragmentation. One app for calories.
                Another for workouts. A spreadsheet for body comp. A notes app for everything I've
                learned coaching athletes for over a decade. None of them talked to each other, and
                none of them were built the way I think about performance — from first principles, not trends.
              </p>

              <p>
                The Vault is my answer to that. It's a centralised system where you can track your
                training, dial in your nutrition, and monitor your progress — all in one place,
                without the noise. But it's also something else: my second brain. Every piece of
                knowledge I've gathered as a coach — the frameworks, the protocols, the lessons
                learned from working with hundreds of athletes — lives here as a free resource.
                No gatekeeping. No paywall on the basics.
              </p>

              <p className="text-foreground/70 italic border-l-2 border-primary pl-4">
                This isn't finished. It never will be. I'm building this as a living system that
                grows with the community that uses it.
              </p>
            </div>
          </div>

          {/* Right: Feature cards */}
          <div className="space-y-4">
            <Badge variant="data" className="mb-2">
              WHAT'S INSIDE
            </Badge>

            <div className="grid gap-3">
              {features.map((feature) => (
                <Card key={feature.title} variant="interactive" className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-0.5">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
