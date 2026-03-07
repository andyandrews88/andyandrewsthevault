import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Bookmark } from "lucide-react";
import { Resource, ResourceCategory, categoryLabels } from "@/types/resources";
import { getCategoryColor, getCategoryEmoji, getMetaLabel, typeConfig } from "./ContentTypeIndicator";

interface CategorySectionProps {
  category: ResourceCategory;
  resources: Resource[];
  onResourceClick: (resource: Resource) => void;
  onSeeAll: () => void;
}

function isNew(createdAt: string): boolean {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

export function CategorySection({ category, resources, onResourceClick, onSeeAll }: CategorySectionProps) {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const color = getCategoryColor(category);

  if (resources.length === 0) return null;

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            className="text-[10px] font-bold tracking-wider border"
            style={{ borderColor: color, color, backgroundColor: 'transparent' }}
          >
            {getCategoryEmoji(category)} {categoryLabels[category]}
          </Badge>
        </div>
        <button onClick={onSeeAll} className="text-xs text-primary hover:underline font-body">
          See all →
        </button>
      </div>

      {/* Compact list */}
      <div className="space-y-1">
        {resources.slice(0, 5).map((resource) => {
          const config = typeConfig[resource.type] || typeConfig.article;
          const meta = getMetaLabel(resource.type, resource.duration, resource.pages);
          return (
            <div
              key={resource.id}
              onClick={() => onResourceClick(resource)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 hover:bg-card border border-transparent hover:border-border group"
            >
              <span className="text-base flex-shrink-0">{getCategoryEmoji(category)}</span>
              <span className="flex-shrink-0 text-muted-foreground">{config.icon}</span>
              <span className="text-sm font-body text-foreground truncate flex-1 group-hover:text-primary transition-colors">
                {resource.title}
              </span>
              {isNew(resource.createdAt) && (
                <Badge className="bg-primary/15 text-primary text-[9px] font-bold border-0">NEW</Badge>
              )}
              {meta && (
                <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{meta}</span>
              )}
              <button
                onClick={(e) => toggleBookmark(resource.id, e)}
                className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarks.has(resource.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
