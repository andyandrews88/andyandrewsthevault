import { useAuditStore } from "@/stores/auditStore";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { AlertTriangle, CheckCircle, ArrowRight, RotateCcw, Lock, Info, ExternalLink, Sparkles, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { getRecommendedResources } from "@/data/resources";
import { RecommendedResources } from "./RecommendedResources";
import { supabase } from "@/integrations/supabase/client";

const tierBadges = {
  foundation: 'outline' as const,
  intermediate: 'secondary' as const,
  performance: 'data' as const,
  elite: 'elite' as const,
};

export function ResultsPage() {
  const navigate = useNavigate();
  const { results, reset } = useAuditStore();
  const [aiRecap, setAiRecap] = useState<string | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const [recapError, setRecapError] = useState<string | null>(null);

  const recommendedResources = useMemo(() => {
    if (!results) return [];
    const leakIds = results.leaks.map(leak => leak.id);
    return getRecommendedResources(leakIds);
  }, [results]);

  const fetchRecap = async () => {
    if (!results) return;
    setRecapLoading(true);
    setRecapError(null);
    try {
      const { data, error } = await supabase.functions.invoke('audit-recap', {
        body: { results }
      });
      if (error) throw error;
      setAiRecap(data.recap);
    } catch (e: any) {
      console.error('Recap error:', e);
      setRecapError(e.message || 'Failed to generate analysis');
    } finally {
      setRecapLoading(false);
    }
  };

  useEffect(() => {
    if (!results) {
      navigate('/audit');
      return;
    }
    fetchRecap();
  }, [results, navigate]);

  if (!results) return null;

  const chartData = [
    { metric: 'Strength', user: results.scores.strength, foundation: 50, performance: 75 },
    { metric: 'Endurance', user: results.scores.endurance, foundation: 50, performance: 75 },
    { metric: 'Mobility', user: results.scores.mobility, foundation: 50, performance: 75 },
    { metric: 'Power', user: results.scores.power, foundation: 50, performance: 75 },
    { metric: 'Stability', user: results.scores.stability, foundation: 50, performance: 75 },
  ];

  const handleStartOver = () => {
    reset();
    navigate('/audit');
  };

  // Simple markdown renderer for bold and headers
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h4 key={i} className="text-base font-semibold mt-4 mb-2">{line.slice(4)}</h4>;
      if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-semibold mt-5 mb-2">{line.slice(3)}</h3>;
      if (line.startsWith('# ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.slice(2)}</h2>;
      if (line.startsWith('- ')) {
        const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <li key={i} className="text-sm text-muted-foreground ml-4 mb-1" dangerouslySetInnerHTML={{ __html: content }} />;
      }
      if (line.trim() === '') return <br key={i} />;
      const content = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="text-sm text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: content }} />;
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="data" className="mb-4">ANALYSIS COMPLETE</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Structural Integrity Report</h1>
          <p className="text-muted-foreground">Your performance architecture has been analyzed</p>
        </div>

        {/* Foundation Recommendation Advisory */}
        {results.foundationRecommended && (
          <Card variant="elevated" className="mb-8 border-accent/30 bg-accent/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-accent mb-2">Foundation Track Recommended</h3>
                  <p className="text-sm text-muted-foreground">{results.foundationReason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overall score card */}
        <Card variant="data" className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-2">OVERALL SCORE</p>
                <p className="text-6xl font-bold font-mono text-gradient-primary data-glow">{results.overallScore}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">CLASSIFICATION</p>
                <Badge variant={tierBadges[results.tier]} className="text-lg px-4 py-1">{results.tier.toUpperCase()} TIER</Badge>
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm text-muted-foreground mb-2">LEAKS DETECTED</p>
                <p className={`text-4xl font-bold font-mono ${results.leaks.length === 0 ? 'text-success' : 'text-destructive'}`}>{results.leaks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar chart */}
        <Card variant="elevated" className="mb-8">
          <CardHeader>
            <CardTitle>Performance Radar</CardTitle>
            <CardDescription>Your metrics compared to Foundation and Performance benchmarks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid stroke="hsl(215 14% 20%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(215 14% 50%)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(215 14% 40%)' }} tickCount={5} />
                  <Radar name="Foundation Baseline" dataKey="foundation" stroke="hsl(215 14% 40%)" fill="hsl(215 14% 40%)" fillOpacity={0.1} strokeDasharray="4 4" />
                  <Radar name="Performance Target" dataKey="performance" stroke="hsl(45 93% 58%)" fill="hsl(45 93% 58%)" fillOpacity={0.1} strokeDasharray="4 4" />
                  <Radar name="Your Results" dataKey="user" stroke="hsl(192 91% 54%)" fill="hsl(192 91% 54%)" fillOpacity={0.3} strokeWidth={2} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span style={{ color: 'hsl(210 20% 95%)' }}>{value}</span>} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Card */}
        <Card variant="elevated" className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Performance Analysis
                </CardTitle>
                <CardDescription>Personalized interpretation of your results</CardDescription>
              </div>
              {!recapLoading && (
                <Button variant="outline" size="sm" onClick={fetchRecap}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Regenerate
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recapLoading && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground animate-pulse">Generating your personalized analysis...</p>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}
            {recapError && (
              <div className="text-sm text-destructive">
                <p>{recapError}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={fetchRecap}>Try Again</Button>
              </div>
            )}
            {aiRecap && !recapLoading && (
              <div className="prose prose-sm prose-invert max-w-none">
                {renderMarkdown(aiRecap)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skipped Areas Notice */}
        {results.skippedAreas && results.skippedAreas.length > 0 && (
          <Card variant="elevated" className="mb-8 border-muted/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-2">Areas Not Assessed</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {results.skippedAreas.map((area, i) => <li key={i}>• {area}</li>)}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaks section */}
        {results.leaks.length > 0 && (
          <Card variant="elevated" className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Performance Leaks Identified
              </CardTitle>
              <CardDescription>Areas requiring focused attention for optimal performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.leaks.map((leak) => (
                <div key={leak.id} className={`p-4 rounded-lg border ${
                  leak.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'
                }`}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={leak.severity === 'critical' ? 'leak' : 'warning'}>{leak.severity.toUpperCase()}</Badge>
                      <h4 className="font-semibold">{leak.title}</h4>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">{leak.metric}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{leak.description}</p>
                  <div className="p-3 rounded bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">RECOMMENDATION</p>
                    <p className="text-sm">{leak.recommendation}</p>
                  </div>
                  {leak.resourceLinks && leak.resourceLinks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">RESOURCES</p>
                      <div className="flex flex-wrap gap-2">
                        {leak.resourceLinks.map((link, index) => (
                          <a key={index} href={link.url} className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                            <ExternalLink className="w-3 h-3" />{link.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recommended Resources */}
        {recommendedResources.length > 0 && (
          <Card variant="elevated" className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Targeted Resources
              </CardTitle>
              <CardDescription>Content mapped to your specific performance leaks</CardDescription>
            </CardHeader>
            <CardContent>
              <RecommendedResources resources={recommendedResources} />
            </CardContent>
          </Card>
        )}

        {/* No leaks */}
        {results.leaks.length === 0 && (
          <Card variant="elevated" className="mb-8">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Major Leaks Detected</h3>
              <p className="text-muted-foreground">Your structural integrity is solid. Consider advancing to the Performance track for elite-level optimization.</p>
            </CardContent>
          </Card>
        )}

        {/* CTAs */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card variant="interactive" className="p-6">
            <h3 className="font-semibold mb-2">Access The Vault</h3>
            <p className="text-sm text-muted-foreground mb-4">Get full access to movement blueprints and training resources</p>
            <Link to="/auth">
              <Button variant="hero" className="w-full">
                <Lock className="w-4 h-4 mr-2" />Join The Vault - $49/mo
              </Button>
            </Link>
          </Card>
          <Card variant="interactive" className="p-6">
            <h3 className="font-semibold mb-2">Retake Assessment</h3>
            <p className="text-sm text-muted-foreground mb-4">Made an error? Start over with fresh data</p>
            <Button variant="outline" className="w-full" onClick={handleStartOver}>
              <RotateCcw className="w-4 h-4 mr-2" />Start Over
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
