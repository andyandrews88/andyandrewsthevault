export type ResourceType = 'youtube' | 'vimeo' | 'spotify' | 'apple_podcast' | 'article' | 'pdf';

export type ResourceCategory = 'training' | 'nutrition' | 'lifestyle';

export type LeakTag = 
  | 'aerobic-power' 
  | 'thoracic-core' 
  | 'pressing-strength' 
  | 'posterior-chain' 
  | 'systemic-recovery';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  embedUrl?: string;
  content?: string; // Markdown content for articles
  category: ResourceCategory;
  leakTags: LeakTag[];
  duration?: string;
  pages?: number;
  isPremium: boolean;
  createdAt: string;
}

export const categoryLabels: Record<ResourceCategory, string> = {
  training: 'TRAINING',
  nutrition: 'NUTRITION',
  lifestyle: 'LIFESTYLE',
};

export const categoryDescriptions: Record<ResourceCategory, string> = {
  training: 'Movement patterns, technique, strength work',
  nutrition: 'Fuel systems, recovery protocols, eating strategies',
  lifestyle: 'Programming, sleep, stress management, habits',
};

export const typeLabels: Record<ResourceType, string> = {
  youtube: 'Video',
  vimeo: 'Video',
  spotify: 'Podcast',
  apple_podcast: 'Podcast',
  article: 'Article',
  pdf: 'PDF',
};

export const leakTagLabels: Record<LeakTag, string> = {
  'aerobic-power': 'Aerobic Power',
  'thoracic-core': 'Thoracic/Core Stability',
  'pressing-strength': 'Pressing Strength',
  'posterior-chain': 'Posterior Chain',
  'systemic-recovery': 'Systemic Recovery',
};
