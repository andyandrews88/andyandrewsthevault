import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResourceCategory, ResourceType, categoryLabels } from "@/types/resources";
import { Filter, X, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BottomSheetMenu,
  BottomSheetItem,
  BottomSheetSeparator,
} from "@/components/ui/bottom-sheet-menu";

interface CategoryFilterProps {
  selectedCategory: ResourceCategory | 'all';
  selectedType: ResourceType | 'all';
  onCategoryChange: (category: ResourceCategory | 'all') => void;
  onTypeChange: (type: ResourceType | 'all') => void;
}

const categories: (ResourceCategory | 'all')[] = ['all', 'training', 'nutrition', 'lifestyle'];
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
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasFilters = selectedCategory !== 'all' || selectedType !== 'all';

  const clearFilters = () => {
    onCategoryChange('all');
    onTypeChange('all');
  };

  const activeFilterCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedType !== 'all' ? 1 : 0);

  if (isMobile) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button
            variant={hasFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setDrawerOpen(true)}
            className="gap-2"
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground gap-1">
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>

        <BottomSheetMenu open={drawerOpen} onOpenChange={setDrawerOpen} title="Filters">
          <BottomSheetSeparator label="Category" />
          {categories.map((category) => (
            <BottomSheetItem
              key={category}
              label={category === 'all' ? 'All Categories' : categoryLabels[category]}
              selected={selectedCategory === category}
              onClick={() => onCategoryChange(category)}
            />
          ))}

          <BottomSheetSeparator label="Type" />
          {types.map((type) => (
            <BottomSheetItem
              key={type}
              label={typeDisplayLabels[type]}
              selected={selectedType === type}
              onClick={() => onTypeChange(type)}
            />
          ))}

          {hasFilters && (
            <div className="px-4 pt-4">
              <Button variant="outline" className="w-full" onClick={() => { clearFilters(); setDrawerOpen(false); }}>
                <X className="w-3.5 h-3.5 mr-2" /> Clear All Filters
              </Button>
            </div>
          )}
        </BottomSheetMenu>
      </>
    );
  }

  // Desktop: keep original horizontal layout
  return (
    <div className="space-y-4">
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
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
