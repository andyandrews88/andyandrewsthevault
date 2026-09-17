import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  target: number | null;
  unit?: string;
  accent?: boolean;
}

export function MacroProgress({ label, value, target, unit = "g", accent }: Props) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = target ? value > target * 1.05 : false;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={cn("text-xs font-semibold", accent && "text-primary")}>
          {Math.round(value)}
          {target ? <span className="text-muted-foreground font-normal"> / {Math.round(target)}</span> : null}
          <span className="text-muted-foreground font-normal">{unit}</span>
        </p>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            over ? "bg-destructive" : accent ? "bg-primary" : "bg-foreground/60"
          )}
          style={{ width: `${target ? pct : 0}%` }}
        />
      </div>
    </div>
  );
}
