import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Brain, RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

export function AIIntelligenceBriefing() {
  const [report, setReport] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-intelligence");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data.report);
      setGeneratedAt(data.generatedAt);
    } catch (e: any) {
      toast({
        title: "Intelligence Briefing Failed",
        description: e?.message || "Could not generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!report && !loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">AI Intelligence Briefing</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Generate a comprehensive AI-powered analysis of all platform data — training, nutrition, lifestyle, goals, community, and compliance.
            </p>
          </div>
          <Button onClick={generate} className="gap-2" variant="hero">
            <Sparkles className="h-4 w-4" />
            Generate Intelligence Briefing
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            Analysing platform data...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-primary" />
          Intelligence Briefing
        </CardTitle>
        <div className="flex items-center gap-2">
          {generatedAt && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {new Date(generatedAt).toLocaleString()}
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={generate} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
          <ReactMarkdown>{report || ""}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
