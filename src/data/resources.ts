import { Resource } from '@/types/resources';

export const resources: Resource[] = [
  // PHYSICS - Movement Blueprints
  {
    id: 'physics-1',
    title: 'Back Squat Mechanics',
    description: 'Complete breakdown of optimal squat mechanics for force production and joint health.',
    type: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'physics',
    leakTags: [],
    duration: '12:34',
    isPremium: false,
    createdAt: '2024-01-15',
  },
  {
    id: 'physics-2',
    title: 'Front Rack Mobility',
    description: 'Address thoracic restrictions and wrist mobility for a solid front rack position.',
    type: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'physics',
    leakTags: ['thoracic-core'],
    duration: '8:22',
    isPremium: true,
    createdAt: '2024-01-20',
  },
  {
    id: 'physics-3',
    title: 'Deadlift Position Guide',
    description: 'PDF guide covering setup, bracing, and execution for optimal deadlift mechanics.',
    type: 'pdf',
    embedUrl: '/resources/deadlift-guide.pdf',
    category: 'physics',
    leakTags: ['posterior-chain'],
    duration: undefined,
    pages: 15,
    isPremium: true,
    createdAt: '2024-02-01',
  },
  {
    id: 'physics-4',
    title: 'Hip Hinge Mastery',
    description: 'Master the hip hinge pattern for deadlifts, RDLs, and all pulling movements.',
    type: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'physics',
    leakTags: ['posterior-chain'],
    duration: '15:45',
    isPremium: true,
    createdAt: '2024-02-10',
  },
  {
    id: 'physics-5',
    title: 'Core Stability Series',
    description: 'Build bulletproof core stability for heavy compound lifts.',
    type: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'physics',
    leakTags: ['thoracic-core'],
    duration: '22:10',
    isPremium: true,
    createdAt: '2024-02-15',
  },
  {
    id: 'physics-6',
    title: 'Pressing Progression Blueprint',
    description: 'Systematic approach to building pressing strength from foundation to performance.',
    type: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'physics',
    leakTags: ['pressing-strength'],
    duration: '18:30',
    isPremium: true,
    createdAt: '2024-02-20',
  },

  // PHYSIOLOGY - Engine & Recovery
  {
    id: 'physiology-1',
    title: 'Zone 2 Protocol',
    description: 'The definitive guide to building aerobic capacity without sacrificing strength gains.',
    type: 'pdf',
    embedUrl: '/resources/zone2-protocol.pdf',
    category: 'physiology',
    leakTags: ['aerobic-power'],
    pages: 8,
    isPremium: false,
    createdAt: '2024-01-25',
  },
  {
    id: 'physiology-2',
    title: 'Aerobic Power Deep-Dive',
    description: 'Podcast episode exploring the science of engine development for hybrid athletes.',
    type: 'spotify',
    embedUrl: 'https://open.spotify.com/embed/episode/1234567890',
    category: 'physiology',
    leakTags: ['aerobic-power'],
    duration: '45:00',
    isPremium: true,
    createdAt: '2024-02-05',
  },
  {
    id: 'physiology-3',
    title: 'Recovery Protocol',
    description: 'Complete framework for optimizing recovery between training sessions.',
    type: 'article',
    content: `# Recovery Protocol Framework

## The Recovery Hierarchy

1. **Sleep Quality** - The foundation of all recovery
2. **Nutrition Timing** - Strategic fueling for adaptation
3. **Active Recovery** - Movement for restoration
4. **Stress Management** - Parasympathetic activation

## Implementation Guide

Recovery is not passive. It requires intentional protocols that match your training demands...

### Sleep Optimization
- Consistent sleep/wake times
- Temperature regulation (65-68°F)
- Light exposure management
- Pre-sleep wind-down routine

### Nutrition Timing
- Post-workout protein within 2 hours
- Carbohydrate replenishment based on glycolytic demand
- Hydration targets: 0.5oz per lb bodyweight minimum

This framework should be adapted based on your individual recovery capacity and training phase.`,
    category: 'physiology',
    leakTags: ['systemic-recovery'],
    isPremium: true,
    createdAt: '2024-02-12',
  },
  {
    id: 'physiology-4',
    title: 'Stress Management Guide',
    description: 'Managing allostatic load for sustainable performance gains.',
    type: 'apple_podcast',
    embedUrl: 'https://podcasts.apple.com/us/podcast/hpa-training-podcast/id1538797196',
    category: 'physiology',
    leakTags: ['systemic-recovery'],
    duration: '38:00',
    isPremium: true,
    createdAt: '2024-02-18',
  },
  {
    id: 'physiology-5',
    title: 'Engine Building 101',
    description: 'Introduction to aerobic and anaerobic energy system development.',
    type: 'article',
    content: `# Engine Building 101

Understanding how to build your engine without compromising strength is critical for hybrid athletes.

## Energy Systems Overview

- **Aerobic System**: Long-duration, sustainable output
- **Glycolytic System**: High-intensity, 30s-3min efforts
- **Phosphagen System**: Maximum power, <10s efforts

## The Interference Effect

Learn how to structure your training to minimize the interference between strength and endurance...`,
    category: 'physiology',
    leakTags: ['aerobic-power'],
    isPremium: false,
    createdAt: '2024-03-01',
  },

  // PROCESS - Programming & Lifestyle
  {
    id: 'process-1',
    title: 'Periodization Principles',
    description: 'Strategic programming principles for long-term progress.',
    type: 'article',
    content: `# Periodization Principles

Effective periodization is about managing stress and recovery across multiple timescales.

## Block Periodization Model

### Accumulation Phase (4-6 weeks)
- High volume, moderate intensity
- Building work capacity

### Transmutation Phase (3-4 weeks)
- Reduced volume, increased intensity
- Converting capacity to strength

### Realization Phase (1-2 weeks)
- Peak performance
- Minimal volume, maximal expression

## Application Guidelines

Your periodization model should match your goals, experience level, and recovery capacity.`,
    category: 'process',
    leakTags: [],
    isPremium: true,
    createdAt: '2024-02-08',
  },
  {
    id: 'process-2',
    title: 'Decision Fatigue & Nutrition',
    description: 'How decision fatigue impacts food choices and training adherence.',
    type: 'spotify',
    embedUrl: 'https://open.spotify.com/embed/episode/0987654321',
    category: 'process',
    leakTags: ['systemic-recovery'],
    duration: '32:00',
    isPremium: true,
    createdAt: '2024-02-22',
  },
  {
    id: 'process-3',
    title: 'Foundation Track Overview',
    description: 'Complete walkthrough of the Foundation training track and who it\'s for.',
    type: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'process',
    leakTags: [],
    duration: '25:00',
    isPremium: false,
    createdAt: '2024-03-05',
  },
  {
    id: 'process-4',
    title: 'Performance Track Strategy',
    description: 'Advanced programming strategies for the Performance track.',
    type: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'process',
    leakTags: [],
    duration: '28:15',
    isPremium: true,
    createdAt: '2024-03-10',
  },
];

// Helper function to get resources by leak tag
export function getResourcesByLeakTag(leakTag: string): Resource[] {
  return resources.filter(resource => 
    resource.leakTags.includes(leakTag as any)
  );
}

// Helper function to get resources by category
export function getResourcesByCategory(category: string): Resource[] {
  return resources.filter(resource => resource.category === category);
}

// Get recommended resources based on detected leaks
export function getRecommendedResources(leakIds: string[]): Resource[] {
  const leakToTagMap: Record<string, string> = {
    'aerobic-power': 'aerobic-power',
    'thoracic-core': 'thoracic-core',
    'pressing-strength': 'pressing-strength',
    'posterior-chain': 'posterior-chain',
    'systemic-recovery': 'systemic-recovery',
  };

  const relevantTags = leakIds
    .map(id => leakToTagMap[id])
    .filter(Boolean);

  const recommended = resources.filter(resource =>
    resource.leakTags.some(tag => relevantTags.includes(tag))
  );

  // Return unique resources, prioritizing non-premium first
  return recommended
    .sort((a, b) => Number(a.isPremium) - Number(b.isPremium))
    .slice(0, 6);
}
