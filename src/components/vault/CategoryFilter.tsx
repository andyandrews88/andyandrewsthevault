import { Button } from "@/components/ui/button";
import { ResourceCategory, ResourceType, categoryLabels, typeLabels } from "@/types/resources";
import { Filter, X } from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: ResourceCategory | 'all';
  selectedType: ResourceType | 'all';
  onCategoryChange: (category: ResourceCategory | 'all') => void;
  onTypeChange: (type: ResourceType | 'all') => void;
}

const categories: (ResourceCategory | 'all')[] = ['all', 'physics', 'physiology', 'process'];
const types: (ResourceType | 'all')[] = ['all', 'youtube', 'spotify', 'article', 'pdf'];

const typeDisplayLabels: Record<string, string> = {
  all: 'All Types',
  youtube: 'Video',
  vimeo: 'Video',
  spotify: 'Podcast',
  apple_podcast: 'Podcast',
  article: 'Article',
  pdf: 'PDF',
};

export function CategoryFilter({
  selectedCategory,
  selectedType,
  onCategoryChange,
  onTypeChange,
}: CategoryFilterProps) {
  const hasFilters = selectedCategory !== 'all' || selectedType !== 'all';

  const clearFilters = () => {
    onCategoryChange('all');
    onTypeChange('all');
  };

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider shrink-0">Category</span>
        <div className="overflow-x-auto scrollbar-hide -mr-4 pr-4">
          <div className="flex items-center gap-2 w-max">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(category)}
                className="text-xs whitespace-nowrap"
              >
                {category === 'all' ? 'All' : categoryLabels[category]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider shrink-0">Type</span>
        <div className="overflow-x-auto scrollbar-hide -mr-4 pr-4">
          <div className="flex items-center gap-2 w-max">
            {types.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTypeChange(type)}
                className="text-xs whitespace-nowrap"
              >
                {typeDisplayLabels[type]}
              </Button>
            ))}
            
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-muted-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
