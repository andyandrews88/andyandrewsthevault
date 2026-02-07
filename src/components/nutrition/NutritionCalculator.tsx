import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronRight, 
  ChevronLeft, 
  Calculator, 
  Activity, 
  Target, 
  Utensils,
  Info
} from 'lucide-react';
import { useNutritionStore } from '@/stores/nutritionStore';
import { 
  Sex, 
  ActivityLevel, 
  TrainingStyle, 
  JobActivity, 
  Goal, 
  RateOfChange, 
  DietType, 
  ProteinPriority,
  FoodRestriction,
  UnitSystem,
} from '@/types/nutrition';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const STEPS = [
  { id: 0, title: 'Biometrics', icon: Calculator, description: 'Your body measurements' },
  { id: 1, title: 'Activity', icon: Activity, description: 'Training and lifestyle' },
  { id: 2, title: 'Goals', icon: Target, description: 'What you want to achieve' },
  { id: 3, title: 'Nutrition', icon: Utensils, description: 'Dietary preferences' },
];

export function NutritionCalculator({ onComplete }: { onComplete: () => void }) {
  const {
    currentStep,
    biometrics,
    activity,
    goals,
    dietary,
    setStep,
    updateBiometrics,
    updateActivity,
    updateGoals,
    updateDietary,
    calculateResults,
    prefillFromAudit,
  } = useNutritionStore();

  const [hasTriedPrefill, setHasTriedPrefill] = useState(false);

  // Try to prefill from audit on first render
  if (!hasTriedPrefill) {
    prefillFromAudit();
    setHasTriedPrefill(true);
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setStep(currentStep + 1);
    } else {
      calculateResults();
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return biometrics.weight && biometrics.height && biometrics.age && biometrics.sex;
      case 1:
        return activity.activityLevel && activity.trainingDaysPerWeek && activity.trainingStyle && activity.jobActivity;
      case 2:
        return goals.primaryGoal && goals.rateOfChange;
      case 3:
        return dietary.dietType && dietary.proteinPriority && dietary.mealFrequency;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Step {currentStep + 1} of {STEPS.length}</span>
          <span className="font-mono text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Step Indicators */}
        <div className="flex justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? 'text-primary' : isComplete ? 'text-muted-foreground' : 'text-muted-foreground/50'
                }`}
              >
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary/10' : isComplete ? 'bg-muted' : 'bg-muted/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs hidden sm:block">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const Icon = STEPS[currentStep].icon;
              return <Icon className="w-5 h-5 text-primary" />;
            })()}
            {STEPS[currentStep].title}
          </CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 0 && (
            <BiometricsStep
              data={biometrics}
              onChange={updateBiometrics}
            />
          )}
          {currentStep === 1 && (
            <ActivityStep
              data={activity}
              onChange={updateActivity}
            />
          )}
          {currentStep === 2 && (
            <GoalsStep
              data={goals}
              onChange={updateGoals}
            />
          )}
          {currentStep === 3 && (
            <DietaryStep
              data={dietary}
              onChange={updateDietary}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="gap-2"
        >
          {currentStep === STEPS.length - 1 ? 'Calculate' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============= Step Components =============

interface BiometricsStepProps {
  data: Partial<{
    weight: number;
    height: number;
    age: number;
    sex: Sex;
    bodyFatPercent?: number;
    unitSystem: UnitSystem;
  }>;
  onChange: (data: Partial<BiometricsStepProps['data']>) => void;
}

function BiometricsStep({ data, onChange }: BiometricsStepProps) {
  const isMetric = data.unitSystem === 'metric';

  return (
    <div className="space-y-6">
      {/* Unit Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <Label htmlFor="unit-toggle" className="text-sm">Use metric units (kg/cm)</Label>
        <Switch
          id="unit-toggle"
          checked={isMetric}
          onCheckedChange={(checked) => onChange({ unitSystem: checked ? 'metric' : 'imperial' })}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="weight">Weight ({isMetric ? 'kg' : 'lbs'})</Label>
          <Input
            id="weight"
            type="number"
            placeholder={isMetric ? '80' : '175'}
            value={data.weight || ''}
            onChange={(e) => onChange({ weight: parseFloat(e.target.value) || undefined })}
            className="font-mono"
          />
        </div>

        {/* Height */}
        <div className="space-y-2">
          <Label htmlFor="height">Height ({isMetric ? 'cm' : 'inches'})</Label>
          <Input
            id="height"
            type="number"
            placeholder={isMetric ? '180' : '70'}
            value={data.height || ''}
            onChange={(e) => onChange({ height: parseFloat(e.target.value) || undefined })}
            className="font-mono"
          />
          {!isMetric && data.height && (
            <p className="text-xs text-muted-foreground">
              {Math.floor(data.height / 12)}'{data.height % 12}"
            </p>
          )}
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="30"
            value={data.age || ''}
            onChange={(e) => onChange({ age: parseInt(e.target.value) || undefined })}
            className="font-mono"
          />
        </div>

        {/* Body Fat % (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="bodyfat" className="flex items-center gap-2">
            Body Fat % 
            <Badge variant="outline" className="text-xs">Optional</Badge>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[200px] text-xs">
                  Enables Katch-McArdle formula for more accurate BMR calculation
                </p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="bodyfat"
            type="number"
            placeholder="15"
            value={data.bodyFatPercent || ''}
            onChange={(e) => onChange({ bodyFatPercent: parseFloat(e.target.value) || undefined })}
            className="font-mono"
          />
        </div>
      </div>

      {/* Sex Selection */}
      <div className="space-y-3">
        <Label>Biological Sex</Label>
        <RadioGroup
          value={data.sex || ''}
          onValueChange={(value) => onChange({ sex: value as Sex })}
          className="grid grid-cols-2 gap-4"
        >
          <Label
            htmlFor="male"
            className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-colors ${
              data.sex === 'male' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="male" id="male" className="sr-only" />
            <span>Male</span>
          </Label>
          <Label
            htmlFor="female"
            className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-colors ${
              data.sex === 'female' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="female" id="female" className="sr-only" />
            <span>Female</span>
          </Label>
        </RadioGroup>
      </div>
    </div>
  );
}

interface ActivityStepProps {
  data: Partial<{
    activityLevel: ActivityLevel;
    trainingDaysPerWeek: number;
    trainingStyle: TrainingStyle;
    jobActivity: JobActivity;
  }>;
  onChange: (data: Partial<ActivityStepProps['data']>) => void;
}

function ActivityStep({ data, onChange }: ActivityStepProps) {
  const activityLevels: { value: ActivityLevel; label: string; multiplier: string }[] = [
    { value: 'sedentary', label: 'Sedentary', multiplier: '1.2x' },
    { value: 'lightly_active', label: 'Lightly Active (1-3 days/week)', multiplier: '1.375x' },
    { value: 'moderately_active', label: 'Moderately Active (3-5 days/week)', multiplier: '1.55x' },
    { value: 'very_active', label: 'Very Active (6-7 days/week)', multiplier: '1.725x' },
    { value: 'extremely_active', label: 'Extremely Active (2x/day)', multiplier: '1.9x' },
  ];

  const trainingStyles: { value: TrainingStyle; label: string }[] = [
    { value: 'strength', label: 'Strength Training' },
    { value: 'cardio', label: 'Cardio/Endurance' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'crossfit', label: 'CrossFit' },
  ];

  const jobActivities: { value: JobActivity; label: string }[] = [
    { value: 'seated', label: 'Seated (Desk Job)' },
    { value: 'standing', label: 'Standing (Retail, Service)' },
    { value: 'physical_labor', label: 'Physical Labor (Construction, Warehouse)' },
  ];

  return (
    <div className="space-y-6">
      {/* Activity Level */}
      <div className="space-y-3">
        <Label>Overall Activity Level</Label>
        <RadioGroup
          value={data.activityLevel || ''}
          onValueChange={(value) => onChange({ activityLevel: value as ActivityLevel })}
          className="space-y-2"
        >
          {activityLevels.map((level) => (
            <Label
              key={level.value}
              htmlFor={level.value}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                data.activityLevel === level.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={level.value} id={level.value} />
                <span>{level.label}</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">{level.multiplier}</Badge>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Training Days */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <Label>Training Days per Week</Label>
          <span className="font-mono text-primary">{data.trainingDaysPerWeek || 0} days</span>
        </div>
        <Slider
          value={[data.trainingDaysPerWeek || 3]}
          onValueChange={(value) => onChange({ trainingDaysPerWeek: value[0] })}
          min={0}
          max={7}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>7</span>
        </div>
      </div>

      {/* Training Style */}
      <div className="space-y-3">
        <Label>Training Style</Label>
        <RadioGroup
          value={data.trainingStyle || ''}
          onValueChange={(value) => onChange({ trainingStyle: value as TrainingStyle })}
          className="grid grid-cols-2 gap-3"
        >
          {trainingStyles.map((style) => (
            <Label
              key={style.value}
              htmlFor={style.value}
              className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                data.trainingStyle === style.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value={style.value} id={style.value} className="sr-only" />
              <span className="text-sm">{style.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Job Activity */}
      <div className="space-y-3">
        <Label>Job Activity Level</Label>
        <RadioGroup
          value={data.jobActivity || ''}
          onValueChange={(value) => onChange({ jobActivity: value as JobActivity })}
          className="space-y-2"
        >
          {jobActivities.map((job) => (
            <Label
              key={job.value}
              htmlFor={job.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                data.jobActivity === job.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value={job.value} id={job.value} />
              <span>{job.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

interface GoalsStepProps {
  data: Partial<{
    primaryGoal: Goal;
    rateOfChange: RateOfChange;
    timelineWeeks?: number;
  }>;
  onChange: (data: Partial<GoalsStepProps['data']>) => void;
}

function GoalsStep({ data, onChange }: GoalsStepProps) {
  const goals: { value: Goal; label: string; description: string }[] = [
    { value: 'fat_loss', label: 'Fat Loss', description: 'Reduce body fat while preserving muscle' },
    { value: 'maintenance', label: 'Maintenance', description: 'Maintain current weight and composition' },
    { value: 'muscle_gain', label: 'Muscle Gain', description: 'Build lean muscle mass' },
    { value: 'recomposition', label: 'Recomposition', description: 'Lose fat and build muscle simultaneously' },
    { value: 'performance', label: 'Performance', description: 'Optimize for athletic output' },
  ];

  const rates: { value: RateOfChange; label: string; description: string }[] = [
    { value: 'conservative', label: 'Conservative', description: '±250 cal/day (~0.5 lb/week)' },
    { value: 'moderate', label: 'Moderate', description: '±500 cal/day (~1 lb/week)' },
    { value: 'aggressive', label: 'Aggressive', description: '±750 cal/day (~1.5 lb/week)' },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Goal */}
      <div className="space-y-3">
        <Label>Primary Goal</Label>
        <RadioGroup
          value={data.primaryGoal || ''}
          onValueChange={(value) => onChange({ primaryGoal: value as Goal })}
          className="space-y-2"
        >
          {goals.map((goal) => (
            <Label
              key={goal.value}
              htmlFor={goal.value}
              className={`flex flex-col gap-1 p-4 rounded-lg border cursor-pointer transition-colors ${
                data.primaryGoal === goal.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={goal.value} id={goal.value} />
                <span className="font-medium">{goal.label}</span>
              </div>
              <span className="text-sm text-muted-foreground ml-6">{goal.description}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Rate of Change */}
      {data.primaryGoal && data.primaryGoal !== 'maintenance' && (
        <div className="space-y-3">
          <Label>Rate of Change</Label>
          <RadioGroup
            value={data.rateOfChange || ''}
            onValueChange={(value) => onChange({ rateOfChange: value as RateOfChange })}
            className="space-y-2"
          >
            {rates.map((rate) => (
              <Label
                key={rate.value}
                htmlFor={rate.value}
                className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                  data.rateOfChange === rate.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={rate.value} id={rate.value} />
                  <span className="font-medium">{rate.label}</span>
                </div>
                <span className="text-xs text-muted-foreground ml-6 font-mono">{rate.description}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>
      )}

      {data.primaryGoal === 'maintenance' && !data.rateOfChange && (
        (() => { onChange({ rateOfChange: 'moderate' }); return null; })()
      )}

      {data.primaryGoal === 'maintenance' && (
        <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p>Maintenance mode keeps calories at TDEE with no deficit or surplus.</p>
        </div>
      )}
    </div>
  );
}

interface DietaryStepProps {
  data: Partial<{
    dietType: DietType;
    proteinPriority: ProteinPriority;
    restrictions: FoodRestriction[];
    mealFrequency: number;
  }>;
  onChange: (data: Partial<DietaryStepProps['data']>) => void;
}

function DietaryStep({ data, onChange }: DietaryStepProps) {
  const dietTypes: { value: DietType; label: string; split: string }[] = [
    { value: 'standard', label: 'Standard', split: '30/40/30' },
    { value: 'high_carb', label: 'High Carb', split: '25/50/25' },
    { value: 'low_carb', label: 'Low Carb', split: '35/25/40' },
    { value: 'keto', label: 'Keto', split: '30/5/65' },
    { value: 'zone', label: 'Zone', split: '30/40/30' },
  ];

  const proteinLevels: { value: ProteinPriority; label: string; range: string }[] = [
    { value: 'minimum', label: 'Minimum', range: '0.7-1.0 g/lb' },
    { value: 'moderate', label: 'Moderate', range: '0.8-1.2 g/lb' },
    { value: 'high', label: 'High', range: '1.0-1.4 g/lb' },
    { value: 'maximum', label: 'Maximum', range: '1.2-1.6 g/lb' },
  ];

  const restrictions: { value: FoodRestriction; label: string }[] = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'dairy_free', label: 'Dairy-Free' },
    { value: 'gluten_free', label: 'Gluten-Free' },
  ];

  const toggleRestriction = (restriction: FoodRestriction) => {
    const current = data.restrictions || [];
    const updated = current.includes(restriction)
      ? current.filter((r) => r !== restriction)
      : [...current, restriction];
    onChange({ restrictions: updated });
  };

  return (
    <div className="space-y-6">
      {/* Diet Type */}
      <div className="space-y-3">
        <Label>Diet Type</Label>
        <RadioGroup
          value={data.dietType || ''}
          onValueChange={(value) => onChange({ dietType: value as DietType })}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {dietTypes.map((diet) => (
            <Label
              key={diet.value}
              htmlFor={diet.value}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                data.dietType === diet.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value={diet.value} id={diet.value} className="sr-only" />
              <span className="font-medium text-sm">{diet.label}</span>
              <span className="text-xs text-muted-foreground font-mono">{diet.split}</span>
            </Label>
          ))}
        </RadioGroup>
        <p className="text-xs text-muted-foreground">P/C/F ratio (Protein/Carbs/Fats)</p>
      </div>

      {/* Protein Priority */}
      <div className="space-y-3">
        <Label>Protein Priority</Label>
        <RadioGroup
          value={data.proteinPriority || ''}
          onValueChange={(value) => onChange({ proteinPriority: value as ProteinPriority })}
          className="grid grid-cols-2 gap-3"
        >
          {proteinLevels.map((level) => (
            <Label
              key={level.value}
              htmlFor={`protein-${level.value}`}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                data.proteinPriority === level.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value={level.value} id={`protein-${level.value}`} className="sr-only" />
              <span className="font-medium text-sm">{level.label}</span>
              <span className="text-xs text-muted-foreground font-mono">{level.range}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Meal Frequency */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <Label>Meals per Day</Label>
          <span className="font-mono text-primary">{data.mealFrequency || 4} meals</span>
        </div>
        <Slider
          value={[data.mealFrequency || 4]}
          onValueChange={(value) => onChange({ mealFrequency: value[0] })}
          min={2}
          max={6}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>2 meals</span>
          <span>6 meals</span>
        </div>
      </div>

      {/* Food Restrictions */}
      <div className="space-y-3">
        <Label>Dietary Restrictions (Optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          {restrictions.map((restriction) => (
            <Label
              key={restriction.value}
              htmlFor={restriction.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                (data.restrictions || []).includes(restriction.value)
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Checkbox
                id={restriction.value}
                checked={(data.restrictions || []).includes(restriction.value)}
                onCheckedChange={() => toggleRestriction(restriction.value)}
              />
              <span className="text-sm">{restriction.label}</span>
            </Label>
          ))}
        </div>
      </div>
    </div>
  );
}
