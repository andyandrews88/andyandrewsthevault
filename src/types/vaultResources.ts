// Database types for vault resources
export type DbResourceType = 'youtube' | 'vimeo' | 'spotify' | 'apple_podcast' | 'article' | 'pdf';
export type DbResourceCategory = 'training' | 'nutrition' | 'lifestyle';

export interface VaultResource {
  id: string;
  title: string;
  description: string;
  type: DbResourceType;
  category: DbResourceCategory;
  embed_url: string | null;
  content: string | null;
  leak_tags: string[];
  duration: string | null;
  pages: number | null;
  is_premium: boolean;
  file_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface VaultPodcast {
  id: string;
  title: string;
  description: string;
  episode_number: number | null;
  spotify_url: string | null;
  apple_url: string | null;
  youtube_url: string | null;
  duration: string | null;
  published_at: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

// Form types for creating/editing resources
export interface ResourceFormData {
  title: string;
  description: string;
  type: DbResourceType;
  category: DbResourceCategory;
  embed_url?: string;
  content?: string;
  leak_tags: string[];
  duration?: string;
  pages?: number;
  is_premium: boolean;
}

export interface PodcastFormData {
  title: string;
  description: string;
  episode_number?: number;
  spotify_url?: string;
  apple_url?: string;
  youtube_url?: string;
  duration?: string;
  published_at?: string;
  is_premium: boolean;
}
