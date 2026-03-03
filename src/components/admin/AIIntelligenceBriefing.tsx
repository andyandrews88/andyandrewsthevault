import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, RefreshCw, Sparkles, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const SECTION_COLORS: Record<string, string> = {
  "Executive": "border-l-blue-500",
  "Acquisition": "border-l-emerald-500",
  "Retention": "border-l-emerald-500",
  "Training": "border-l-orange-500",
  "Readiness": "border-l-purple-500",
  "Lifestyle": "border-l-purple-500",
  "Nutrition": "border-l-green-500",
  "Body": "border-l-pink-500",
  "Goal": "border-l-yellow-500",
  "Program": "border-l-cyan-500",
  "Compliance": "border-l-cyan-500",
  "Community": "border-l-teal-500",
  "Strategic": "border-l-indigo-500",
  "Recommendation": "border-l-indigo-500",
  "Priority": "border-l-red-500",
  "Matrix": "border-l-red-500",
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
  
  const sections: { title: string; content: string }[] = [];
  parts.forEach((part) => {
    const newlineIdx = part.indexOf("\n");
    if (newlineIdx === -1) return;
    const rawTitle = part.slice(0, newlineIdx).replace(/^#+\s*/, "").trim();
    const content = part.slice(newlineIdx + 1).replace(/^---\s*$/gm, "").trim();
    if (rawTitle && content) sections.push({ title: rawTitle, content });
  });
  return sections.length > 0 ? sections : [{ title: "Report", content: markdown }];
}

/** Highlight 🟢/🟡/🔴 indicators in content */
function enhanceContent(content: string): string {
  return content;
}

export function AIIntelligenceBriefing() {
  const [report, setReport] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-intelligence");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data.report);
      setGeneratedAt(data.generatedAt);
      const sections = parseSections(data.report);
      setOpenSections(new Set(sections.map((_, i) => i)));
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

  const toggleSection = (idx: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (!report) return;
    const sections = parseSections(report);
    if (openSections.size === sections.length) {
      setOpenSections(new Set());
    } else {
      setOpenSections(new Set(sections.map((_, i) => i)));
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

  const sections = parseSections(report || "");

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            Intelligence Briefing
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={generate} disabled={loading} className="h-7 w-7 shrink-0">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {generatedAt && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {new Date(generatedAt).toLocaleString()}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={toggleAll} className="text-xs h-7">
            {openSections.size === sections.length ? "Collapse All" : "Expand All"}
          </Button>
        </div>
      </CardHeader>

      {/* Table of Contents */}
      <div className="px-6 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {sections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => {
                setOpenSections(prev => {
                  const next = new Set(prev);
                  next.add(idx);
                  return next;
                });
                // Scroll to section
                document.getElementById(`briefing-section-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="text-[10px] px-2 py-1 rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              {section.title.replace(/^\d+\.\s*/, "").slice(0, 25)}
            </button>
          ))}
        </div>
      </div>

      <CardContent className="p-0">
        <ScrollArea className="max-h-[700px]">
          <div className="p-4 space-y-3">
            {sections.map((section, idx) => (
              <Collapsible key={idx} open={openSections.has(idx)} onOpenChange={() => toggleSection(idx)}>
                <div id={`briefing-section-${idx}`}>
                  <CollapsibleTrigger className={`w-full flex items-center justify-between p-3 rounded-lg border-l-4 ${getSectionColor(section.title)} bg-secondary/30 hover:bg-secondary/50 transition-colors`}>
                    <span className="text-sm font-semibold text-left">{section.title}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${openSections.has(idx) ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className={`pl-5 pr-3 py-3 border-l-4 ${getSectionColor(section.title)} border-l-opacity-30`}>
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-table:text-sm">
                        <ReactMarkdown>{enhanceContent(section.content)}</ReactMarkdown>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
