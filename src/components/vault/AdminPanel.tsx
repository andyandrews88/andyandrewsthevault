import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Upload,
  FileText,
  Video,
  Headphones,
  Shield
} from 'lucide-react';
import { VaultResource, VaultPodcast, ResourceFormData, PodcastFormData } from '@/types/vaultResources';
import { 
  fetchResources, 
  createResource, 
  updateResource, 
  deleteResource,
  fetchPodcasts,
  createPodcast,
  updatePodcast,
  deletePodcast,
  uploadFile
} from '@/lib/vaultService';
import { ResourceEditor } from './ResourceEditor';
import { PodcastEditor } from './PodcastEditor';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function AdminPanel() {
  const [resources, setResources] = useState<VaultResource[]>([]);
  const [podcasts, setPodcasts] = useState<VaultPodcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor states
  const [editingResource, setEditingResource] = useState<VaultResource | null>(null);
  const [isResourceEditorOpen, setIsResourceEditorOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<VaultPodcast | null>(null);
  const [isPodcastEditorOpen, setIsPodcastEditorOpen] = useState(false);
  
  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'resource' | 'podcast'; id: string; title: string } | null>(null);

  // File upload
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [resourcesData, podcastsData] = await Promise.all([
        fetchResources(),
        fetchPodcasts()
      ]);
      setResources(resourcesData);
      setPodcasts(podcastsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }

  // Resource handlers
  const handleSaveResource = async (data: ResourceFormData) => {
    try {
      if (editingResource) {
        await updateResource(editingResource.id, data);
        toast.success('Resource updated');
      } else {
        await createResource(data);
        toast.success('Resource created');
      }
      loadData();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error('Failed to save resource');
      throw error;
    }
  };

  const handleDeleteResource = async () => {
    if (!deleteTarget || deleteTarget.type !== 'resource') return;
    try {
      await deleteResource(deleteTarget.id);
      toast.success('Resource deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Podcast handlers
  const handleSavePodcast = async (data: PodcastFormData) => {
    try {
      if (editingPodcast) {
        await updatePodcast(editingPodcast.id, data);
        toast.success('Podcast updated');
      } else {
        await createPodcast(data);
        toast.success('Podcast created');
      }
      loadData();
    } catch (error) {
      console.error('Error saving podcast:', error);
      toast.error('Failed to save podcast');
      throw error;
    }
  };

  const handleDeletePodcast = async () => {
    if (!deleteTarget || deleteTarget.type !== 'podcast') return;
    try {
      await deletePodcast(deleteTarget.id);
      toast.success('Podcast deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting podcast:', error);
      toast.error('Failed to delete podcast');
    } finally {
      setDeleteTarget(null);
    }
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const url = await uploadFile(file, fileName);
      
      // Create a PDF resource with the uploaded file
      await createResource({
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: 'Uploaded PDF document',
        type: 'pdf',
        category: 'process',
        embed_url: url,
        leak_tags: [],
        is_premium: false,
      });
      
      toast.success('File uploaded and resource created');
      loadData();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Filter resources by search
  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPodcasts = podcasts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'youtube':
      case 'vimeo':
        return <Video className="w-4 h-4" />;
      case 'spotify':
      case 'apple_podcast':
        return <Headphones className="w-4 h-4" />;
      case 'pdf':
      case 'article':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle>Admin Panel</CardTitle>
        </div>
        <CardDescription>Manage all Vault content</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setEditingResource(null);
              setIsResourceEditorOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingPodcast(null);
              setIsPodcastEditorOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Podcast
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" asChild disabled={isUploading}>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload PDF'}
              </span>
            </Button>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources and podcasts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Content tabs */}
        <Tabs defaultValue="resources">
          <TabsList>
            <TabsTrigger value="resources">
              Resources ({filteredResources.length})
            </TabsTrigger>
            <TabsTrigger value="podcasts">
              Podcasts ({filteredPodcasts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="mt-4">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : filteredResources.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No resources found</p>
            ) : (
              <div className="space-y-2">
                {filteredResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-secondary">
                        {getTypeIcon(resource.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{resource.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {resource.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {resource.type}
                          </Badge>
                          {resource.is_premium && (
                            <Badge variant="elite" className="text-xs">Premium</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingResource(resource);
                          setIsResourceEditorOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget({ type: 'resource', id: resource.id, title: resource.title })}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="podcasts" className="mt-4">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : filteredPodcasts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No podcasts found</p>
            ) : (
              <div className="space-y-2">
                {filteredPodcasts.map((podcast) => (
                  <div
                    key={podcast.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-secondary">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">
                          {podcast.episode_number && `Ep ${podcast.episode_number}: `}
                          {podcast.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {podcast.duration && (
                            <span className="text-xs text-muted-foreground">{podcast.duration}</span>
                          )}
                          {podcast.is_premium && (
                            <Badge variant="elite" className="text-xs">Premium</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPodcast(podcast);
                          setIsPodcastEditorOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget({ type: 'podcast', id: podcast.id, title: podcast.title })}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Resource Editor Modal */}
      <ResourceEditor
        resource={editingResource}
        isOpen={isResourceEditorOpen}
        onClose={() => {
          setIsResourceEditorOpen(false);
          setEditingResource(null);
        }}
        onSave={handleSaveResource}
      />

      {/* Podcast Editor Modal */}
      <PodcastEditor
        podcast={editingPodcast}
        isOpen={isPodcastEditorOpen}
        onClose={() => {
          setIsPodcastEditorOpen(false);
          setEditingPodcast(null);
        }}
        onSave={handleSavePodcast}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTarget?.type === 'resource' ? handleDeleteResource : handleDeletePodcast}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
