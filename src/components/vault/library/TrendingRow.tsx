import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Bookmark } from "lucide-react";
import { Resource } from "@/types/resources";
import { ContentTypeIndicator, getCtaLabel, getMetaLabel, getCategoryEmoji } from "./ContentTypeIndicator";

interface TrendingRowProps {
  resources: Resource[];
  onResourceClick: (resource: Resource) => void;
}

const badges = [
  { label: 'HOT', color: 'hsl(25 95% 53%)' },
  { label: 'TRENDING', color: 'hsl(0 72% 51%)' },
  { label: 'POPULAR', color: 'hsl(270 60% 55%)' },
];

export function TrendingRow({ resources, onResourceClick }: TrendingRowProps) {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

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
      <h2 className="text-lg font-semibold text-foreground">Trending Now</h2>
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
        <div className="flex gap-3 w-max">
          {resources.map((resource, i) => {
            const badge = badges[i % badges.length];
            const meta = getMetaLabel(resource.type, resource.duration, resource.pages);
            return (
              <div
                key={resource.id}
                onClick={() => onResourceClick(resource)}
                className="w-[200px] flex-shrink-0 rounded-lg bg-card border border-border cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-glow overflow-hidden group"
              >
                {/* Accent bar */}
                <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${badge.color}, transparent)` }} />

                <div className="p-3.5 space-y-2.5">
                  {/* Badge + emoji */}
                  <div className="flex items-center justify-between">
                    <Badge
                      className="text-[9px] font-bold tracking-widest border-0"
                      style={{ backgroundColor: badge.color + '22', color: badge.color }}
                    >
                      {badge.label}
                    </Badge>
                    <span className="text-xl">{getCategoryEmoji(resource.category)}</span>
                  </div>

                  {/* Type indicator */}
                  <ContentTypeIndicator type={resource.type} size="sm" />

                  {/* Title */}
                  <h4 className="font-medium text-sm text-foreground line-clamp-2 leading-tight font-body">
                    {resource.title}
                  </h4>

                  {/* Description */}
                  <p className="text-[11px] text-muted-foreground line-clamp-2 font-body">
                    {resource.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {meta && <span className="text-[10px] text-muted-foreground font-mono">{meta}</span>}
                      <span className="text-[10px] text-muted-foreground">{Math.floor(Math.random() * 3000 + 500)} views</span>
                    </div>
                    <button
                      onClick={(e) => toggleBookmark(resource.id, e)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${bookmarks.has(resource.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
