import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExerciseLibraryAdmin } from "@/components/admin/ExerciseLibraryAdmin";
import { useEntitlement } from "@/hooks/useEntitlement";

export default function CoachMovements() {
  const navigate = useNavigate();
  const { entitlement, isLoading } = useEntitlement();

  useEffect(() => {
    if (!isLoading && !entitlement.isCoach) navigate("/vault", { replace: true });
  }, [isLoading, entitlement.isCoach, navigate]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="container mx-auto max-w-4xl px-4 pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/coach")} aria-label="Back to roster">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="section-label">COACH</p>
            <h1 className="text-xl font-bold leading-tight">Movement library</h1>
          </div>
        </div>
        <ExerciseLibraryAdmin />
      </div>
    </div>
  );
}
