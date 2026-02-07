import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Flame, 
  Beef, 
  Wheat, 
  Droplets,
  Activity,
  Target,
  Zap,
  RefreshCw,
  ChevronRight,
  Info,
  Lightbulb,
  UtensilsCrossed,
} from 'lucide-react';
import { useNutritionStore } from '@/stores/nutritionStore';
import { MacroChart } from './MacroChart';
import { MealPlanGenerator } from './MealPlanGenerator';
import { FoodDatabase } from './FoodDatabase';
import { MealBuilder } from './MealBuilder';

export function NutritionResults({ onRecalculate }: { onRecalculate: () => void }) {
  const { results, biometrics, goals } = useNutritionStore();

  if (!results) return null;

  const { macros, metrics, bmrComparison, mealBreakdown, recommendations } = results;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="elite" className="mb-2">YOUR FUEL TARGETS</Badge>
          <h2 className="text-2xl font-bold">Daily Nutrition Blueprint</h2>
          <p className="text-muted-foreground">
            Calculated for {goals.primaryGoal?.replace('_', ' ')} at {goals.rateOfChange} rate
          </p>
        </div>
        <Button variant="outline" onClick={onRecalculate} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Recalculate
        </Button>
      </div>

      {/* Primary Macro Display */}
      <Card variant="data" className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2">
            {/* Left: Numbers */}
            <div className="p-6 space-y-6">
              {/* Calories */}
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-1">Target Calories</p>
                <p className="text-5xl font-bold font-mono text-primary">
                  {metrics.targetCalories.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">kcal/day</p>
              </div>

              {/* Macros Grid */}
              <div className="grid grid-cols-3 gap-4">
                {/* Protein */}
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <Beef className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold font-mono">{macros.protein}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <Badge variant="outline" className="mt-1 text-xs">{macros.proteinPercent}%</Badge>
                </div>

                {/* Carbs */}
                <div className="text-center p-3 rounded-lg bg-success/10">
                  <Wheat className="w-5 h-5 mx-auto mb-1 text-success" />
                  <p className="text-2xl font-bold font-mono">{macros.carbs}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                  <Badge variant="outline" className="mt-1 text-xs">{macros.carbPercent}%</Badge>
                </div>

                {/* Fats */}
                <div className="text-center p-3 rounded-lg bg-accent/10">
                  <Droplets className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <p className="text-2xl font-bold font-mono">{macros.fats}g</p>
                  <p className="text-xs text-muted-foreground">Fats</p>
                  <Badge variant="outline" className="mt-1 text-xs">{macros.fatPercent}%</Badge>
                </div>
              </div>
            </div>

            {/* Right: Chart */}
            <div className="p-6 flex items-center justify-center bg-muted/20">
              <MacroChart macros={macros} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Additional Info */}
      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="builder" className="gap-1">
            <UtensilsCrossed className="w-4 h-4" />
            <span className="hidden sm:inline">Build Meal</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-1">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="meals" className="gap-1">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Plans</span>
          </TabsTrigger>
          <TabsTrigger value="foods" className="gap-1">
            <Beef className="w-4 h-4" />
            <span className="hidden sm:inline">Foods</span>
          </TabsTrigger>
          <TabsTrigger value="tips" className="gap-1">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Tips</span>
          </TabsTrigger>
        </TabsList>

        {/* Meal Builder Tab */}
        <TabsContent value="builder">
          <MealBuilder />
        </TabsContent>

        {/* Advanced Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              icon={Flame}
              label="BMR"
              value={`${metrics.bmr.toLocaleString()} kcal`}
              description="Basal Metabolic Rate"
            />
            <MetricCard
              icon={Zap}
              label="TDEE"
              value={`${metrics.tdee.toLocaleString()} kcal`}
              description="Total Daily Energy Expenditure"
            />
            <MetricCard
              icon={Target}
              label="Daily Target"
              value={`${metrics.targetCalories.toLocaleString()} kcal`}
              description={`${metrics.calorieDeficitOrSurplus >= 0 ? '+' : ''}${metrics.calorieDeficitOrSurplus} from TDEE`}
            />
            <MetricCard
              icon={Beef}
              label="Protein/lb"
              value={`${metrics.proteinPerLb.toFixed(2)}g`}
              description="Grams per pound bodyweight"
            />
            <MetricCard
              icon={Droplets}
              label="Water Intake"
              value={`${Math.round(metrics.waterIntakeOz / 8)} cups`}
              description={`${metrics.waterIntakeOz} oz daily`}
            />
            <MetricCard
              icon={Wheat}
              label="Fiber Target"
              value={`${metrics.fiberTarget}g`}
              description="Minimum daily fiber"
            />
          </div>

          {/* BMR Comparison */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4" />
                BMR Formula Comparison
              </CardTitle>
              <CardDescription>
                Different formulas for calculating your base metabolism
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bmrComparison.map((formula) => (
                  <div
                    key={formula.formula}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      formula.isRecommended ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formula.label}</span>
                      {formula.isRecommended && (
                        <Badge variant="default" className="text-xs">Recommended</Badge>
                      )}
                    </div>
                    <span className="font-mono">{formula.value.toLocaleString()} kcal</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Projection */}
          {metrics.weeklyWeightChange !== 0 && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Projected Weekly Change</p>
                    <p className="text-lg font-bold">
                      {metrics.weeklyWeightChange > 0 ? '+' : ''}{metrics.weeklyWeightChange.toFixed(2)} lbs/week
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Meal Breakdown Tab */}
        <TabsContent value="meals">
          <MealPlanGenerator
            targetCalories={metrics.targetCalories}
            targetMacros={macros}
            mealBreakdown={mealBreakdown}
          />
        </TabsContent>

        {/* Food Database Tab */}
        <TabsContent value="foods">
          <FoodDatabase targetMacros={macros} />
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="tips">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-accent" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>
                Based on your goals and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-primary font-mono text-sm">{String(index + 1).padStart(2, '0')}</span>
                    <p className="text-sm text-muted-foreground">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
}

function MetricCard({ icon: Icon, label, value, description }: MetricCardProps) {
  return (
    <Card variant="interactive">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
