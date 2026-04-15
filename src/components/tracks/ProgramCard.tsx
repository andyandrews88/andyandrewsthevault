import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dumbbell, Zap, Target, TrendingUp, Activity, RowsIcon, 
  CheckCircle2, ChevronRight 
} from "lucide-react";
import { Program } from "@/stores/programStore";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  strength: <Dumbbell className="w-4 h-4" />,
  functional: <Zap className="w-4 h-4" />,
  oly: <TrendingUp className="w-4 h-4" />,
  conditioning: <Activity className="w-4 h-4" />,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-secondary text-secondary-foreground",
  intermediate: "bg-primary/10 text-primary",
  advanced: "bg-accent/10 text-accent",
};

const STYLE_ACCENT: Record<string, string> = {
  wendler: "border-primary/30 hover:border-primary/60",
  fbb: "border-primary/20 hover:border-primary/40",
  oly: "border-accent/30 hover:border-accent/60",
  foundation: "border-border hover:border-border-elevated",
  running: "border-border hover:border-border-elevated",
  rowing: "border-border hover:border-border-elevated",
};

interface ProgramCardProps {
  program: Program;
  isEnrolled: boolean;
  onSelect: (program: Program) => void;
}

export function ProgramCard({ program, isEnrolled, onSelect }: ProgramCardProps) {
  const navigate = useNavigate();
  const icon = CATEGORY_ICONS[program.category] ?? <Dumbbell className="w-4 h-4" />;
  const accentClass = STYLE_ACCENT[program.program_style ?? ""] ?? "border-border hover:border-border-elevated";

  const goToLanding = () => navigate(`/program/${program.slug}`);

  return (
    <Card
      className={`border transition-all duration-200 cursor-pointer ${accentClass} ${isEnrolled ? "opacity-90" : ""}`}
      onClick={goToLanding}
    >
      <CardContent className="p-3 flex flex-col gap-3 h-full">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="p-2 rounded-md bg-primary/10 text-primary">{icon}</div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Badge className="text-[10px] px-1.5 py-0 bg-accent text-accent-foreground font-semibold">FREE</Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{program.duration_weeks} WEEKS</Badge>
          </div>
        </div>

        {/* Name & description */}
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm mb-1">{program.name}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{program.description}</p>
        </div>

        {/* Meta tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            className={`text-[10px] px-1.5 py-0 capitalize ${DIFFICULTY_COLORS[program.difficulty] ?? ""}`}
          >
            {program.difficulty}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {program.days_per_week}d/week
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
            {program.category}
          </Badge>
        </div>

        {/* Action */}
        {isEnrolled ? (
          <div className="flex items-center gap-2 text-xs text-primary font-medium pt-1">
            <CheckCircle2 className="w-4 h-4" />
            Enrolled
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs mt-auto"
            onClick={(e) => { e.stopPropagation(); goToLanding(); }}
          >
            View Program
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
