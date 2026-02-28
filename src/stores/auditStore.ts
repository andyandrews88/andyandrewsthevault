import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  
  // Movement Screen (all optional, all skippable)
  broadJumpFeet?: number;
  broadJumpMode?: 'heelToToe' | 'feet';
  deadHangSeconds?: number;
  toeTouch?: 0 | 1 | 2;
  heelSit?: 'pass' | 'fail';
  deepSquat?: 'pass' | 'fail';
  overheadReach?: 'pass' | 'fail';
  maxPullups?: number;
  maxPushups?: number;
  lSitSeconds?: number;
  pistolSquatLeft?: 'yes' | 'no';
  pistolSquatRight?: 'yes' | 'no';

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

  // Precision Nutrition habits
  eatsSlowly?: 'always' | 'sometimes' | 'rarely';
  stopsAt80?: 'always' | 'sometimes' | 'rarely';
  proteinEveryMeal?: 'always' | 'sometimes' | 'rarely';
  veggiesEveryMeal?: 'always' | 'sometimes' | 'rarely';
  mealPrep?: 'always' | 'sometimes' | 'rarely';
  eatingConsistency?: 'very' | 'somewhat' | 'inconsistent';
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
    case '2k-row': return Math.round(timeSeconds * 0.95);
    case '500m-row': return Math.round(timeSeconds * 3.5);
    case '2k-bike': return Math.round(timeSeconds * 1.1);
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

  // Nutrition Behavior Leak
  const pnHabits = [data.eatsSlowly, data.stopsAt80, data.proteinEveryMeal, data.veggiesEveryMeal, data.mealPrep, data.eatingConsistency];
  const rarelyCount = pnHabits.filter(h => h === 'rarely' || h === 'inconsistent').length;
  if (rarelyCount >= 3) {
    leaks.push({
      id: 'nutrition-behavior',
      title: 'Nutrition Behavior Leak',
      description: `${rarelyCount} of 6 foundational eating habits are inconsistent, undermining nutrition quality regardless of what you eat`,
      severity: rarelyCount >= 5 ? 'critical' : 'warning',
      metric: `${rarelyCount}/6 weak habits`,
      recommendation: 'Focus on Precision Nutrition anchor habits: pick one habit (e.g., eating slowly or adding protein to every meal) and practice it consistently for 2 weeks before adding another. Behavior change beats meal plans.',
    });
  }

  // === Movement Screen Leaks ===

  // Mobility Deficit: toeTouch=0 AND (heelSit=fail OR deepSquat=fail)
  const hasMobilityData = data.toeTouch !== undefined || data.heelSit !== undefined || data.deepSquat !== undefined || data.overheadReach !== undefined;
  if (hasMobilityData) {
    const mobilityFailures: string[] = [];
    if (data.toeTouch === 0) mobilityFailures.push('toe touch');
    if (data.heelSit === 'fail') mobilityFailures.push('heel sit');
    if (data.deepSquat === 'fail') mobilityFailures.push('deep squat');
    if (data.overheadReach === 'fail') mobilityFailures.push('overhead reach');
    if (mobilityFailures.length >= 2) {
      leaks.push({
        id: 'mobility-deficit',
        title: 'Mobility Deficit',
        description: `Failed ${mobilityFailures.length} mobility tests (${mobilityFailures.join(', ')}). Multiple restrictions indicate systemic mobility limitations.`,
        severity: mobilityFailures.length >= 3 ? 'critical' : 'warning',
        metric: `${mobilityFailures.length} failures`,
        recommendation: 'Prioritize daily mobility work: hip flexor stretching, thoracic spine rotation, ankle mobility drills, and deep squat holds. Spend 10-15 min daily before training.',
      });
    }
  } else {
    skippedAreas.push('Mobility Screen (no mobility tests completed)');
  }

  // Grip/Hanging Stability: deadHang < 30s
  if (data.deadHangSeconds !== undefined) {
    if (data.deadHangSeconds < 30) {
      leaks.push({
        id: 'grip-stability',
        title: 'Grip/Hanging Stability Leak',
        description: `Dead hang of ${data.deadHangSeconds}s indicates weak grip and shoulder stability (target: ≥30s)`,
        severity: data.deadHangSeconds < 15 ? 'critical' : 'warning',
        metric: `${data.deadHangSeconds}s`,
        recommendation: 'Add daily dead hangs (accumulate 2-3 min total), farmer carries, and grip-specific work. Strong grip correlates with longevity and upper body pulling capacity.',
      });
    }
  }

  // L-Sit Stability
  if (data.lSitSeconds !== undefined) {
    if (data.lSitSeconds < 15) {
      leaks.push({
        id: 'core-stability',
        title: 'Core Stability Leak',
        description: `L-Sit hold of ${data.lSitSeconds}s indicates weak hip flexor strength and core compression (target: ≥15s)`,
        severity: data.lSitSeconds < 10 ? 'critical' : 'warning',
        metric: `${data.lSitSeconds}s`,
        recommendation: 'Progress through tucked L-sits, single leg extensions, and hollow body holds. Core compression strength is foundational for athletic control.',
      });
    }
  }

  // Upper Body Endurance: pullups < 3 OR pushups < 10
  const hasPullups = data.maxPullups !== undefined;
  const hasPushups = data.maxPushups !== undefined;
  if (hasPullups || hasPushups) {
    const enduranceIssues: string[] = [];
    if (hasPullups && data.maxPullups! < 3) enduranceIssues.push(`${data.maxPullups} pull-ups`);
    if (hasPushups && data.maxPushups! < 10) enduranceIssues.push(`${data.maxPushups} push-ups`);
    if (enduranceIssues.length > 0) {
      leaks.push({
        id: 'upper-body-endurance',
        title: 'Upper Body Endurance Leak',
        description: `Low muscular endurance: ${enduranceIssues.join(' and ')}. Relative bodyweight strength needs development.`,
        severity: (hasPullups && data.maxPullups! === 0) || (hasPushups && data.maxPushups! < 5) ? 'critical' : 'warning',
        metric: enduranceIssues.join(', '),
        recommendation: 'Implement greasing-the-groove: multiple submaximal sets throughout the day. Add band-assisted pull-ups and push-up progressions. Target bodyweight mastery before loading.',
      });
    }
  }

  // Single-Leg Asymmetry: one pistol passes, other fails
  if (data.pistolSquatLeft !== undefined && data.pistolSquatRight !== undefined) {
    if (data.pistolSquatLeft !== data.pistolSquatRight) {
      const weakSide = data.pistolSquatLeft === 'no' ? 'left' : 'right';
      leaks.push({
        id: 'single-leg-asymmetry',
        title: 'Single-Leg Asymmetry',
        description: `Pistol squat asymmetry detected: ${weakSide} leg cannot perform the movement. Unilateral deficit increases injury risk.`,
        severity: 'warning',
        metric: `Weak: ${weakSide}`,
        recommendation: `Focus on single-leg work for the ${weakSide} side: Bulgarian split squats, single-leg RDLs, and pistol squat progressions. Always train the weaker side first.`,
      });
    }
  }

  return { leaks, skippedAreas };
}

function calculateScores(data: AuditData): AuditResults['scores'] {
  const hasStrength = !!(data.backSquat && data.deadlift && data.weight);
  const effectiveMileTime = data.mileRunTime || convertCardioToMileEquivalent(data.cardioTest, data.cardioTime);
  const hasFrontSquat = !!(data.frontSquat && data.backSquat);
  const hasPress = !!(data.strictPress && data.weight);

  let strengthScore = hasStrength
    ? Math.min(100, ((data.backSquat! + data.deadlift!) / data.weight! / 4) * 100)
    : 50;

  let enduranceScore = effectiveMileTime
    ? Math.min(100, Math.max(0, 100 - ((effectiveMileTime / 60) - 5) * 15))
    : 50;

  let mobilityScore = hasFrontSquat
    ? Math.min(100, (data.frontSquat! / data.backSquat!) * 100 + 15)
    : 50;

  let powerScore = hasPress
    ? Math.min(100, (data.strictPress! / data.weight!) * 150)
    : 50;

  let stabilityScore = hasFrontSquat
    ? Math.min(100, (data.frontSquat! / data.backSquat!) * 110)
    : 50;

  // === Movement Screen Score Adjustments ===

  // Mobility adjustments
  if (data.toeTouch !== undefined) {
    if (data.toeTouch === 2) mobilityScore = Math.min(100, mobilityScore + 20);
    else if (data.toeTouch === 1) mobilityScore = Math.min(100, mobilityScore + 10);
  }
  if (data.heelSit === 'pass') mobilityScore = Math.min(100, mobilityScore + 10);
  if (data.deepSquat === 'pass') mobilityScore = Math.min(100, mobilityScore + 10);
  if (data.overheadReach === 'pass') mobilityScore = Math.min(100, mobilityScore + 10);

  // Power adjustments (broad jump)
  if (data.broadJumpFeet !== undefined) {
    if (data.broadJumpFeet > 8) powerScore = Math.min(100, powerScore + 15);
    else if (data.broadJumpFeet > 6) powerScore = Math.min(100, powerScore + 10);
  }

  // Stability adjustments (dead hang + L-sit)
  if (data.deadHangSeconds !== undefined) {
    if (data.deadHangSeconds > 60) stabilityScore = Math.min(100, stabilityScore + 15);
    else if (data.deadHangSeconds > 30) stabilityScore = Math.min(100, stabilityScore + 10);
  }
  if (data.lSitSeconds !== undefined) {
    if (data.lSitSeconds > 30) stabilityScore = Math.min(100, stabilityScore + 15);
    else if (data.lSitSeconds > 15) stabilityScore = Math.min(100, stabilityScore + 10);
  }

  // Endurance adjustments (pull-ups + push-ups)
  if (data.maxPullups !== undefined) {
    if (data.maxPullups > 15) enduranceScore = Math.min(100, enduranceScore + 15);
    else if (data.maxPullups > 8) enduranceScore = Math.min(100, enduranceScore + 10);
  }
  if (data.maxPushups !== undefined) {
    if (data.maxPushups > 30) enduranceScore = Math.min(100, enduranceScore + 15);
    else if (data.maxPushups > 15) enduranceScore = Math.min(100, enduranceScore + 10);
  }

  // Pistol squats: both pass = +15 mobility/stability
  if (data.pistolSquatLeft === 'yes' && data.pistolSquatRight === 'yes') {
    mobilityScore = Math.min(100, mobilityScore + 15);
    stabilityScore = Math.min(100, stabilityScore + 15);
  } else if (data.pistolSquatLeft === 'yes' || data.pistolSquatRight === 'yes') {
    mobilityScore = Math.min(100, mobilityScore + 5);
    stabilityScore = Math.min(100, stabilityScore + 5);
  }

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

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
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

        // Partial movement data note
        const movementKeys: (keyof AuditData)[] = ['broadJumpFeet', 'deadHangSeconds', 'toeTouch', 'heelSit', 'deepSquat', 'overheadReach', 'maxPullups', 'maxPushups', 'lSitSeconds', 'pistolSquatLeft'];
        const completedMovementTests = movementKeys.filter(k => fullData[k] !== undefined).length;
        if (completedMovementTests > 0 && completedMovementTests < 3) {
          skippedAreas.push('Limited movement data — scores reflect partial assessment');
        }

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
    }),
    {
      name: 'vault-audit-data',
    }
  )
);
