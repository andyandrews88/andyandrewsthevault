import { Badge } from "@/components/ui/badge";

interface LibraryHeaderProps {
  totalResources: number;
}

export function LibraryHeader({ totalResources }: LibraryHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-base md:text-lg font-semibold text-foreground">
          Knowledge Bank
        </h1>
        <Badge variant="outline" className="font-mono h-5">
          {totalResources}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="text-xs text-muted-foreground">Updated this week</span>
      </div>
    </div>
  );
}
