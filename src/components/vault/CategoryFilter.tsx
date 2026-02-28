import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResourceCategory, ResourceType, categoryLabels } from "@/types/resources";
import { Filter, X, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

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

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Filters</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Category</p>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => onCategoryChange(category)}
                      className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
                    >
                      <span className={selectedCategory === category ? "font-semibold text-foreground" : "text-muted-foreground"}>
                        {category === 'all' ? 'All Categories' : categoryLabels[category]}
                      </span>
                      {selectedCategory === category && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Type</p>
                <div className="space-y-1">
                  {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => onTypeChange(type)}
                      className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
                    >
                      <span className={selectedType === type ? "font-semibold text-foreground" : "text-muted-foreground"}>
                        {typeDisplayLabels[type]}
                      </span>
                      {selectedType === type && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <Button variant="outline" className="w-full" onClick={() => { clearFilters(); setDrawerOpen(false); }}>
                  <X className="w-3.5 h-3.5 mr-2" /> Clear All Filters
                </Button>
              )}
            </div>
          </DrawerContent>
        </Drawer>
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
