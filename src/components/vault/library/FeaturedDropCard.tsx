import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Play, Mic, FileText } from "lucide-react";
import { Resource } from "@/types/resources";
import { getCtaLabel, getMetaLabel, getCategoryColor, ContentTypeIndicator } from "./ContentTypeIndicator";

interface FeaturedDropCardProps {
  resource: Resource;
  onClick: () => void;
}

function isNew(createdAt: string): boolean {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

function getMotifIcon(type: string) {
  if (type === 'youtube' || type === 'vimeo') return <Play className="w-16 h-16 text-primary/10" />;
  if (type === 'spotify' || type === 'apple_podcast') return <Mic className="w-16 h-16 text-primary/10" />;
  return <FileText className="w-16 h-16 text-primary/10" />;
}

export function FeaturedDropCard({ resource, onClick }: FeaturedDropCardProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const catColor = getCategoryColor(resource.category);
  const meta = getMetaLabel(resource.type, resource.duration, resource.pages);

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-xl bg-card border border-border cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-glow group"
    >
      {/* Background motif */}
      <div className="absolute top-4 right-4 opacity-60 group-hover:opacity-100 transition-opacity">
        {getMotifIcon(resource.type)}
      </div>

      {/* Radial glow */}
      <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />

      <div className="relative p-5 md:p-7 space-y-4">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {isNew(resource.createdAt) && (
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold tracking-wider">
              NEW DROP
            </Badge>
          )}
          <Badge
            className="text-[10px] font-medium border"
            style={{ borderColor: catColor, color: catColor, backgroundColor: 'transparent' }}
          >
            {resource.category.toUpperCase()}
          </Badge>
          <ContentTypeIndicator type={resource.type} />
        </div>

        {/* Title + description */}
        <div className="max-w-md">
          <h3 className="text-lg md:text-xl font-bold text-foreground mb-1">
            {resource.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 font-body">
            {resource.description}
          </p>
        </div>

        {/* Meta + CTA */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {meta && <span className="text-xs text-muted-foreground font-mono">{meta}</span>}
            <span className="text-xs text-muted-foreground">2.4k views</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="rounded-full font-body text-xs"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
              {getCtaLabel(resource.type)}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
