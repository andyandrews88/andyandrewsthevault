import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgramAdmin } from "@/components/admin/ProgramAdmin";
import { ProgramAvailabilityManager } from "@/components/coach/ProgramAvailabilityManager";
import { useEntitlement } from "@/hooks/useEntitlement";

export default function CoachPrograms() {
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
            <h1 className="text-xl font-bold leading-tight">Programs</h1>
          </div>
        </div>

        <Tabs defaultValue="curated">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="curated">Tier 2 availability</TabsTrigger>
            <TabsTrigger value="builder">Program builder</TabsTrigger>
          </TabsList>
          <TabsContent value="curated" className="mt-4">
            <ProgramAvailabilityManager />
          </TabsContent>
          <TabsContent value="builder" className="mt-4">
            <ProgramAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
