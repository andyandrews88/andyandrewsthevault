import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuditStore, AuditData } from "@/stores/auditStore";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, User, Dumbbell, Timer, CheckCircle, Heart, Calculator, Apple, Activity, Info } from "lucide-react";

const steps = [
  { id: 'biometrics', title: 'Biometrics', icon: User, description: 'Basic measurements' },
  { id: 'strength', title: 'The Big 4', icon: Dumbbell, description: 'Strength ratios (optional)' },
  { id: 'engine', title: 'Engine Check', icon: Timer, description: 'Aerobic capacity (optional)' },
  { id: 'movement', title: 'Movement Screen', icon: Activity, description: 'Movement quality (optional)' },
  { id: 'lifestyle', title: 'Lifestyle', icon: Heart, description: 'Recovery & habits' },
  { id: 'review', title: 'Review', icon: CheckCircle, description: 'Confirm data' },
];

const sleepLabels: Record<string, string> = {
  '<6': '< 6 hours', '6-7': '6-7 hours', '7-8': '7-8 hours', '8+': '8+ hours',
};

const experienceLabels: Record<string, string> = {
  '<1': '< 1 year', '1-3': '1-3 years', '3-5': '3-5 years', '5+': '5+ years',
};

const liftSubstitutions: Record<string, string[]> = {
  backSquat: ['Back Squat', 'Safety Bar Squat', 'Box Squat'],
  frontSquat: ['Front Squat', 'Goblet Squat', 'Zercher Squat'],
  strictPress: ['Strict Press', 'Push Press', 'Seated DB Press'],
  deadlift: ['Deadlift', 'Trap Bar Deadlift', 'Sumo Deadlift'],
};

const cardioTests = [
  { value: 'mile', label: '1-Mile Run' },
  { value: '2k-row', label: '2K Row' },
  { value: '500m-row', label: '500m Row' },
  { value: '2k-bike', label: '2K Bike Erg' },
  { value: 'none', label: "I don't have a cardio benchmark" },
];

const movementTooltips: Record<string, string> = {
  broadJump: "Stand, jump as far as you can. Measure distance by counting your heel-to-toe steps or in feet.",
  deadHang: "Hang from a bar with a full grip until you drop. Time in seconds.",
  toeTouch: "Stand, feet together, legs straight. Reach down and see how far you can go.",
  heelSit: "Kneel down and lay back as far as you can. Can you sit your hips to your heels?",
  deepSquat: "Squat as deep as possible, heels flat, torso upright. Hold for 30 seconds.",
  overheadReach: "Sit with back and butt against a wall. With thumbs up, raise arms overhead keeping wrists and elbows straight until you can get thumbs to the wall. Either you can or you can't.",
  maxPullups: "Full range of motion pull-ups. Dead hang at bottom, chin over bar at top. Count total reps.",
  maxPushups: "Chest to ground, full lockout at top. No resting. Count total reps until failure.",
  lSit: "Hold an L-Sit on parallettes with legs straight and parallel to the ground. Time until failure.",
  pistolSquat: "Barefoot, perform a full pistol squat on each leg. All the way down, all the way up, no assistance.",
};

interface LiftEstimation {
  weight: number;
  reps: number;
}

export function AuditForm() {
  const navigate = useNavigate();
  const { currentStep, data, updateData, setStep, calculateResults } = useAuditStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skipLifts, setSkipLifts] = useState<Record<string, boolean>>({});
  const [estimateMode, setEstimateMode] = useState<Record<string, boolean>>({});
  const [estimations, setEstimations] = useState<Record<string, LiftEstimation>>({});
  const [skipMovement, setSkipMovement] = useState<Record<string, boolean>>({});

  const progress = ((currentStep + 1) / steps.length) * 100;

  const calculateEpley = (weight: number, reps: number) => Math.round(weight * (1 + reps / 30));

  const handleEstimationChange = (lift: string, field: 'weight' | 'reps', value: number) => {
    const updated = { ...estimations, [lift]: { ...estimations[lift], [field]: value } };
    setEstimations(updated);
    const est = updated[lift];
    if (est?.weight > 0 && est?.reps > 0) {
      const estimated1RM = calculateEpley(est.weight, est.reps);
      updateData({
        [lift]: estimated1RM,
        estimatedLifts: { ...(data.estimatedLifts as Record<string, boolean> || {}), [lift]: true }
      });
    }
  };

  const handleSkipLift = (lift: string, skip: boolean) => {
    setSkipLifts(prev => ({ ...prev, [lift]: skip }));
    if (skip) {
      updateData({ [lift]: undefined });
      setEstimateMode(prev => ({ ...prev, [lift]: false }));
    }
  };

  const handleSkipMovement = (key: string, skip: boolean, clearKeys: string[]) => {
    setSkipMovement(prev => ({ ...prev, [key]: skip }));
    if (skip) {
      const updates: Record<string, undefined> = {};
      clearKeys.forEach(k => { updates[k] = undefined; });
      updateData(updates);
    }
  };

  const handleSubstitution = (lift: string, sub: string) => {
    const defaultName = liftSubstitutions[lift][0];
    if (sub === defaultName) {
      const subs = { ...(data.substitutions as Record<string, string> || {}) };
      delete subs[lift];
      updateData({ substitutions: subs });
    } else {
      updateData({ substitutions: { ...(data.substitutions as Record<string, string> || {}), [lift]: sub } });
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 0) {
      if (!data.weight || (data.weight as number) <= 0) newErrors.weight = 'Required';
      if (!data.age || (data.age as number) <= 0) newErrors.age = 'Required';
      if (!data.height || (data.height as number) <= 0) newErrors.height = 'Required';
    } else if (currentStep === 4) {
      if (!data.sleep) newErrors.sleep = 'Required';
      if (!data.protein) newErrors.protein = 'Required';
      if (!data.stress) newErrors.stress = 'Required';
      if (!data.experience) newErrors.experience = 'Required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < steps.length - 1) {
      setStep(currentStep + 1);
    } else {
      calculateResults();
      navigate('/results');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setStep(currentStep - 1);
  };

  const renderNumericInput = (
    name: string,
    label: string,
    placeholder: string,
    unit: string
  ) => (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          id={name}
          type="number"
          placeholder={placeholder}
          value={(data as any)[name] || ''}
          onChange={(e) => updateData({ [name]: parseFloat(e.target.value) || undefined })}
          className={`font-mono pr-12 ${errors[name] ? 'border-destructive' : ''}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>
      </div>
      {errors[name] && <p className="text-xs text-destructive">{errors[name]}</p>}
    </div>
  );

  const renderLiftInput = (liftKey: string, label: string, placeholder: string) => {
    const isSkipped = skipLifts[liftKey];
    const isEstimating = estimateMode[liftKey];
    const subs = liftSubstitutions[liftKey];

    return (
      <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-secondary/20">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Skip</span>
            <Switch checked={isSkipped} onCheckedChange={(v) => handleSkipLift(liftKey, v)} />
          </div>
        </div>

        {!isSkipped && (
          <>
            {subs.length > 1 && (
              <Select
                value={(data.substitutions as Record<string, string>)?.[liftKey] || subs[0]}
                onValueChange={(v) => handleSubstitution(liftKey, v)}
              >
                <SelectTrigger className="font-mono text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {subs.map(s => (
                    <SelectItem key={s} value={s} className="font-mono text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-2">
              <Switch checked={isEstimating} onCheckedChange={(v) => setEstimateMode(prev => ({ ...prev, [liftKey]: v }))} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calculator className="w-3 h-3" /> Estimate my 1RM
              </span>
            </div>

            {isEstimating ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Weight used</Label>
                  <Input
                    type="number" placeholder="225" className="font-mono text-sm h-9"
                    value={estimations[liftKey]?.weight || ''}
                    onChange={(e) => handleEstimationChange(liftKey, 'weight', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Reps completed</Label>
                  <Input
                    type="number" placeholder="5" className="font-mono text-sm h-9"
                    value={estimations[liftKey]?.reps || ''}
                    onChange={(e) => handleEstimationChange(liftKey, 'reps', parseInt(e.target.value) || 0)}
                  />
                </div>
                {estimations[liftKey]?.weight > 0 && estimations[liftKey]?.reps > 0 && (
                  <div className="col-span-2 text-xs text-primary font-mono">
                    Estimated 1RM: {calculateEpley(estimations[liftKey].weight, estimations[liftKey].reps)} lbs
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="number" placeholder={placeholder} className="font-mono pr-12"
                  value={(data as any)[liftKey] || ''}
                  onChange={(e) => {
                    updateData({
                      [liftKey]: parseFloat(e.target.value) || undefined,
                      estimatedLifts: { ...(data.estimatedLifts as Record<string, boolean> || {}), [liftKey]: false }
                    });
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">lbs</span>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderTimeInput = (label: string, timeKey: string) => {
    const timeValue = (data as any)[timeKey] as number | undefined;
    const minutes = timeValue ? Math.floor(timeValue / 60) : '';
    const seconds = timeValue ? timeValue % 60 : '';

    return (
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="number" placeholder="MM" min={0} max={30}
            value={minutes} className="font-mono w-20 text-center"
            onChange={(e) => {
              const m = parseInt(e.target.value) || 0;
              const s = typeof seconds === 'number' ? seconds : 0;
              updateData({ [timeKey]: m * 60 + s });
            }}
          />
          <span className="text-muted-foreground">:</span>
          <Input
            type="number" placeholder="SS" min={0} max={59}
            value={seconds} className="font-mono w-20 text-center"
            onChange={(e) => {
              const m = typeof minutes === 'number' ? minutes : 0;
              const s = parseInt(e.target.value) || 0;
              updateData({ [timeKey]: m * 60 + s });
            }}
          />
        </div>
      </div>
    );
  };

  const formatTimeDisplay = (seconds: number | undefined) => {
    if (!seconds) return '-';
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const renderMovementField = (
    key: string,
    label: string,
    tooltipKey: string,
    clearKeys: string[],
    children: React.ReactNode
  ) => {
    const isSkipped = skipMovement[key];
    return (
      <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-secondary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{label}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{movementTooltips[tooltipKey]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Skip</span>
            <Switch checked={isSkipped} onCheckedChange={(v) => handleSkipMovement(key, v, clearKeys)} />
          </div>
        </div>
        {!isSkipped && children}
      </div>
    );
  };

  const toeLabels = ['Can\'t reach toes', 'Touches toes', 'Palms flat'];

  return (
    <div className="min-h-screen pt-20 pb-8 md:pt-24 md:pb-12">
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        {/* Page Description Header */}
        <div className="text-center mb-8">
          <Badge variant="elite" className="mb-3">STRUCTURAL AUDIT</Badge>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Performance Assessment</h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Answer questions about your biometrics, strength, endurance, and lifestyle to identify 
            performance gaps and get personalized recommendations.
          </p>
        </div>

        {/* Progress header */}
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between items-center mb-3">
            <Badge variant="data" className="text-xs">STEP {currentStep + 1}/{steps.length}</Badge>
            <span className="font-mono text-sm text-primary">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mb-6 md:mb-8 gap-1">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div key={step.id} className={`flex flex-col items-center gap-1.5 flex-1 ${
                isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground/50'
              }`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border transition-colors ${
                  isActive ? 'border-primary bg-primary/10' :
                  isCompleted ? 'border-success bg-success/10' : 'border-border/50'
                }`}>
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <span className="text-[10px] md:text-xs text-center leading-tight hidden sm:block">{step.title}</span>
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <Card variant="elevated" className="mb-6 md:mb-8">
          <CardHeader className="pb-4 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              {(() => { const Icon = steps[currentStep].icon; return <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />; })()}
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription className="text-sm">{steps[currentStep].description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 md:space-y-6">
            {/* Step 0: Biometrics */}
            {currentStep === 0 && (
              <div className="grid gap-4 md:gap-6">
                {renderNumericInput('weight', 'Body Weight', '175', 'lbs')}
                {renderNumericInput('age', 'Age', '28', 'years')}
                {renderNumericInput('height', 'Height', '70', 'inches')}
              </div>
            )}

            {/* Step 1: Big 4 (all optional) */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your 1RM numbers, estimate them, or skip movements you haven't tested.
                </p>
                {renderLiftInput('backSquat', 'Back Squat 1RM', '315')}
                {renderLiftInput('frontSquat', 'Front Squat 1RM', '275')}
                {renderLiftInput('strictPress', 'Strict Press 1RM', '145')}
                {renderLiftInput('deadlift', 'Deadlift 1RM', '405')}
              </div>
            )}

            {/* Step 2: Engine Check (optional) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Choose a cardio test you've completed, or skip if you don't have a benchmark.
                </p>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Cardio Test</Label>
                  <Select
                    value={data.cardioTest || 'mile'}
                    onValueChange={(v) => {
                      const test = v as AuditData['cardioTest'];
                      updateData({ cardioTest: test, mileRunTime: undefined, cardioTime: undefined });
                    }}
                  >
                    <SelectTrigger className="font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {cardioTests.map(t => (
                        <SelectItem key={t.value} value={t.value} className="font-mono">{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(!data.cardioTest || data.cardioTest === 'mile') && data.cardioTest !== 'none' && (
                  renderTimeInput('1-Mile Run Time', 'mileRunTime')
                )}
                {data.cardioTest && data.cardioTest !== 'mile' && data.cardioTest !== 'none' && (
                  renderTimeInput(`${cardioTests.find(t => t.value === data.cardioTest)?.label} Time`, 'cardioTime')
                )}
                {data.cardioTest === 'none' && (
                  <p className="text-sm text-muted-foreground italic">
                    No problem — aerobic capacity will be scored neutrally and noted in your results.
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Movement Screen (all optional, all skippable) */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Test your movement quality. Skip any test you can't perform or don't have equipment for.
                </p>

                {/* Broad Jump */}
                {renderMovementField('broadJump', 'Broad Jump', 'broadJump', ['broadJumpFeet', 'broadJumpMode'], (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Measure in:</Label>
                      <ToggleGroup
                        type="single"
                        value={data.broadJumpMode || 'heelToToe'}
                        onValueChange={(v) => { if (v) updateData({ broadJumpMode: v as 'heelToToe' | 'feet' }); }}
                        className="gap-1"
                      >
                        <ToggleGroupItem value="heelToToe" variant="outline" className={`text-xs px-3 py-1 ${data.broadJumpMode !== 'feet' ? 'bg-primary/20 border-primary text-primary' : ''}`}>
                          Heel-to-Toe Count
                        </ToggleGroupItem>
                        <ToggleGroupItem value="feet" variant="outline" className={`text-xs px-3 py-1 ${data.broadJumpMode === 'feet' ? 'bg-primary/20 border-primary text-primary' : ''}`}>
                          Feet
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder={data.broadJumpMode === 'feet' ? '8' : '3'}
                        className="font-mono pr-20"
                        value={data.broadJumpMode === 'feet' ? (data.broadJumpFeet || '') : (data.broadJumpFeet ? data.broadJumpFeet / 2.5 : '')}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || undefined;
                          if (val === undefined) { updateData({ broadJumpFeet: undefined }); return; }
                          updateData({ broadJumpFeet: data.broadJumpMode === 'feet' ? val : val * 2.5 });
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {data.broadJumpMode === 'feet' ? 'feet' : 'steps (×2.5)'}
                      </span>
                    </div>
                    {data.broadJumpFeet && data.broadJumpMode !== 'feet' && (
                      <p className="text-xs text-primary font-mono">= {data.broadJumpFeet.toFixed(1)} feet</p>
                    )}
                  </div>
                ))}

                {/* Dead Hang */}
                {renderMovementField('deadHang', 'Dead Hang', 'deadHang', ['deadHangSeconds'], (
                  <div className="relative">
                    <Input
                      type="number" placeholder="45" className="font-mono pr-16"
                      value={data.deadHangSeconds || ''}
                      onChange={(e) => updateData({ deadHangSeconds: parseFloat(e.target.value) || undefined })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">seconds</span>
                  </div>
                ))}

                {/* Toe Touch */}
                {renderMovementField('toeTouch', 'Toe Touch', 'toeTouch', ['toeTouch'], (
                  <ToggleGroup
                    type="single"
                    value={data.toeTouch !== undefined ? String(data.toeTouch) : ''}
                    onValueChange={(v) => { if (v) updateData({ toeTouch: parseInt(v) as 0 | 1 | 2 }); }}
                    className="justify-start flex-wrap gap-2"
                  >
                    {[0, 1, 2].map((v) => (
                      <ToggleGroupItem key={v} value={String(v)} variant="outline"
                        className={`font-mono px-3 py-2 text-sm ${data.toeTouch === v ? 'bg-primary/20 border-primary text-primary' : ''}`}>
                        {toeLabels[v]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                ))}

                {/* Heel Sit */}
                {renderMovementField('heelSit', 'Heel Sit', 'heelSit', ['heelSit'], (
                  <ToggleGroup
                    type="single"
                    value={data.heelSit || ''}
                    onValueChange={(v) => { if (v) updateData({ heelSit: v as 'pass' | 'fail' }); }}
                    className="justify-start gap-2"
                  >
                    <ToggleGroupItem value="pass" variant="outline" className={`font-mono px-4 py-2 text-sm ${data.heelSit === 'pass' ? 'bg-success/20 border-success text-success' : ''}`}>Pass</ToggleGroupItem>
                    <ToggleGroupItem value="fail" variant="outline" className={`font-mono px-4 py-2 text-sm ${data.heelSit === 'fail' ? 'bg-destructive/20 border-destructive text-destructive' : ''}`}>Fail</ToggleGroupItem>
                  </ToggleGroup>
                ))}

                {/* Deep Squat */}
                {renderMovementField('deepSquat', 'Deep Squat (30s hold)', 'deepSquat', ['deepSquat'], (
                  <ToggleGroup
                    type="single"
                    value={data.deepSquat || ''}
                    onValueChange={(v) => { if (v) updateData({ deepSquat: v as 'pass' | 'fail' }); }}
                    className="justify-start gap-2"
                  >
                    <ToggleGroupItem value="pass" variant="outline" className={`font-mono px-4 py-2 text-sm ${data.deepSquat === 'pass' ? 'bg-success/20 border-success text-success' : ''}`}>Pass</ToggleGroupItem>
                    <ToggleGroupItem value="fail" variant="outline" className={`font-mono px-4 py-2 text-sm ${data.deepSquat === 'fail' ? 'bg-destructive/20 border-destructive text-destructive' : ''}`}>Fail</ToggleGroupItem>
                  </ToggleGroup>
                ))}

                {/* Overhead Reach */}
                {renderMovementField('overheadReach', 'Overhead Reach (Wall Test)', 'overheadReach', ['overheadReach'], (
                  <ToggleGroup
                    type="single"
                    value={data.overheadReach || ''}
                    onValueChange={(v) => { if (v) updateData({ overheadReach: v as 'pass' | 'fail' }); }}
                    className="justify-start gap-2"
                  >
                    <ToggleGroupItem value="pass" variant="outline" className={`font-mono px-4 py-2 text-sm ${data.overheadReach === 'pass' ? 'bg-success/20 border-success text-success' : ''}`}>Pass</ToggleGroupItem>
                    <ToggleGroupItem value="fail" variant="outline" className={`font-mono px-4 py-2 text-sm ${data.overheadReach === 'fail' ? 'bg-destructive/20 border-destructive text-destructive' : ''}`}>Fail</ToggleGroupItem>
                  </ToggleGroup>
                ))}

                {/* Max Pull-ups */}
                {renderMovementField('maxPullups', 'Max Rep Pull-ups', 'maxPullups', ['maxPullups'], (
                  <div className="relative">
                    <Input
                      type="number" placeholder="8" className="font-mono pr-12"
                      value={data.maxPullups !== undefined ? data.maxPullups : ''}
                      onChange={(e) => updateData({ maxPullups: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">reps</span>
                  </div>
                ))}

                {/* Max Push-ups */}
                {renderMovementField('maxPushups', 'Max Rep Push-ups', 'maxPushups', ['maxPushups'], (
                  <div className="relative">
                    <Input
                      type="number" placeholder="25" className="font-mono pr-12"
                      value={data.maxPushups !== undefined ? data.maxPushups : ''}
                      onChange={(e) => updateData({ maxPushups: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">reps</span>
                  </div>
                ))}

                {/* Parallette L-Sit */}
                {renderMovementField('lSit', 'Parallette L-Sit', 'lSit', ['lSitSeconds'], (
                  <div className="relative">
                    <Input
                      type="number" placeholder="20" className="font-mono pr-16"
                      value={data.lSitSeconds || ''}
                      onChange={(e) => updateData({ lSitSeconds: parseFloat(e.target.value) || undefined })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">seconds</span>
                  </div>
                ))}

                {/* Pistol Squat */}
                {renderMovementField('pistolSquat', 'Pistol Squat (Barefoot)', 'pistolSquat', ['pistolSquatLeft', 'pistolSquatRight'], (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Left Leg</Label>
                      <ToggleGroup
                        type="single"
                        value={data.pistolSquatLeft || ''}
                        onValueChange={(v) => { if (v) updateData({ pistolSquatLeft: v as 'yes' | 'no' }); }}
                        className="justify-start gap-2"
                      >
                        <ToggleGroupItem value="yes" variant="outline" className={`font-mono px-3 py-1.5 text-xs ${data.pistolSquatLeft === 'yes' ? 'bg-success/20 border-success text-success' : ''}`}>Yes</ToggleGroupItem>
                        <ToggleGroupItem value="no" variant="outline" className={`font-mono px-3 py-1.5 text-xs ${data.pistolSquatLeft === 'no' ? 'bg-destructive/20 border-destructive text-destructive' : ''}`}>No</ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Right Leg</Label>
                      <ToggleGroup
                        type="single"
                        value={data.pistolSquatRight || ''}
                        onValueChange={(v) => { if (v) updateData({ pistolSquatRight: v as 'yes' | 'no' }); }}
                        className="justify-start gap-2"
                      >
                        <ToggleGroupItem value="yes" variant="outline" className={`font-mono px-3 py-1.5 text-xs ${data.pistolSquatRight === 'yes' ? 'bg-success/20 border-success text-success' : ''}`}>Yes</ToggleGroupItem>
                        <ToggleGroupItem value="no" variant="outline" className={`font-mono px-3 py-1.5 text-xs ${data.pistolSquatRight === 'no' ? 'bg-destructive/20 border-destructive text-destructive' : ''}`}>No</ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Lifestyle Diagnostic (expanded) */}
            {currentStep === 4 && (
              <div className="space-y-6 md:space-y-8">
                {/* Sleep */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Average hours of sleep per night?</Label>
                  <Select value={data.sleep || ''} onValueChange={(v) => updateData({ sleep: v as AuditData['sleep'] })}>
                    <SelectTrigger className={`font-mono ${errors.sleep ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select hours" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Object.entries(sleepLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="font-mono">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sleep && <p className="text-xs text-destructive">{errors.sleep}</p>}
                </div>

                {/* Protein */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Do you consume at least 1.6g of protein per kg daily?</Label>
                  <ToggleGroup type="single" value={data.protein || ''} onValueChange={(v) => { if (v) updateData({ protein: v as AuditData['protein'] }); }} className="justify-start flex-wrap gap-2">
                    {['yes', 'no', 'unsure'].map(v => (
                      <ToggleGroupItem key={v} value={v} variant="outline"
                        className={`font-mono px-4 py-2 text-sm ${data.protein === v ? 'bg-primary/20 border-primary text-primary' : ''} ${errors.protein ? 'border-destructive' : ''}`}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  {errors.protein && <p className="text-xs text-destructive">{errors.protein}</p>}
                </div>

                {/* Stress */}
                <div className="space-y-4">
                  <Label className="text-sm text-muted-foreground">Current non-training stress level?</Label>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span className="font-mono text-primary text-base">{data.stress || 5}</span>
                      <span>High</span>
                    </div>
                    <Slider value={[data.stress as number || 5]} onValueChange={([v]) => updateData({ stress: v })} min={1} max={10} step={1} />
                  </div>
                  {errors.stress && <p className="text-xs text-destructive">{errors.stress}</p>}
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Years of consistent strength training (3+ days/week)?</Label>
                  <Select value={data.experience || ''} onValueChange={(v) => updateData({ experience: v as AuditData['experience'] })}>
                    <SelectTrigger className={`font-mono ${errors.experience ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select years" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Object.entries(experienceLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="font-mono">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.experience && <p className="text-xs text-destructive">{errors.experience}</p>}
                </div>

                {/* Training Frequency */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">How many days per week do you train?</Label>
                  <ToggleGroup type="single" value={data.trainingFrequency || ''} onValueChange={(v) => { if (v) updateData({ trainingFrequency: v as AuditData['trainingFrequency'] }); }} className="justify-start flex-wrap gap-2">
                    {['1-2', '3-4', '5-6', '7'].map(v => (
                      <ToggleGroupItem key={v} value={v} variant="outline"
                        className={`font-mono px-4 py-2 text-sm ${data.trainingFrequency === v ? 'bg-primary/20 border-primary text-primary' : ''}`}>
                        {v} days
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Primary Goal */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">What's your main training focus?</Label>
                  <Select value={data.primaryGoal || ''} onValueChange={(v) => updateData({ primaryGoal: v as AuditData['primaryGoal'] })}>
                    <SelectTrigger className="font-mono"><SelectValue placeholder="Select goal" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="strength" className="font-mono">Strength</SelectItem>
                      <SelectItem value="conditioning" className="font-mono">Conditioning</SelectItem>
                      <SelectItem value="body-comp" className="font-mono">Body Composition</SelectItem>
                      <SelectItem value="sport" className="font-mono">Sport Performance</SelectItem>
                      <SelectItem value="health" className="font-mono">General Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Injury History */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Do you have any current injuries or limitations?</Label>
                  <Select value={data.injuryHistory || ''} onValueChange={(v) => updateData({ injuryHistory: v as AuditData['injuryHistory'] })}>
                    <SelectTrigger className="font-mono"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none" className="font-mono">None</SelectItem>
                      <SelectItem value="upper" className="font-mono">Upper Body</SelectItem>
                      <SelectItem value="lower" className="font-mono">Lower Body</SelectItem>
                      <SelectItem value="back" className="font-mono">Back / Spine</SelectItem>
                      <SelectItem value="multiple" className="font-mono">Multiple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Water Intake */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">How much water do you drink daily?</Label>
                  <ToggleGroup type="single" value={data.waterIntake || ''} onValueChange={(v) => { if (v) updateData({ waterIntake: v as AuditData['waterIntake'] }); }} className="justify-start flex-wrap gap-2">
                    {['<1L', '1-2L', '2-3L', '3L+'].map(v => (
                      <ToggleGroupItem key={v} value={v} variant="outline"
                        className={`font-mono px-3 py-2 text-sm ${data.waterIntake === v ? 'bg-primary/20 border-primary text-primary' : ''}`}>
                        {v}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Alcohol */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">How often do you consume alcohol?</Label>
                  <ToggleGroup type="single" value={data.alcohol || ''} onValueChange={(v) => { if (v) updateData({ alcohol: v as AuditData['alcohol'] }); }} className="justify-start flex-wrap gap-2">
                    {[{ v: 'never', l: 'Never' }, { v: '1-2x', l: '1-2x/week' }, { v: '3-4x', l: '3-4x/week' }, { v: 'daily', l: 'Daily' }].map(({ v, l }) => (
                      <ToggleGroupItem key={v} value={v} variant="outline"
                        className={`font-mono px-3 py-2 text-sm ${data.alcohol === v ? 'bg-primary/20 border-primary text-primary' : ''}`}>
                        {l}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Precision Nutrition Habits Section */}
                <div className="border-t border-border/50 pt-6 mt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Apple className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-semibold">Nutrition Habits</Label>
                    <Badge variant="secondary" className="text-[10px]">OPTIONAL</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5">
                    These help the AI understand your eating behaviors — not just what you eat, but how you eat.
                  </p>

                  {[
                    { key: 'eatsSlowly', label: 'Do you eat slowly and without distractions?', opts: ['always', 'sometimes', 'rarely'] },
                    { key: 'stopsAt80', label: 'Do you stop eating at about 80% full?', opts: ['always', 'sometimes', 'rarely'] },
                    { key: 'proteinEveryMeal', label: 'Do you include protein at every meal?', opts: ['always', 'sometimes', 'rarely'] },
                    { key: 'veggiesEveryMeal', label: 'Do you eat vegetables or fruit at every meal?', opts: ['always', 'sometimes', 'rarely'] },
                    { key: 'mealPrep', label: 'Do you plan or prep meals in advance?', opts: ['always', 'sometimes', 'rarely'] },
                    { key: 'eatingConsistency', label: 'How consistent is your eating schedule?', opts: ['very', 'somewhat', 'inconsistent'] },
                  ].map(({ key, label, opts }) => (
                    <div key={key} className="space-y-2 mb-4">
                      <Label className="text-sm text-muted-foreground">{label}</Label>
                      <ToggleGroup
                        type="single"
                        value={(data as any)[key] || ''}
                        onValueChange={(v) => { if (v) updateData({ [key]: v }); }}
                        className="justify-start flex-wrap gap-2"
                      >
                        {opts.map((o) => (
                          <ToggleGroupItem key={o} value={o} variant="outline"
                            className={`font-mono px-3 py-2 text-sm capitalize ${(data as any)[key] === o ? 'bg-primary/20 border-primary text-primary' : ''}`}>
                            {o}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="grid gap-3 md:gap-4 grid-cols-2">
                  <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                    <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Weight</p>
                    <p className="font-mono text-base md:text-lg">{data.weight} lbs</p>
                  </div>
                  <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                    <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Age</p>
                    <p className="font-mono text-base md:text-lg">{data.age} years</p>
                  </div>
                  {data.backSquat && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">
                        {(data.substitutions as Record<string, string>)?.backSquat || 'Back Squat'}
                        {(data.estimatedLifts as Record<string, boolean>)?.backSquat ? ' (est.)' : ''}
                      </p>
                      <p className="font-mono text-base md:text-lg">{data.backSquat} lbs</p>
                    </div>
                  )}
                  {data.frontSquat && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">
                        {(data.substitutions as Record<string, string>)?.frontSquat || 'Front Squat'}
                        {(data.estimatedLifts as Record<string, boolean>)?.frontSquat ? ' (est.)' : ''}
                      </p>
                      <p className="font-mono text-base md:text-lg">{data.frontSquat} lbs</p>
                    </div>
                  )}
                  {data.strictPress && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">
                        Strict Press{(data.estimatedLifts as Record<string, boolean>)?.strictPress ? ' (est.)' : ''}
                      </p>
                      <p className="font-mono text-base md:text-lg">{data.strictPress} lbs</p>
                    </div>
                  )}
                  {data.deadlift && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">
                        {(data.substitutions as Record<string, string>)?.deadlift || 'Deadlift'}
                        {(data.estimatedLifts as Record<string, boolean>)?.deadlift ? ' (est.)' : ''}
                      </p>
                      <p className="font-mono text-base md:text-lg">{data.deadlift} lbs</p>
                    </div>
                  )}
                  <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                    <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Cardio</p>
                    <p className="font-mono text-base md:text-lg">
                      {data.cardioTest === 'none' ? 'Skipped' :
                       data.mileRunTime ? formatTimeDisplay(data.mileRunTime as number) :
                       data.cardioTime ? formatTimeDisplay(data.cardioTime as number) : '-'}
                    </p>
                  </div>

                  {/* Movement Screen review items */}
                  {data.broadJumpFeet && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Broad Jump</p>
                      <p className="font-mono text-base md:text-lg">{data.broadJumpFeet.toFixed(1)} ft</p>
                    </div>
                  )}
                  {data.deadHangSeconds !== undefined && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Dead Hang</p>
                      <p className="font-mono text-base md:text-lg">{data.deadHangSeconds}s</p>
                    </div>
                  )}
                  {data.toeTouch !== undefined && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Toe Touch</p>
                      <p className="font-mono text-base md:text-lg">{['None', 'Toes', 'Palms'][data.toeTouch]}</p>
                    </div>
                  )}
                  {data.heelSit && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Heel Sit</p>
                      <p className={`font-mono text-base md:text-lg ${data.heelSit === 'pass' ? 'text-success' : 'text-destructive'}`}>{data.heelSit === 'pass' ? 'Pass' : 'Fail'}</p>
                    </div>
                  )}
                  {data.deepSquat && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Deep Squat</p>
                      <p className={`font-mono text-base md:text-lg ${data.deepSquat === 'pass' ? 'text-success' : 'text-destructive'}`}>{data.deepSquat === 'pass' ? 'Pass' : 'Fail'}</p>
                    </div>
                  )}
                  {data.overheadReach && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Overhead Reach</p>
                      <p className={`font-mono text-base md:text-lg ${data.overheadReach === 'pass' ? 'text-success' : 'text-destructive'}`}>{data.overheadReach === 'pass' ? 'Pass' : 'Fail'}</p>
                    </div>
                  )}
                  {data.maxPullups !== undefined && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Pull-ups</p>
                      <p className="font-mono text-base md:text-lg">{data.maxPullups} reps</p>
                    </div>
                  )}
                  {data.maxPushups !== undefined && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Push-ups</p>
                      <p className="font-mono text-base md:text-lg">{data.maxPushups} reps</p>
                    </div>
                  )}
                  {data.lSitSeconds !== undefined && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">L-Sit</p>
                      <p className="font-mono text-base md:text-lg">{data.lSitSeconds}s</p>
                    </div>
                  )}
                  {(data.pistolSquatLeft || data.pistolSquatRight) && (
                    <div className="p-3 md:p-4 rounded-lg bg-secondary/50 col-span-2">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Pistol Squat</p>
                      <p className="font-mono text-base md:text-lg">
                        L: {data.pistolSquatLeft === 'yes' ? '✓' : '✗'} | R: {data.pistolSquatRight === 'yes' ? '✓' : '✗'}
                      </p>
                    </div>
                  )}

                  <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                    <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Sleep</p>
                    <p className="font-mono text-base md:text-lg">{data.sleep ? sleepLabels[data.sleep] : '-'}</p>
                  </div>
                  <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                    <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Stress</p>
                    <p className="font-mono text-base md:text-lg">{data.stress}/10</p>
                  </div>
                  <div className="p-3 md:p-4 rounded-lg bg-secondary/50">
                    <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Training Experience</p>
                    <p className="font-mono text-base md:text-lg">{data.experience ? experienceLabels[data.experience] : '-'}</p>
                  </div>
                  {(() => {
                    const habits = [data.eatsSlowly, data.stopsAt80, data.proteinEveryMeal, data.veggiesEveryMeal, data.mealPrep, data.eatingConsistency];
                    const strong = habits.filter(h => h === 'always' || h === 'very').length;
                    const answered = habits.filter(Boolean).length;
                    if (answered === 0) return null;
                    return (
                      <div className="p-3 md:p-4 rounded-lg bg-secondary/50 col-span-2">
                        <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Nutrition Habits</p>
                        <p className="font-mono text-base md:text-lg">{strong}/{answered} strong</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0} size="lg" className="flex-1 md:flex-none">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <Button variant="hero" onClick={handleNext} size="lg" className="flex-1 md:flex-none">
            {currentStep === steps.length - 1 ? 'Generate' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
