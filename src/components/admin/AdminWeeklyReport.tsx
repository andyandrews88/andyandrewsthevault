import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminWeeklyReport() {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-weekly-report");
      if (error) throw error;
      setReport(data.report);
    } catch (e) {
      toast({
        title: "Failed to generate report",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">AI Weekly Briefing</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateReport}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            {report ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[85%]" />
          </div>
        ) : report ? (
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {report}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click Generate to get your AI-powered weekly platform briefing.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
