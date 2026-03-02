import { ReactNode } from "react";
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface Props {
  id: string;
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  editMode?: boolean;
}

export function CollapsibleDashboardSection({
  title, icon, badge, children, isOpen, onToggle,
  onMoveUp, onMoveDown, isFirst, isLast, editMode,
}: Props) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="flex items-center gap-2 group">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 flex-1 text-left py-1.5 px-1 -mx-1 rounded-md hover:bg-secondary/50 transition-colors">
            {icon}
            {badge || <span className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{title}</span>}
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200 ml-auto", isOpen && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        {editMode && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isFirst} onClick={onMoveUp}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isLast} onClick={onMoveDown}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="pt-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
