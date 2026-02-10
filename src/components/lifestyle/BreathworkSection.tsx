import { useState } from "react";
import { ArrowLeft, Play, Clock, RotateCcw, icons } from "lucide-react";
import { breathworkMethods, type BreathworkMethod } from "@/data/breathworkMethods";
import { BreathworkMethodCard } from "./BreathworkMethodCard";
import { BreathworkSession } from "./BreathworkSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type View = "grid" | "detail" | "session";

export function BreathworkSection() {
  const [view, setView] = useState<View>("grid");
  const [selected, setSelected] = useState<BreathworkMethod | null>(null);

  const handleSelect = (m: BreathworkMethod) => {
    setSelected(m);
    setView("detail");
  };

  const handleBack = () => {
    if (view === "detail") setView("grid");
    else if (view === "session") setView("detail");
  };

  if (view === "session" && selected) {
    return <BreathworkSession method={selected} onClose={() => setView("detail")} />;
  }

  if (view === "detail" && selected) {
    const IconComp = icons[selected.icon as keyof typeof icons];
    const cycleDuration = selected.phases.reduce((s, p) => s + p.duration, 0);

    return (
      <Card>
        <CardHeader className="pb-3">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit">
            <ArrowLeft size={14} /> Back to methods
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              {IconComp && <IconComp size={24} />}
            </div>
            <div>
              <CardTitle className="text-lg">{selected.name}</CardTitle>
              <Badge variant="data" className="mt-1 text-[10px]">{selected.purpose}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{selected.fullDescription}</p>

          <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why It Works</h4>
            <p className="text-sm text-foreground/80 leading-relaxed">{selected.science}</p>
          </div>

          <div className="rounded-lg bg-muted/50 border border-border p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pattern Breakdown</h4>
            <div className="flex flex-wrap gap-2">
              {selected.phases.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-card border border-border rounded-md px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">{p.name}</span>
                  <span className="font-mono text-xs text-primary font-semibold">{p.duration}s</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock size={12} /> {cycleDuration}s per cycle</span>
              <span className="flex items-center gap-1"><RotateCcw size={12} /> {selected.rounds} rounds</span>
            </div>
          </div>

          <Button variant="hero" size="lg" className="w-full" onClick={() => setView("session")}>
            <Play size={18} /> Begin Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Guided Breathwork</CardTitle>
        <p className="text-sm text-muted-foreground">Choose a method and follow the guided session.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {breathworkMethods.map((m) => (
            <BreathworkMethodCard key={m.id} method={m} onSelect={handleSelect} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
