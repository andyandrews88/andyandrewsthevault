import { supabase } from '@/integrations/supabase/client';
import { VaultResource, VaultPodcast, ResourceFormData, PodcastFormData } from '@/types/vaultResources';
import { Resource } from '@/types/resources';

// Convert various video URL formats to embed URLs
export function toEmbedUrl(url: string, type: 'youtube' | 'vimeo'): string {
  if (!url) return '';
  
  if (type === 'youtube') {
    // Already an embed URL
    if (url.includes('youtube.com/embed/')) return url;
    
    // Extract video ID from various formats
    let videoId = '';
    
    // youtu.be/VIDEO_ID format
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) videoId = shortMatch[1];
    
    // youtube.com/watch?v=VIDEO_ID format
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) videoId = watchMatch[1];
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  if (type === 'vimeo') {
    // Already an embed URL
    if (url.includes('player.vimeo.com/video/')) return url;
    
    // vimeo.com/VIDEO_ID format
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
  }
  
  return url;
}

// Fetch all resources from database
export async function fetchResources(): Promise<VaultResource[]> {
  const { data, error } = await supabase
    .from('vault_resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as VaultResource[];
}

// Convert database resource to frontend Resource type
export function dbToResource(dbResource: VaultResource): Resource {
  return {
    id: dbResource.id,
    title: dbResource.title,
    description: dbResource.description,
    type: dbResource.type,
    category: dbResource.category,
    embedUrl: dbResource.embed_url || undefined,
    content: dbResource.content || undefined,
    leakTags: dbResource.leak_tags as Resource['leakTags'],
    duration: dbResource.duration || undefined,
    pages: dbResource.pages || undefined,
    isPremium: dbResource.is_premium,
    createdAt: dbResource.created_at,
  };
}

// Create a new resource
export async function createResource(data: ResourceFormData): Promise<VaultResource> {
  const { data: resource, error } = await supabase
    .from('vault_resources')
    .insert({
      title: data.title,
      description: data.description,
      type: data.type,
      category: data.category,
      embed_url: data.embed_url || null,
      content: data.content || null,
      leak_tags: data.leak_tags,
      duration: data.duration || null,
      pages: data.pages || null,
      is_premium: data.is_premium,
    })
    .select()
    .single();

  if (error) throw error;
  return resource as VaultResource;
}

// Update a resource
export async function updateResource(id: string, data: Partial<ResourceFormData>): Promise<VaultResource> {
  const updateData: Record<string, unknown> = {};
  
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.embed_url !== undefined) updateData.embed_url = data.embed_url || null;
  if (data.content !== undefined) updateData.content = data.content || null;
  if (data.leak_tags !== undefined) updateData.leak_tags = data.leak_tags;
  if (data.duration !== undefined) updateData.duration = data.duration || null;
  if (data.pages !== undefined) updateData.pages = data.pages || null;
  if (data.is_premium !== undefined) updateData.is_premium = data.is_premium;

  const { data: resource, error } = await supabase
    .from('vault_resources')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return resource as VaultResource;
}

// Delete a resource
export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase
    .from('vault_resources')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Upload a file to vault-files bucket
export async function uploadFile(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('vault-files')
    .upload(path, file, { upsert: true });

  if (error) throw error;
  
  // Return the path for storage - will generate signed URL when accessing
  return data.path;
}

// Get a signed URL for a vault file (1 hour expiration)
export async function getSignedFileUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('vault-files')
    .createSignedUrl(path, 3600); // 1 hour expiration

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

// Delete a file from vault-files bucket
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('vault-files')
    .remove([path]);

  if (error) throw error;
}

// Fetch all podcasts from database
export async function fetchPodcasts(): Promise<VaultPodcast[]> {
  const { data, error } = await supabase
    .from('vault_podcasts')
    .select('*')
    .order('episode_number', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Create a new podcast
export async function createPodcast(data: PodcastFormData): Promise<VaultPodcast> {
  const { data: podcast, error } = await supabase
    .from('vault_podcasts')
    .insert({
      title: data.title,
      description: data.description,
      episode_number: data.episode_number || null,
      spotify_url: data.spotify_url || null,
      apple_url: data.apple_url || null,
      youtube_url: data.youtube_url || null,
      duration: data.duration || null,
      published_at: data.published_at || null,
      is_premium: data.is_premium,
    })
    .select()
    .single();

  if (error) throw error;
  return podcast;
}

// Update a podcast
export async function updatePodcast(id: string, data: Partial<PodcastFormData>): Promise<VaultPodcast> {
  const updateData: Record<string, unknown> = {};
  
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.episode_number !== undefined) updateData.episode_number = data.episode_number || null;
  if (data.spotify_url !== undefined) updateData.spotify_url = data.spotify_url || null;
  if (data.apple_url !== undefined) updateData.apple_url = data.apple_url || null;
  if (data.youtube_url !== undefined) updateData.youtube_url = data.youtube_url || null;
  if (data.duration !== undefined) updateData.duration = data.duration || null;
  if (data.published_at !== undefined) updateData.published_at = data.published_at || null;
  if (data.is_premium !== undefined) updateData.is_premium = data.is_premium;

  const { data: podcast, error } = await supabase
    .from('vault_podcasts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return podcast;
}

// Delete a podcast
export async function deletePodcast(id: string): Promise<void> {
  const { error } = await supabase
    .from('vault_podcasts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
