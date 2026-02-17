import { create } from 'zustand';

export interface AuditData {
  // Biometrics (required)
  weight: number;
  age: number;
  height: number;
  
  // Big 4 Ratios (all optional)
  backSquat?: number;
  frontSquat?: number;
  strictPress?: number;
  deadlift?: number;
  
  // Estimation tracking
  estimatedLifts?: Record<string, boolean>;
  substitutions?: Record<string, string>;
  
  // Engine Check (optional)
  mileRunTime?: number;
  cardioTest?: 'mile' | '2k-row' | '500m-row' | '2k-bike' | 'none';
  cardioTime?: number;
  
  // Lifestyle (required)
  sleep: '<6' | '6-7' | '7-8' | '8+';
  protein: 'yes' | 'no' | 'unsure';
  stress: number;
  experience: '<1' | '1-3' | '3-5' | '5+';
  
  // New lifestyle questions
  trainingFrequency?: '1-2' | '3-4' | '5-6' | '7';
  primaryGoal?: 'strength' | 'conditioning' | 'body-comp' | 'sport' | 'health';
  injuryHistory?: 'none' | 'upper' | 'lower' | 'back' | 'multiple';
  waterIntake?: '<1L' | '1-2L' | '2-3L' | '3L+';
  alcohol?: 'never' | '1-2x' | '3-4x' | 'daily';
}

export interface ResourceLink {
  title: string;
  url: string;
}

export interface Leak {
  id: string;
  title: string;
  description: string;
  severity: 'warning' | 'critical';
  metric: string;
  recommendation: string;
  resourceLinks?: ResourceLink[];
}

export interface AuditResults {
  data: AuditData;
  leaks: Leak[];
  scores: {
    strength: number;
    endurance: number;
    mobility: number;
    power: number;
    stability: number;
  };
  tier: 'foundation' | 'intermediate' | 'performance' | 'elite';
  overallScore: number;
  foundationRecommended?: boolean;
  foundationReason?: string;
  skippedAreas?: string[];
}

interface AuditStore {
  currentStep: number;
  data: Partial<AuditData>;
  results: AuditResults | null;
  setStep: (step: number) => void;
  updateData: (updates: Partial<AuditData>) => void;
  calculateResults: () => void;
  reset: () => void;
}

// Cardio equivalence: convert alternative tests to equivalent mile time in seconds
function convertCardioToMileEquivalent(test: AuditData['cardioTest'], timeSeconds?: number): number | undefined {
  if (!timeSeconds || !test || test === 'none') return undefined;
  switch (test) {
    case 'mile': return timeSeconds;
    case '2k-row': return Math.round(timeSeconds * 0.95); // ~similar aerobic demand
    case '500m-row': return Math.round(timeSeconds * 3.5); // short burst → extrapolate
    case '2k-bike': return Math.round(timeSeconds * 1.1); // bike erg slightly easier
    default: return undefined;
  }
}

function detectLeaks(data: AuditData): { leaks: Leak[]; skippedAreas: string[] } {
  const leaks: Leak[] = [];
  const skippedAreas: string[] = [];

  // Front Squat < 85% of Back Squat
  if (data.backSquat && data.frontSquat) {
    const frontSquatRatio = (data.frontSquat / data.backSquat) * 100;
    if (frontSquatRatio < 85) {
      leaks.push({
        id: 'thoracic-core',
        title: 'Thoracic/Core Stability Leak',
        description: `Your Front Squat is ${frontSquatRatio.toFixed(0)}% of your Back Squat (target: ≥85%)`,
        severity: frontSquatRatio < 75 ? 'critical' : 'warning',
        metric: `${frontSquatRatio.toFixed(0)}%`,
        recommendation: 'Focus on thoracic mobility drills and core bracing exercises. Priority: Front-loaded carries, pause front squats, and thoracic spine work.',
      });
    }
  } else if (!data.backSquat || !data.frontSquat) {
    skippedAreas.push('Thoracic/Core Stability (missing squat data)');
  }

  // Aerobic Power Leak
  const effectiveMileTime = data.mileRunTime || convertCardioToMileEquivalent(data.cardioTest, data.cardioTime);
  if (effectiveMileTime && data.backSquat && data.weight) {
    const mileMinutes = effectiveMileTime / 60;
    const bodyweightSquatRatio = data.backSquat / data.weight;
    if (mileMinutes > 9 && bodyweightSquatRatio > 1.5) {
      leaks.push({
        id: 'aerobic-power',
        title: 'Aerobic Power Leak',
        description: `Cardio time of ${formatTime(effectiveMileTime)} with strong squat numbers indicates underdeveloped aerobic capacity`,
        severity: mileMinutes > 10 ? 'critical' : 'warning',
        metric: formatTime(effectiveMileTime),
        recommendation: 'Implement Zone 2 conditioning 3-4x weekly. Add tempo intervals and long aerobic pieces to develop engine without sacrificing strength.',
      });
    }
  } else if (!effectiveMileTime) {
    skippedAreas.push('Aerobic Power (no cardio benchmark provided)');
  }

  // Pressing Strength Leak
  if (data.strictPress && data.weight) {
    const pressRatio = (data.strictPress / data.weight) * 100;
    if (pressRatio < 65) {
      leaks.push({
        id: 'pressing-strength',
        title: 'Pressing Strength Leak',
        description: `Strict Press at ${pressRatio.toFixed(0)}% of bodyweight (target: ≥65%)`,
        severity: pressRatio < 55 ? 'critical' : 'warning',
        metric: `${pressRatio.toFixed(0)}%`,
        recommendation: 'Increase overhead pressing volume with strict press progressions, push press, and accessory work for shoulders and triceps.',
      });
    }
  } else if (!data.strictPress) {
    skippedAreas.push('Pressing Strength (no strict press data)');
  }

  // Posterior Chain Leak
  if (data.deadlift && data.weight) {
    const deadliftRatio = data.deadlift / data.weight;
    if (deadliftRatio < 2) {
      leaks.push({
        id: 'posterior-chain',
        title: 'Posterior Chain Leak',
        description: `Deadlift at ${deadliftRatio.toFixed(2)}x bodyweight (target: ≥2x)`,
        severity: deadliftRatio < 1.75 ? 'critical' : 'warning',
        metric: `${deadliftRatio.toFixed(2)}x BW`,
        recommendation: 'Focus on hip hinge patterns, Romanian deadlifts, and glute-ham development. Add heavy pulling 2x weekly.',
      });
    }
  } else if (!data.deadlift) {
    skippedAreas.push('Posterior Chain (no deadlift data)');
  }

  // Systemic Recovery Leak
  if (data.sleep === '<6' && data.stress > 8) {
    leaks.push({
      id: 'systemic-recovery',
      title: 'Systemic Recovery Leak',
      description: `Sleep deprivation (<6hrs) combined with high stress (${data.stress}/10) is compromising recovery capacity`,
      severity: data.stress >= 9 ? 'critical' : 'warning',
      metric: `Sleep: <6h | Stress: ${data.stress}/10`,
      recommendation: 'Prioritize sleep hygiene and stress management before increasing training volume. Without adequate recovery, adaptation is compromised regardless of training quality.',
      resourceLinks: [
        { title: 'Recovery Protocol', url: '#recovery' },
        { title: 'Stress Management Guide', url: '#stress-management' }
      ]
    });
  }

  return { leaks, skippedAreas };
}

function calculateScores(data: AuditData): AuditResults['scores'] {
  const hasStrength = !!(data.backSquat && data.deadlift && data.weight);
  const effectiveMileTime = data.mileRunTime || convertCardioToMileEquivalent(data.cardioTest, data.cardioTime);
  const hasFrontSquat = !!(data.frontSquat && data.backSquat);
  const hasPress = !!(data.strictPress && data.weight);

  const strengthScore = hasStrength
    ? Math.min(100, ((data.backSquat! + data.deadlift!) / data.weight! / 4) * 100)
    : 50; // neutral default

  const enduranceScore = effectiveMileTime
    ? Math.min(100, Math.max(0, 100 - ((effectiveMileTime / 60) - 5) * 15))
    : 50;

  const mobilityScore = hasFrontSquat
    ? Math.min(100, (data.frontSquat! / data.backSquat!) * 100 + 15)
    : 50;

  const powerScore = hasPress
    ? Math.min(100, (data.strictPress! / data.weight!) * 150)
    : 50;

  const stabilityScore = hasFrontSquat
    ? Math.min(100, (data.frontSquat! / data.backSquat!) * 110)
    : 50;

  return {
    strength: Math.round(strengthScore),
    endurance: Math.round(enduranceScore),
    mobility: Math.round(mobilityScore),
    power: Math.round(powerScore),
    stability: Math.round(stabilityScore),
  };
}

function determineTier(scores: AuditResults['scores'], experience?: AuditData['experience']): AuditResults['tier'] {
  if (experience === '<1') return 'foundation';
  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / 5;
  if (avg >= 85) return 'elite';
  if (avg >= 70) return 'performance';
  if (avg >= 55) return 'intermediate';
  return 'foundation';
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const useAuditStore = create<AuditStore>((set, get) => ({
  currentStep: 0,
  data: {},
  results: null,

  setStep: (step) => set({ currentStep: step }),

  updateData: (updates) => set((state) => ({
    data: { ...state.data, ...updates }
  })),

  calculateResults: () => {
    const { data } = get();
    const fullData = data as AuditData;
    
    const { leaks, skippedAreas } = detectLeaks(fullData);
    const scores = calculateScores(fullData);
    const tier = determineTier(scores, fullData.experience);
    const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5);

    const foundationRecommended = fullData.experience === '<1';
    const foundationReason = foundationRecommended 
      ? 'With less than 1 year of consistent training, the Foundation track ensures long-term structural integrity and prevents injury.'
      : undefined;

    set({
      results: {
        data: fullData,
        leaks,
        scores,
        tier,
        overallScore,
        foundationRecommended,
        foundationReason,
        skippedAreas,
      }
    });
  },

  reset: () => set({
    currentStep: 0,
    data: {},
    results: null,
  }),
}));
