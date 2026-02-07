import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuditStore, AuditData } from "@/stores/auditStore";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, User, Dumbbell, Timer, CheckCircle, Heart } from "lucide-react";

const steps = [
  { id: 'biometrics', title: 'Biometrics', icon: User, description: 'Basic measurements' },
  { id: 'strength', title: 'The Big 4', icon: Dumbbell, description: 'Strength ratios' },
  { id: 'engine', title: 'Engine Check', icon: Timer, description: 'Aerobic capacity' },
  { id: 'lifestyle', title: 'Lifestyle', icon: Heart, description: 'Recovery factors' },
  { id: 'review', title: 'Review', icon: CheckCircle, description: 'Confirm data' },
];

const sleepLabels: Record<AuditData['sleep'], string> = {
  '<6': '< 6 hours',
  '6-7': '6-7 hours',
  '7-8': '7-8 hours',
  '8+': '8+ hours',
};

const experienceLabels: Record<AuditData['experience'], string> = {
  '<1': '< 1 year',
  '1-3': '1-3 years',
  '3-5': '3-5 years',
  '5+': '5+ years',
};

export function AuditForm() {
  const navigate = useNavigate();
  const { currentStep, data, updateData, setStep, calculateResults } = useAuditStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!data.weight || data.weight <= 0) newErrors.weight = 'Required';
      if (!data.age || data.age <= 0) newErrors.age = 'Required';
      if (!data.height || data.height <= 0) newErrors.height = 'Required';
    } else if (currentStep === 1) {
      if (!data.backSquat || data.backSquat <= 0) newErrors.backSquat = 'Required';
      if (!data.frontSquat || data.frontSquat <= 0) newErrors.frontSquat = 'Required';
      if (!data.strictPress || data.strictPress <= 0) newErrors.strictPress = 'Required';
      if (!data.deadlift || data.deadlift <= 0) newErrors.deadlift = 'Required';
    } else if (currentStep === 2) {
      if (!data.mileRunTime || data.mileRunTime <= 0) newErrors.mileRunTime = 'Required';
    } else if (currentStep === 3) {
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
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const renderInput = (
    name: keyof typeof data,
    label: string,
    placeholder: string,
    unit: string
  ) => (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={name}
          type="number"
          placeholder={placeholder}
          value={data[name] || ''}
          onChange={(e) => updateData({ [name]: parseFloat(e.target.value) || undefined })}
          className={`font-mono pr-12 ${errors[name] ? 'border-destructive' : ''}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {unit}
        </span>
      </div>
      {errors[name] && (
        <p className="text-xs text-destructive">{errors[name]}</p>
      )}
    </div>
  );

  const renderTimeInput = () => {
    const minutes = data.mileRunTime ? Math.floor(data.mileRunTime / 60) : '';
    const seconds = data.mileRunTime ? data.mileRunTime % 60 : '';

    const handleTimeChange = (mins: string, secs: string) => {
      const m = parseInt(mins) || 0;
      const s = parseInt(secs) || 0;
      updateData({ mileRunTime: m * 60 + s });
    };

    return (
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">1-Mile Run Time</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="MM"
            value={minutes}
            onChange={(e) => handleTimeChange(e.target.value, seconds.toString())}
            className={`font-mono w-20 text-center ${errors.mileRunTime ? 'border-destructive' : ''}`}
            min={0}
            max={30}
          />
          <span className="text-muted-foreground">:</span>
          <Input
            type="number"
            placeholder="SS"
            value={seconds}
            onChange={(e) => handleTimeChange(minutes.toString(), e.target.value)}
            className={`font-mono w-20 text-center ${errors.mileRunTime ? 'border-destructive' : ''}`}
            min={0}
            max={59}
          />
        </div>
        {errors.mileRunTime && (
          <p className="text-xs text-destructive">{errors.mileRunTime}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-2xl">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Badge variant="data">
              STEP {currentStep + 1} OF {steps.length}
            </Badge>
            <span className="font-mono text-sm text-primary">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-2 ${
                  isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                  isActive ? 'border-primary bg-primary/10' :
                  isCompleted ? 'border-success bg-success/10' : 'border-border'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs hidden sm:block">{step.title}</span>
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <Card variant="elevated" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const Icon = steps[currentStep].icon;
                return <Icon className="w-5 h-5 text-primary" />;
              })()}
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 0: Biometrics */}
            {currentStep === 0 && (
              <div className="grid gap-6">
                {renderInput('weight', 'Body Weight', '175', 'lbs')}
                {renderInput('age', 'Age', '28', 'years')}
                {renderInput('height', 'Height', '70', 'inches')}
              </div>
            )}

            {/* Step 1: Big 4 Ratios */}
            {currentStep === 1 && (
              <div className="grid gap-6 sm:grid-cols-2">
                {renderInput('backSquat', 'Back Squat 1RM', '315', 'lbs')}
                {renderInput('frontSquat', 'Front Squat 1RM', '275', 'lbs')}
                {renderInput('strictPress', 'Strict Press 1RM', '145', 'lbs')}
                {renderInput('deadlift', 'Deadlift 1RM', '405', 'lbs')}
              </div>
            )}

            {/* Step 2: Engine Check */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {renderTimeInput()}
                <p className="text-sm text-muted-foreground">
                  Enter your best all-out 1-mile run time. This tests your aerobic power ceiling.
                </p>
              </div>
            )}

            {/* Step 3: Lifestyle Diagnostic */}
            {currentStep === 3 && (
              <div className="space-y-8">
                {/* Sleep */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Average hours of sleep per night?
                  </Label>
                  <Select
                    value={data.sleep || ''}
                    onValueChange={(value) => updateData({ sleep: value as AuditData['sleep'] })}
                  >
                    <SelectTrigger className={`font-mono ${errors.sleep ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select hours" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {(Object.keys(sleepLabels) as AuditData['sleep'][]).map((key) => (
                        <SelectItem key={key} value={key} className="font-mono">
                          {sleepLabels[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sleep && <p className="text-xs text-destructive">{errors.sleep}</p>}
                </div>

                {/* Protein */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Do you consume at least 1.6g of protein per kg daily?
                  </Label>
                  <ToggleGroup
                    type="single"
                    value={data.protein || ''}
                    onValueChange={(value) => {
                      if (value) updateData({ protein: value as AuditData['protein'] });
                    }}
                    className="justify-start"
                  >
                    <ToggleGroupItem
                      value="yes"
                      variant="outline"
                      className={`font-mono px-6 ${data.protein === 'yes' ? 'bg-primary/20 border-primary text-primary' : ''} ${errors.protein ? 'border-destructive' : ''}`}
                    >
                      Yes
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="no"
                      variant="outline"
                      className={`font-mono px-6 ${data.protein === 'no' ? 'bg-primary/20 border-primary text-primary' : ''} ${errors.protein ? 'border-destructive' : ''}`}
                    >
                      No
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="unsure"
                      variant="outline"
                      className={`font-mono px-6 ${data.protein === 'unsure' ? 'bg-primary/20 border-primary text-primary' : ''} ${errors.protein ? 'border-destructive' : ''}`}
                    >
                      Unsure
                    </ToggleGroupItem>
                  </ToggleGroup>
                  {errors.protein && <p className="text-xs text-destructive">{errors.protein}</p>}
                </div>

                {/* Stress */}
                <div className="space-y-4">
                  <Label className="text-sm text-muted-foreground">
                    Current non-training stress level (Work/Life)?
                  </Label>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span className="font-mono text-primary text-base">{data.stress || 5}</span>
                      <span>High</span>
                    </div>
                    <Slider
                      value={[data.stress || 5]}
                      onValueChange={([value]) => updateData({ stress: value })}
                      min={1}
                      max={10}
                      step={1}
                      className={errors.stress ? 'border-destructive' : ''}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                      <span>1</span>
                      <span>5</span>
                      <span>10</span>
                    </div>
                  </div>
                  {errors.stress && <p className="text-xs text-destructive">{errors.stress}</p>}
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Years of consistent strength training (3+ days/week)?
                  </Label>
                  <Select
                    value={data.experience || ''}
                    onValueChange={(value) => updateData({ experience: value as AuditData['experience'] })}
                  >
                    <SelectTrigger className={`font-mono ${errors.experience ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select years" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {(Object.keys(experienceLabels) as AuditData['experience'][]).map((key) => (
                        <SelectItem key={key} value={key} className="font-mono">
                          {experienceLabels[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.experience && <p className="text-xs text-destructive">{errors.experience}</p>}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Weight</p>
                    <p className="font-mono text-lg">{data.weight} lbs</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Age</p>
                    <p className="font-mono text-lg">{data.age} years</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Back Squat</p>
                    <p className="font-mono text-lg">{data.backSquat} lbs</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Front Squat</p>
                    <p className="font-mono text-lg">{data.frontSquat} lbs</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Strict Press</p>
                    <p className="font-mono text-lg">{data.strictPress} lbs</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Deadlift</p>
                    <p className="font-mono text-lg">{data.deadlift} lbs</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">1-Mile Run</p>
                    <p className="font-mono text-lg">
                      {data.mileRunTime ? `${Math.floor(data.mileRunTime / 60)}:${(data.mileRunTime % 60).toString().padStart(2, '0')}` : '-'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Sleep</p>
                    <p className="font-mono text-lg">{data.sleep ? sleepLabels[data.sleep] : '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Protein Intake</p>
                    <p className="font-mono text-lg capitalize">{data.protein || '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Stress Level</p>
                    <p className="font-mono text-lg">{data.stress}/10</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 sm:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Training Experience</p>
                    <p className="font-mono text-lg">{data.experience ? experienceLabels[data.experience] : '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="hero" onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Generate Report' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
