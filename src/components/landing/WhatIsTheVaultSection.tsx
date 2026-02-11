import { Shield, Link2, Unlock } from "lucide-react";

const differentiators = [
  {
    icon: Shield,
    title: "Coach-Built, Not Tech-Built",
    description:
      "Designed from a decade of real coaching — not by a product team chasing features. Every tool exists because athletes needed it.",
  },
  {
    icon: Link2,
    title: "One Place, Everything Connected",
    description:
      "Training, nutrition, and lifestyle all feed into each other. Your readiness score shapes your training suggestions. No more juggling five apps.",
  },
  {
    icon: Unlock,
    title: "Free. No Paywall on the Basics.",
    description:
      "Core tracking is completely free. No trials, no hidden upsells. The tools you need to train smarter are yours from day one.",
  },
];

export function WhatIsTheVaultSection() {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Is <span className="text-gradient-primary">The Vault</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            A first-principles performance platform — your second brain for training, nutrition, and lifestyle. Built by a coach who got tired of telling athletes to use six different apps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {differentiators.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border bg-card p-6 text-center hover:border-border-elevated hover:shadow-glow transition-all duration-300"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
