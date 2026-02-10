import { icons } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BreathworkMethod } from "@/data/breathworkMethods";

const purposeVariant: Record<string, "data" | "success" | "warning" | "elite" | "secondary"> = {
  Focus: "data",
  Sleep: "secondary",
  Activation: "warning",
  Relaxation: "success",
  Balance: "elite",
};

interface Props {
  method: BreathworkMethod;
  onSelect: (method: BreathworkMethod) => void;
}

export function BreathworkMethodCard({ method, onSelect }: Props) {
  const IconComp = icons[method.icon as keyof typeof icons];

  return (
    <Card
      variant="interactive"
      className="p-4 cursor-pointer group"
      onClick={() => onSelect(method)}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary group-hover:shadow-glow transition-shadow">
          {IconComp && <IconComp size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-foreground truncate">{method.name}</h4>
            <Badge variant={purposeVariant[method.purpose] ?? "secondary"} className="text-[10px] shrink-0">
              {method.purpose}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{method.shortDescription}</p>
        </div>
      </div>
    </Card>
  );
}
