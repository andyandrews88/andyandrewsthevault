import { useAuditStore } from "@/stores/auditStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { AlertTriangle, CheckCircle, ArrowRight, RotateCcw, Lock, Info, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const tierBadges = {
  foundation: 'outline' as const,
  intermediate: 'secondary' as const,
  performance: 'data' as const,
  elite: 'elite' as const,
};

export function ResultsPage() {
  const navigate = useNavigate();
  const { results, reset } = useAuditStore();

  useEffect(() => {
    if (!results) {
      navigate('/audit');
    }
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

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="data" className="mb-4">ANALYSIS COMPLETE</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Structural Integrity Report
          </h1>
          <p className="text-muted-foreground">
            Your performance architecture has been analyzed
          </p>
        </div>

        {/* Foundation Recommendation Advisory */}
        {results.foundationRecommended && (
          <Card variant="elevated" className="mb-8 border-accent/30 bg-accent/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-accent mb-2">Foundation Track Recommended</h3>
                  <p className="text-sm text-muted-foreground">
                    {results.foundationReason}
                  </p>
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
                <p className="text-6xl font-bold font-mono text-gradient-primary data-glow">
                  {results.overallScore}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">CLASSIFICATION</p>
                <Badge variant={tierBadges[results.tier]} className="text-lg px-4 py-1">
                  {results.tier.toUpperCase()} TIER
                </Badge>
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm text-muted-foreground mb-2">LEAKS DETECTED</p>
                <p className={`text-4xl font-bold font-mono ${
                  results.leaks.length === 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {results.leaks.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar chart */}
        <Card variant="elevated" className="mb-8">
          <CardHeader>
            <CardTitle>Performance Radar</CardTitle>
            <CardDescription>
              Your metrics compared to Foundation and Performance benchmarks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid stroke="hsl(215 14% 20%)" />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fill: 'hsl(215 14% 50%)', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: 'hsl(215 14% 40%)' }}
                    tickCount={5}
                  />
                  <Radar
                    name="Foundation Baseline"
                    dataKey="foundation"
                    stroke="hsl(215 14% 40%)"
                    fill="hsl(215 14% 40%)"
                    fillOpacity={0.1}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="Performance Target"
                    dataKey="performance"
                    stroke="hsl(45 93% 58%)"
                    fill="hsl(45 93% 58%)"
                    fillOpacity={0.1}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="Your Results"
                    dataKey="user"
                    stroke="hsl(192 91% 54%)"
                    fill="hsl(192 91% 54%)"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span style={{ color: 'hsl(210 20% 95%)' }}>{value}</span>}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leaks section */}
        {results.leaks.length > 0 && (
          <Card variant="elevated" className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Performance Leaks Identified
              </CardTitle>
              <CardDescription>
                Areas requiring focused attention for optimal performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.leaks.map((leak) => (
                <div
                  key={leak.id}
                  className={`p-4 rounded-lg border ${
                    leak.severity === 'critical'
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-warning/30 bg-warning/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={leak.severity === 'critical' ? 'leak' : 'warning'}>
                        {leak.severity.toUpperCase()}
                      </Badge>
                      <h4 className="font-semibold">{leak.title}</h4>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">
                      {leak.metric}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {leak.description}
                  </p>
                  <div className="p-3 rounded bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">RECOMMENDATION</p>
                    <p className="text-sm">{leak.recommendation}</p>
                  </div>
                  
                  {/* Resource Links */}
                  {leak.resourceLinks && leak.resourceLinks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">RESOURCES</p>
                      <div className="flex flex-wrap gap-2">
                        {leak.resourceLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {link.title}
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

        {/* No leaks message */}
        {results.leaks.length === 0 && (
          <Card variant="elevated" className="mb-8">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Major Leaks Detected</h3>
              <p className="text-muted-foreground">
                Your structural integrity is solid. Consider advancing to the Performance track
                for elite-level optimization.
              </p>
            </CardContent>
          </Card>
        )}

        {/* CTAs */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card variant="interactive" className="p-6">
            <h3 className="font-semibold mb-2">Access The Vault</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get full access to movement blueprints and training resources
            </p>
            <Link to="/auth">
              <Button variant="hero" className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Join The Vault - $49/mo
              </Button>
            </Link>
          </Card>

          <Card variant="interactive" className="p-6">
            <h3 className="font-semibold mb-2">Retake Assessment</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Made an error? Start over with fresh data
            </p>
            <Button variant="outline" className="w-full" onClick={handleStartOver}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
