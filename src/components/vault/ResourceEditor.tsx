import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { VaultResource, ResourceFormData, DbResourceType, DbResourceCategory } from '@/types/vaultResources';
import { leakTagLabels } from '@/types/resources';
import { X } from 'lucide-react';

interface ResourceEditorProps {
  resource?: VaultResource | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ResourceFormData) => Promise<void>;
}

const resourceTypes: { value: DbResourceType; label: string }[] = [
  { value: 'youtube', label: 'YouTube Video' },
  { value: 'vimeo', label: 'Vimeo Video' },
  { value: 'spotify', label: 'Spotify Podcast' },
  { value: 'apple_podcast', label: 'Apple Podcast' },
  { value: 'article', label: 'Article' },
  { value: 'pdf', label: 'PDF Document' },
];

const categories: { value: DbResourceCategory; label: string }[] = [
  { value: 'training', label: 'Training' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'lifestyle', label: 'Lifestyle' },
];

const leakTagOptions = Object.entries(leakTagLabels).map(([value, label]) => ({
  value,
  label,
}));

export function ResourceEditor({ resource, isOpen, onClose, onSave }: ResourceEditorProps) {
  const [formData, setFormData] = useState<ResourceFormData>({
    title: resource?.title || '',
    description: resource?.description || '',
    type: resource?.type || 'youtube',
    category: resource?.category || 'training',
    embed_url: resource?.embed_url || '',
    content: resource?.content || '',
    leak_tags: resource?.leak_tags || [],
    duration: resource?.duration || '',
    pages: resource?.pages || undefined,
    is_premium: resource?.is_premium || false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving resource:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLeakTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      leak_tags: prev.leak_tags.includes(tag)
        ? prev.leak_tags.filter(t => t !== tag)
        : [...prev.leak_tags, tag],
    }));
  };

  const showEmbedUrl = ['youtube', 'vimeo', 'spotify', 'apple_podcast', 'pdf'].includes(formData.type);
  const showContent = formData.type === 'article';
  const showDuration = ['youtube', 'vimeo', 'spotify', 'apple_podcast'].includes(formData.type);
  const showPages = formData.type === 'pdf';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Resource title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the resource"
              rows={3}
            />
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: DbResourceType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: DbResourceCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Embed URL */}
          {showEmbedUrl && (
            <div className="space-y-2">
              <Label htmlFor="embed_url">
                {formData.type === 'pdf' ? 'PDF URL / File Path' : 'Embed URL'}
              </Label>
              <Input
                id="embed_url"
                value={formData.embed_url || ''}
                onChange={(e) => setFormData({ ...formData, embed_url: e.target.value })}
                placeholder={formData.type === 'youtube' ? 'https://www.youtube.com/embed/...' : 'URL'}
              />
            </div>
          )}

          {/* Content for articles */}
          {showContent && (
            <div className="space-y-2">
              <Label htmlFor="content">Article Content (Markdown)</Label>
              <Textarea
                id="content"
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write article content in Markdown..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Duration and Pages */}
          <div className="grid grid-cols-2 gap-4">
            {showDuration && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 12:34"
                />
              </div>
            )}

            {showPages && (
              <div className="space-y-2">
                <Label htmlFor="pages">Number of Pages</Label>
                <Input
                  id="pages"
                  type="number"
                  value={formData.pages || ''}
                  onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 15"
                />
              </div>
            )}
          </div>

          {/* Leak Tags */}
          <div className="space-y-2">
            <Label>Leak Tags (for recommendations)</Label>
            <div className="flex flex-wrap gap-2">
              {leakTagOptions.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={formData.leak_tags.includes(tag.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleLeakTag(tag.value)}
                >
                  {tag.label}
                  {formData.leak_tags.includes(tag.value) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
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
            {isSaving ? 'Saving...' : resource ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
