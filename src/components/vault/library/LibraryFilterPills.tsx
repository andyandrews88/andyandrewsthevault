import { ResourceCategory, ResourceType } from "@/types/resources";

interface LibraryFilterPillsProps {
  selectedType: ResourceType | 'all';
  selectedCategory: ResourceCategory | 'all' | 'new';
  onTypeChange: (type: ResourceType | 'all') => void;
  onCategoryChange: (category: ResourceCategory | 'all' | 'new') => void;
}

const typeFilters: { value: ResourceType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'spotify', label: '🎙 Podcast' },
  { value: 'pdf', label: '📄 PDF' },
  { value: 'youtube', label: '🎥 Video' },
  { value: 'article', label: '📝 Article' },
];

const categoryFilters: { value: ResourceCategory | 'all' | 'new'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new' as any, label: '🆕 New' },
  { value: 'training', label: 'Training' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'lifestyle', label: 'Lifestyle' },
];

export function LibraryFilterPills({ selectedType, selectedCategory, onTypeChange, onCategoryChange }: LibraryFilterPillsProps) {
  return (
    <div className="space-y-2">
      {/* Row 1: Content type */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
        <div className="flex items-center gap-2 w-max">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => onTypeChange(f.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                selectedType === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {/* Row 2: Category */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
        <div className="flex items-center gap-2 w-max">
          {categoryFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => onCategoryChange(f.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                selectedCategory === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
