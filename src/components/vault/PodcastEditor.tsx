import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { VaultPodcast, PodcastFormData } from '@/types/vaultResources';

interface PodcastEditorProps {
  podcast?: VaultPodcast | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PodcastFormData) => Promise<void>;
}

export function PodcastEditor({ podcast, isOpen, onClose, onSave }: PodcastEditorProps) {
  const [formData, setFormData] = useState<PodcastFormData>({
    title: podcast?.title || '',
    description: podcast?.description || '',
    episode_number: podcast?.episode_number || undefined,
    spotify_url: podcast?.spotify_url || '',
    apple_url: podcast?.apple_url || '',
    youtube_url: podcast?.youtube_url || '',
    duration: podcast?.duration || '',
    is_premium: podcast?.is_premium || false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving podcast:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{podcast ? 'Edit Podcast Episode' : 'Add New Podcast Episode'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Episode title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the episode"
              rows={3}
            />
          </div>

          {/* Episode number and duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="episode_number">Episode Number</Label>
              <Input
                id="episode_number"
                type="number"
                value={formData.episode_number || ''}
                onChange={(e) => setFormData({ ...formData, episode_number: parseInt(e.target.value) || undefined })}
                placeholder="e.g., 42"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 45:00"
              />
            </div>
          </div>

          {/* Spotify URL */}
          <div className="space-y-2">
            <Label htmlFor="spotify_url">Spotify URL</Label>
            <Input
              id="spotify_url"
              value={formData.spotify_url || ''}
              onChange={(e) => setFormData({ ...formData, spotify_url: e.target.value })}
              placeholder="https://open.spotify.com/episode/..."
            />
          </div>

          {/* Apple Podcasts URL */}
          <div className="space-y-2">
            <Label htmlFor="apple_url">Apple Podcasts URL</Label>
            <Input
              id="apple_url"
              value={formData.apple_url || ''}
              onChange={(e) => setFormData({ ...formData, apple_url: e.target.value })}
              placeholder="https://podcasts.apple.com/..."
            />
          </div>

          {/* YouTube URL */}
          <div className="space-y-2">
            <Label htmlFor="youtube_url">YouTube URL (optional)</Label>
            <Input
              id="youtube_url"
              value={formData.youtube_url || ''}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="https://www.youtube.com/..."
            />
          </div>

          {/* Premium toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is_premium">Premium Content</Label>
            <Switch
              id="is_premium"
              checked={formData.is_premium}
              onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !formData.title || !formData.description}>
            {isSaving ? 'Saving...' : podcast ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
