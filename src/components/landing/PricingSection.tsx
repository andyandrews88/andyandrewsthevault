import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export function PricingSection() {
  const features = [
    "Full Resource Library Access",
    "Movement Blueprint Database",
    "Community Hub Access",
    "Foundation Track Materials",
    "Performance Track Materials",
    "Monthly Live Q&A Sessions",
    "Priority Support",
  ];

  return (
    <section className="py-24 relative">
      {/* Background effect */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(192 91% 54% / 0.05) 0%, transparent 50%)'
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <Badge variant="data" className="mb-4">VAULT ACCESS</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Unlock <span className="text-gradient-primary">The Vault</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Gain access to the complete performance architecture system
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card variant="data" className="relative overflow-hidden">
            {/* Top glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            
            <CardHeader className="text-center pb-0">
              <Badge variant="elite" className="w-fit mx-auto mb-4">RECOMMENDED</Badge>
              <CardTitle className="text-2xl">Vault Membership</CardTitle>
              <CardDescription>Full access to all resources and community</CardDescription>
            </CardHeader>

            <CardContent className="text-center py-8">
              <div className="mb-8">
                <span className="text-5xl font-bold font-mono text-gradient-primary">$49</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3 text-left">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Link to="/auth" className="w-full">
                <Button variant="hero" size="lg" className="w-full">
                  <Lock className="w-4 h-4 mr-2" />
                  Join The Vault
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center">
                Cancel anytime. No long-term commitment required.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
