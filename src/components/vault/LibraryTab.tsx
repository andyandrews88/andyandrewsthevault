import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw } from "lucide-react";
import { resources as staticResources } from "@/data/resources";
import { Resource, ResourceCategory, ResourceType } from "@/types/resources";
import { ResourceModal } from "./ResourceModal";
import { ResourceEditor } from "./ResourceEditor";
import { fetchResources, createResource, updateResource, deleteResource, dbToResource, toggleResourceFeatured } from "@/lib/vaultService";
import { VaultResource, ResourceFormData } from "@/types/vaultResources";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

// Library sub-components
import { LibraryHeader } from "./library/LibraryHeader";
import { LibrarySearchBar } from "./library/LibrarySearchBar";
import { LibraryFilterPills } from "./library/LibraryFilterPills";
import { FeaturedDropCard } from "./library/FeaturedDropCard";
import { TrendingRow } from "./library/TrendingRow";
import { CategorySection } from "./library/CategorySection";

interface LibraryTabProps {
  isPremiumMember?: boolean;
  isAdmin?: boolean;
}

export function LibraryTab({ isPremiumMember = false, isAdmin = false }: LibraryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all' | 'new'>('all');
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
      console.error('Error loading resources:', error);
      setUseDatabase(false);
    } finally {
      setIsLoading(false);
    }
  }

  // Convert resources
  const allResources: Resource[] = useMemo(() => {
    if (useDatabase && dbResources.length > 0) return dbResources.map(dbToResource);
    return staticResources;
  }, [dbResources, useDatabase]);

  // Is new helper
  const isNewResource = (r: Resource) => Date.now() - new Date(r.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

  // Filter resources
  const filteredResources = useMemo(() => {
    return allResources.filter((resource) => {
      const matchesSearch =
        searchQuery === "" ||
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'new' ? isNewResource(resource) : resource.category === selectedCategory);

      const matchesType =
        selectedType === 'all' ||
        resource.type === selectedType ||
        (selectedType === 'youtube' && (resource.type === 'youtube' || resource.type === 'vimeo')) ||
        (selectedType === 'spotify' && (resource.type === 'spotify' || resource.type === 'apple_podcast'));

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [allResources, searchQuery, selectedCategory, selectedType]);

  // Featured resource: first is_featured from DB, or newest
  const featuredResource = useMemo(() => {
    const featured = dbResources.find(r => r.is_featured);
    if (featured) return dbToResource(featured);
    return allResources[0] || null;
  }, [allResources, dbResources]);

  // Trending: next 6 resources (excluding featured)
  const trendingResources = useMemo(() => {
    return allResources.filter(r => r.id !== featuredResource?.id).slice(0, 6);
  }, [allResources, featuredResource]);

  // Category resources
  const trainingResources = useMemo(() => filteredResources.filter(r => r.category === 'training'), [filteredResources]);
  const nutritionResources = useMemo(() => filteredResources.filter(r => r.category === 'nutrition'), [filteredResources]);
  const lifestyleResources = useMemo(() => filteredResources.filter(r => r.category === 'lifestyle'), [filteredResources]);

  const handleResourceClick = (resource: Resource) => {
    if (!isPremiumMember && resource.isPremium) return;
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

  // Determine if we should show discovery layout (no filters active)
  const isDiscoveryMode = searchQuery === '' && selectedCategory === 'all' && selectedType === 'all';

  // Loading state
  if (isLoading && dbResources.length === 0) {
    return (
      <div className="space-y-6">
        <LibraryHeader totalResources={0} />
        <div className="space-y-4">
          <Skeleton className="h-11 w-full rounded-full" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="flex gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 w-[200px] rounded-lg flex-shrink-0" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Admin actions */}
      <div className="flex items-start justify-between">
        <LibraryHeader totalResources={allResources.length} />
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => { setEditingResource(null); setIsEditorOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadResources}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <LibrarySearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Filter pills */}
      <LibraryFilterPills
        selectedType={selectedType}
        selectedCategory={selectedCategory}
        onTypeChange={setSelectedType}
        onCategoryChange={setSelectedCategory}
      />

      {/* Results count when filtering */}
      {!isDiscoveryMode && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {filteredResources.length} {filteredResources.length === 1 ? 'result' : 'results'}
          </Badge>
          {!useDatabase && dbResources.length === 0 && (
            <Badge variant="secondary" className="text-xs">Using demo data</Badge>
          )}
        </div>
      )}

      {/* Discovery layout */}
      {isDiscoveryMode && featuredResource && (
        <>
          <FeaturedDropCard resource={featuredResource} onClick={() => handleResourceClick(featuredResource)} />
          <TrendingRow resources={trendingResources} onResourceClick={handleResourceClick} />
        </>
      )}

      {/* Category sections */}
      {(['training', 'nutrition', 'lifestyle'] as ResourceCategory[]).map((cat) => {
        const catResources = cat === 'training' ? trainingResources : cat === 'nutrition' ? nutritionResources : lifestyleResources;
        if (catResources.length === 0) return null;
        return (
          <CategorySection
            key={cat}
            category={cat}
            resources={catResources}
            onResourceClick={handleResourceClick}
            onSeeAll={() => setSelectedCategory(cat)}
          />
        );
      })}

      {/* Empty state */}
      {filteredResources.length === 0 && !isDiscoveryMode && (
        <div className="text-center py-16">
          <p className="text-muted-foreground font-body">No resources found matching your filters.</p>
        </div>
      )}

      <ResourceModal
        resource={selectedResource}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {isAdmin && (
        <ResourceEditor
          resource={editingResource}
          isOpen={isEditorOpen}
          onClose={() => { setIsEditorOpen(false); setEditingResource(null); }}
          onSave={handleSaveResource}
        />
      )}
    </div>
  );
}
