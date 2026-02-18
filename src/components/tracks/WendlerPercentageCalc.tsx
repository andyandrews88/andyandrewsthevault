import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

const WENDLER_WEEKS = [
  { label: "Week 1 (5s)", sets: [{ pct: 65, reps: "5" }, { pct: 75, reps: "5" }, { pct: 85, reps: "5+" }] },
  { label: "Week 2 (3s)", sets: [{ pct: 70, reps: "3" }, { pct: 80, reps: "3" }, { pct: 90, reps: "3+" }] },
  { label: "Week 3 (1+)", sets: [{ pct: 75, reps: "5" }, { pct: 85, reps: "3" }, { pct: 95, reps: "1+" }] },
];

function roundToFive(val: number): number {
  return Math.round(val / 5) * 5;
}

export function WendlerPercentageCalc() {
  const [trainingMax, setTrainingMax] = useState("");
  const [open, setOpen] = useState(false);

  const tm = parseFloat(trainingMax);
  const isValid = !isNaN(tm) && tm > 0;

  return (
    <Card variant="data" className="mb-4">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-primary">Wendler % Calculator</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOpen(o => !o)} className="h-7 px-2">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="text-xs ml-1">{open ? "Hide" : "Show"}</span>
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-xs whitespace-nowrap text-muted-foreground">Training Max (lbs)</Label>
            <Input
              type="number"
              placeholder="e.g. 315"
              value={trainingMax}
              onChange={e => setTrainingMax(e.target.value)}
              className="h-8 text-sm max-w-[120px]"
            />
            <span className="text-xs text-muted-foreground">(= 90% of your 1RM)</span>
          </div>

          {isValid && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1 pr-3 text-muted-foreground font-medium">Week</th>
                    <th className="text-center py-1 px-2 text-muted-foreground font-medium">Set 1</th>
                    <th className="text-center py-1 px-2 text-muted-foreground font-medium">Set 2</th>
                    <th className="text-center py-1 px-2 text-primary font-semibold">Set 3 (AMRAP)</th>
                  </tr>
                </thead>
                <tbody>
                  {WENDLER_WEEKS.map((week) => (
                    <tr key={week.label} className="border-b border-border/50">
                      <td className="py-1.5 pr-3 font-medium text-foreground">{week.label}</td>
                      {week.sets.map((s, i) => (
                        <td key={i} className={`py-1.5 px-2 text-center ${i === 2 ? "text-primary font-semibold" : "text-foreground"}`}>
                          <span className="font-mono">{roundToFive(tm * s.pct / 100)} lbs</span>
                          <span className="block text-muted-foreground text-[10px]">×{s.reps} @ {s.pct}%</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-muted-foreground mt-2">Weights rounded to nearest 5 lbs. "+" = AMRAP (as many reps as possible with good form).</p>
            </div>
          )}

          {!isValid && trainingMax && (
            <p className="text-xs text-destructive">Enter a valid training max weight.</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
