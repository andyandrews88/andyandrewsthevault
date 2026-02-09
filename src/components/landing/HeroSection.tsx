import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
      
      {/* Radial gradient overlay */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: 'radial-gradient(ellipse at center top, hsl(192 91% 54% / 0.08) 0%, transparent 60%)'
        }}
      />

      {/* Scan line effect */}
      <div className="absolute inset-0 scan-line pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="animate-fade-in">
          {/* Prominent Logo */}
          <div className="mb-8 flex justify-center px-4">
            <img 
              src={logo} 
              alt="Andy Andrews" 
              className="h-auto w-full max-w-xs md:max-w-sm lg:max-w-md invert"
            />
          </div>

          {/* Status badge */}
          <Badge variant="data" className="mb-6 animate-pulse-glow">
            <Activity className="w-3 h-3 mr-1" />
            PERFORMANCE ARCHITECT
          </Badge>

          {/* Main headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-gradient-primary data-glow">The Vault.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-foreground/80 font-medium mb-2">
            Performance Architecture
          </p>

          {/* Sub-headline */}
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-10">
            6-Time Fittest Man in Sri Lanka & CrossFit Games Athlete
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/audit">
              <Button variant="hero" size="xl" className="group">
                Begin Structural Audit
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/vault">
              <Button variant="outline" size="xl">
                Access The Vault
              </Button>
            </Link>
          </div>
        </div>

        {/* Data visualization hint */}
        <div className="mt-20 flex flex-col sm:flex-row justify-center gap-6 sm:gap-12 text-muted-foreground">
          <div className="text-center">
            <p className="font-mono text-2xl text-primary data-glow">1,247+</p>
            <p className="text-xs uppercase tracking-wider mt-1">Athletes Analyzed</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl text-primary data-glow">94%</p>
            <p className="text-xs uppercase tracking-wider mt-1">Leak Detection Rate</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl text-primary data-glow">6x</p>
            <p className="text-xs uppercase tracking-wider mt-1">National Champion</p>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
