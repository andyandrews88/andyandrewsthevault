import { Badge } from "@/components/ui/badge";

interface LibraryHeaderProps {
  totalResources: number;
}

export function LibraryHeader({ totalResources }: LibraryHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-4xl md:text-5xl tracking-wide text-foreground">
          KNOWLEDGE BANK
        </h1>
        <Badge variant="outline" className="text-xs font-mono h-5">
          {totalResources}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="text-xs text-muted-foreground font-body">Updated this week</span>
      </div>
    </div>
  );
}
