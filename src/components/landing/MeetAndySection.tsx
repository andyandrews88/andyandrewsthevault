import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Zap, Shield } from "lucide-react";

export function MeetAndySection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Bio content */}
          <div className="space-y-6">
            <Badge variant="elite" className="mb-2">
              ABOUT THE ARCHITECT
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-bold">
              Meet <span className="text-gradient-gold">Andy Andrews</span>
            </h2>
            
            <blockquote className="text-lg text-muted-foreground border-l-2 border-primary pl-6 italic">
              "I bridge the gap between science and real-world application, helping people achieve a vibrant, fulfilling life through a clear roadmap."
            </blockquote>

            <p className="text-muted-foreground leading-relaxed">
              With over a decade of competitive experience at the highest levels of functional fitness, 
              Andy has developed a systematic approach to identifying and eliminating performance limiters. 
              His methodology treats the human body as a precision-engineered system—one that can be 
              optimized through data-driven analysis and targeted intervention.
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              <Badge variant="data">6x National Champion</Badge>
              <Badge variant="data">CrossFit Games Athlete</Badge>
              <Badge variant="data">CSCS Certified</Badge>
            </div>
          </div>

          {/* Right: Credentials grid */}
          <div className="grid gap-4">
            <Card variant="interactive" className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Precision Diagnostics</h3>
                  <p className="text-sm text-muted-foreground">
                    Proprietary assessment protocols that identify exact points of performance degradation.
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="interactive" className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Evidence-Based Protocols</h3>
                  <p className="text-sm text-muted-foreground">
                    Every recommendation backed by peer-reviewed research and validated through real-world testing.
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="interactive" className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Structured Progression</h3>
                  <p className="text-sm text-muted-foreground">
                    Clear pathways from foundation to elite performance, with measurable checkpoints.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
