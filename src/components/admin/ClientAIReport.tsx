import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, RefreshCw, Sparkles, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface ClientAIReportProps {
  userId: string;
  displayName: string;
}

const SECTION_COLORS: Record<string, string> = {
  "Overview": "border-l-blue-500",
  "Training": "border-l-orange-500",
  "Readiness": "border-l-purple-500",
  "Nutrition": "border-l-green-500",
  "Goal": "border-l-yellow-500",
  "Body": "border-l-pink-500",
  "Community": "border-l-cyan-500",
  "Coaching": "border-l-indigo-500",
  "Risk": "border-l-red-500",
};

function getSectionColor(title: string): string {
  for (const [key, color] of Object.entries(SECTION_COLORS)) {
    if (title.includes(key)) return color;
  }
  return "border-l-primary";
}

function parseSections(markdown: string): { title: string; content: string }[] {
  const parts = markdown.split(/^## /m).filter(Boolean);
  if (parts.length <= 1) return [{ title: "Report", content: markdown }];
  
  // First part might be intro text before first ##
  const sections: { title: string; content: string }[] = [];
  parts.forEach((part, i) => {
    const newlineIdx = part.indexOf("\n");
    if (newlineIdx === -1) return;
    const title = part.slice(0, newlineIdx).replace(/^#+\s*/, "").trim();
    const content = part.slice(newlineIdx + 1).replace(/^---\s*$/gm, "").trim();
    if (title && content) sections.push({ title, content });
  });
  return sections.length > 0 ? sections : [{ title: "Report", content: markdown }];
}

export function ClientAIReport({ userId, displayName }: ClientAIReportProps) {
  const [report, setReport] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-client-report", {
        body: { userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data.report);
      setGeneratedAt(data.generatedAt);
      // Open all sections by default
      const sections = parseSections(data.report);
      setOpenSections(new Set(sections.map((_, i) => i)));
    } catch (e: any) {
      toast({
        title: "Client Report Failed",
        description: e?.message || "Could not generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (idx: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (!report && !loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10 shrink-0">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">AI Client Report</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate an AI-powered coaching analysis for {displayName}
            </p>
          </div>
          <Button onClick={generate} size="sm" variant="hero" className="gap-1.5 shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-primary animate-pulse" />
            Analysing {displayName}'s data...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  const sections = parseSections(report || "");

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4 text-primary" />
          AI Report — {displayName}
        </CardTitle>
        <div className="flex items-center gap-2">
          {generatedAt && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {new Date(generatedAt).toLocaleString()}
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={generate} disabled={loading} className="h-7 w-7">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          {sections.map((section, idx) => (
            <Collapsible key={idx} open={openSections.has(idx)} onOpenChange={() => toggleSection(idx)}>
              <CollapsibleTrigger className={`w-full flex items-center justify-between p-3 rounded-lg border-l-4 ${getSectionColor(section.title)} bg-secondary/30 hover:bg-secondary/50 transition-colors`}>
                <span className="text-sm font-semibold text-left">{section.title}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.has(idx) ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className={`pl-5 pr-3 py-3 border-l-4 ${getSectionColor(section.title)} border-l-opacity-30 ml-0`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
