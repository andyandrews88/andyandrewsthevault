import { create } from 'zustand';

export interface AuditData {
  // Biometrics
  weight: number;
  age: number;
  height: number;
  
  // Big 4 Ratios
  backSquat: number;
  frontSquat: number;
  strictPress: number;
  deadlift: number;
  
  // Engine Check
  mileRunTime: number; // in seconds
  
  // Lifestyle Diagnostic
  sleep: '<6' | '6-7' | '7-8' | '8+';
  protein: 'yes' | 'no' | 'unsure';
  stress: number; // 1-10 scale
  experience: '<1' | '1-3' | '3-5' | '5+';
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

// Logic gates for leak detection
function detectLeaks(data: AuditData): Leak[] {
  const leaks: Leak[] = [];
  
  // Front Squat < 85% of Back Squat = Thoracic/Core Stability Leak
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

  // Mile Run > 9:00 with high squat = Aerobic Power Leak
  const mileMinutes = data.mileRunTime / 60;
  const bodyweightSquatRatio = data.backSquat / data.weight;
  if (mileMinutes > 9 && bodyweightSquatRatio > 1.5) {
    leaks.push({
      id: 'aerobic-power',
      title: 'Aerobic Power Leak',
      description: `Mile time of ${formatTime(data.mileRunTime)} with strong squat numbers indicates underdeveloped aerobic capacity`,
      severity: mileMinutes > 10 ? 'critical' : 'warning',
      metric: formatTime(data.mileRunTime),
      recommendation: 'Implement Zone 2 conditioning 3-4x weekly. Add tempo intervals and long aerobic pieces to develop engine without sacrificing strength.',
    });
  }

  // Strict Press < 65% of Bodyweight = Pressing Strength Leak
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

  // Deadlift < 2x Bodyweight = Posterior Chain Leak
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

  // Systemic Recovery Leak: Sleep <6 AND Stress >8
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

  return leaks;
}

function calculateScores(data: AuditData): AuditResults['scores'] {
  // Normalize metrics to 0-100 scale based on benchmarks
  const strengthScore = Math.min(100, ((data.backSquat + data.deadlift) / data.weight / 4) * 100);
  const enduranceScore = Math.min(100, Math.max(0, 100 - ((data.mileRunTime / 60) - 5) * 15));
  const mobilityScore = Math.min(100, (data.frontSquat / data.backSquat) * 100 + 15);
  const powerScore = Math.min(100, (data.strictPress / data.weight) * 150);
  const stabilityScore = Math.min(100, (data.frontSquat / data.backSquat) * 110);

  return {
    strength: Math.round(strengthScore),
    endurance: Math.round(enduranceScore),
    mobility: Math.round(mobilityScore),
    power: Math.round(powerScore),
    stability: Math.round(stabilityScore),
  };
}

function determineTier(scores: AuditResults['scores'], experience?: AuditData['experience']): AuditResults['tier'] {
  // Foundation override for beginners regardless of scores
  if (experience === '<1') {
    return 'foundation';
  }
  
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
    
    const leaks = detectLeaks(fullData);
    const scores = calculateScores(fullData);
    const tier = determineTier(scores, fullData.experience);
    const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5);

    // Check for foundation recommendation due to experience
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
      }
    });
  },

  reset: () => set({
    currentStep: 0,
    data: {},
    results: null,
  }),
}));
