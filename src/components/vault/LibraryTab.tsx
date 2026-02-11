import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Plus, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { resources as staticResources } from "@/data/resources";
import { Resource, ResourceCategory, ResourceType } from "@/types/resources";
import { ResourceCard } from "./ResourceCard";
import { ResourceModal } from "./ResourceModal";
import { CategoryFilter } from "./CategoryFilter";
import { ResourceEditor } from "./ResourceEditor";
import { fetchResources, createResource, updateResource, deleteResource, dbToResource, toggleResourceFeatured } from "@/lib/vaultService";
import { VaultResource, ResourceFormData } from "@/types/vaultResources";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface LibraryTabProps {
  isPremiumMember?: boolean;
  isAdmin?: boolean;
}

export function LibraryTab({ isPremiumMember = false, isAdmin = false }: LibraryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Database resources
  const [dbResources, setDbResources] = useState<VaultResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useDatabase, setUseDatabase] = useState(true);
  
  // Admin editing
  const [editingResource, setEditingResource] = useState<VaultResource | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const { isAuthenticated } = useAuthStore();

  // Load resources from database (retry when auth state changes)
  useEffect(() => {
    loadResources();
  }, [isAuthenticated]);

  async function loadResources() {
    setIsLoading(true);
    try {
      const data = await fetchResources();
      setDbResources(data);
      setUseDatabase(true);
    } catch (error) {
      console.error('Error loading resources from database:', error);
      // Fall back to static resources
      setUseDatabase(false);
    } finally {
      setIsLoading(false);
    }
  }

  // Convert and merge resources
  const allResources: Resource[] = useMemo(() => {
    if (useDatabase && dbResources.length > 0) {
      return dbResources.map(dbToResource);
    }
    return staticResources;
  }, [dbResources, useDatabase]);

  // Filter resources based on search, category, and type
  const filteredResources = useMemo(() => {
    return allResources.filter((resource) => {
      const matchesSearch = 
        searchQuery === "" ||
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        selectedCategory === 'all' || 
        resource.category === selectedCategory;

      const matchesType = 
        selectedType === 'all' ||
        resource.type === selectedType ||
        (selectedType === 'youtube' && (resource.type === 'youtube' || resource.type === 'vimeo')) ||
        (selectedType === 'spotify' && (resource.type === 'spotify' || resource.type === 'apple_podcast'));

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [allResources, searchQuery, selectedCategory, selectedType]);

  const handleResourceClick = (resource: Resource) => {
    if (!isPremiumMember && resource.isPremium) {
      return;
    }
    
    if (resource.type === 'apple_podcast') {
      window.open(resource.embedUrl, '_blank');
      return;
    }

    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResource(null);
  };

  // Admin handlers
  const handleEdit = (resource: Resource) => {
    const dbResource = dbResources.find(r => r.id === resource.id);
    if (dbResource) {
      setEditingResource(dbResource);
      setIsEditorOpen(true);
    }
  };

  const handleDelete = async (resource: Resource) => {
    if (!confirm(`Delete "${resource.title}"?`)) return;
    
    try {
      await deleteResource(resource.id);
      toast.success('Resource deleted');
      loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

  const handleToggleFeatured = async (resource: Resource) => {
    const dbResource = dbResources.find(r => r.id === resource.id);
    if (!dbResource) return;
    
    try {
      const newValue = !dbResource.is_featured;
      await toggleResourceFeatured(resource.id, newValue);
      toast.success(newValue ? 'Added to Top Recommendations' : 'Removed from Top Recommendations');
      loadResources();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update featured status');
    }
  };

  const handleSaveResource = async (data: ResourceFormData) => {
    try {
      if (editingResource) {
        await updateResource(editingResource.id, data);
        toast.success('Resource updated');
      } else {
        await createResource(data);
        toast.success('Resource created');
      }
      loadResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error('Failed to save resource');
      throw error;
    }
  };

  const totalResources = allResources.length;
  const freeResources = allResources.filter(r => !r.isPremium).length;

  // Show loading skeleton during initial fetch to prevent filtering on empty data
  if (isLoading && dbResources.length === 0) {
    return (
      <>
        <div className="text-center mb-6">
          <Badge variant="elite" className="mb-3">KNOWLEDGE BANK</Badge>
          <h2 className="text-xl md:text-2xl font-bold mb-2">Training & Education Resources</h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Access curated videos, articles, and guides covering training techniques, nutrition strategies, and lifestyle optimization.
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Knowledge Bank
            </CardTitle>
            <CardDescription>Loading resources...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-3" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {/* Page Description */}
      <div className="text-center mb-6">
        <Badge variant="elite" className="mb-3">KNOWLEDGE BANK</Badge>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Training & Education Resources</h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
          Access curated videos, articles, and guides covering training techniques, nutrition strategies, and lifestyle optimization.
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Knowledge Bank
              </CardTitle>
              <CardDescription>
                {totalResources} resources • {freeResources} free samples
                {isLoading && ' • Loading...'}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingResource(null);
                      setIsEditorOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadResources}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </>
              )}
              
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            selectedType={selectedType}
            onCategoryChange={setSelectedCategory}
            onTypeChange={setSelectedType}
          />

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredResources.length} {filteredResources.length === 1 ? 'result' : 'results'}
            </Badge>
            {!useDatabase && dbResources.length === 0 && (
              <Badge variant="secondary" className="text-xs">
                Using demo data
              </Badge>
            )}
          </div>

          {filteredResources.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => {
                const dbRes = dbResources.find(r => r.id === resource.id);
                return (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onClick={() => handleResourceClick(resource)}
                    isLocked={!isPremiumMember && resource.isPremium}
                    isAdmin={isAdmin}
                    isFeatured={dbRes?.is_featured ?? false}
                    onEdit={() => handleEdit(resource)}
                    onDelete={() => handleDelete(resource)}
                    onToggleFeatured={() => handleToggleFeatured(resource)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No resources found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ResourceModal
        resource={selectedResource}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {isAdmin && (
        <ResourceEditor
          resource={editingResource}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingResource(null);
          }}
          onSave={handleSaveResource}
        />
      )}
    </>
  );
}
