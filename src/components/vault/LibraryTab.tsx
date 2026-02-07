import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen } from "lucide-react";
import { resources as allResources } from "@/data/resources";
import { Resource, ResourceCategory, ResourceType } from "@/types/resources";
import { ResourceCard } from "./ResourceCard";
import { ResourceModal } from "./ResourceModal";
import { CategoryFilter } from "./CategoryFilter";

interface LibraryTabProps {
  isPremiumMember?: boolean;
}

export function LibraryTab({ isPremiumMember = false }: LibraryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter resources based on search, category, and type
  const filteredResources = useMemo(() => {
    return allResources.filter((resource) => {
      // Search filter
      const matchesSearch = 
        searchQuery === "" ||
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = 
        selectedCategory === 'all' || 
        resource.category === selectedCategory;

      // Type filter (group youtube/vimeo as video, spotify/apple_podcast as podcast)
      const matchesType = 
        selectedType === 'all' ||
        resource.type === selectedType ||
        (selectedType === 'youtube' && (resource.type === 'youtube' || resource.type === 'vimeo')) ||
        (selectedType === 'spotify' && (resource.type === 'spotify' || resource.type === 'apple_podcast'));

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchQuery, selectedCategory, selectedType]);

  const handleResourceClick = (resource: Resource) => {
    if (!isPremiumMember && resource.isPremium) {
      // Optionally redirect to auth or show upgrade prompt
      return;
    }
    
    // Apple podcasts open externally, don't show modal
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

  // Stats
  const totalResources = allResources.length;
  const freeResources = allResources.filter(r => !r.isPremium).length;

  return (
    <>
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
              </CardDescription>
            </div>
            
            {/* Search */}
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
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Filters */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            selectedType={selectedType}
            onCategoryChange={setSelectedCategory}
            onTypeChange={setSelectedType}
          />

          {/* Results count */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredResources.length} {filteredResources.length === 1 ? 'result' : 'results'}
            </Badge>
          </div>

          {/* Resource Grid */}
          {filteredResources.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onClick={() => handleResourceClick(resource)}
                  isLocked={!isPremiumMember && resource.isPremium}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No resources found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Modal */}
      <ResourceModal
        resource={selectedResource}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
