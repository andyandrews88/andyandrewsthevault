import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { NutritionCalculator } from '@/components/nutrition/NutritionCalculator';
import { NutritionResults } from '@/components/nutrition/NutritionResults';
import { useNutritionStore } from '@/stores/nutritionStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calculator, RotateCcw } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function Nutrition() {
  const { results, reset } = useNutritionStore();
  const [showResults, setShowResults] = useState(!!results);

  const handleComplete = () => {
    setShowResults(true);
  };

  const handleRecalculate = () => {
    reset();
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <img 
              src={logo} 
              alt="Andy Andrews" 
              className="h-16 md:h-24 w-auto invert brightness-100 mx-auto mb-4 drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
            />
            <Badge variant="elite" className="mb-4">THE FUEL SYSTEM</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Engineering-Grade Nutrition Calculator
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Calculate your precise calorie and macronutrient targets using multiple scientific formulas. 
              Get personalized meal plans, food recommendations, and actionable nutrition insights.
            </p>
          </div>

          {/* Calculator or Results */}
          {showResults && results ? (
            <NutritionResults onRecalculate={handleRecalculate} />
          ) : (
            <NutritionCalculator onComplete={handleComplete} />
          )}

          {/* Footer Info */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>
              Calculations based on Mifflin-St Jeor, Harris-Benedict, Katch-McArdle, and Cunningham formulas.
            </p>
            <p className="mt-1">
              Macro recommendations derived from current sports nutrition research.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
