import { Resource, categoryLabels } from "@/types/resources";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, FileText, Headphones, Download, Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface RecommendedResourcesProps {
  resources: Resource[];
}

const categoryVariants: Record<string, 'data' | 'success' | 'elite'> = {
  physics: 'data',
  physiology: 'success',
  process: 'elite',
};

const typeIcons: Record<string, React.ReactNode> = {
  youtube: <Play className="w-4 h-4" />,
  vimeo: <Play className="w-4 h-4" />,
  spotify: <Headphones className="w-4 h-4" />,
  apple_podcast: <Headphones className="w-4 h-4" />,
  article: <FileText className="w-4 h-4" />,
  pdf: <Download className="w-4 h-4" />,
};

export function RecommendedResources({ resources }: RecommendedResourcesProps) {
  if (resources.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Recommended for You</h3>
          <p className="text-sm text-muted-foreground">
            Resources mapped to your identified leaks
          </p>
        </div>
        <Link to="/vault">
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.slice(0, 6).map((resource) => {
          const categoryVariant = categoryVariants[resource.category] || 'data';
          const typeIcon = typeIcons[resource.type] || <FileText className="w-4 h-4" />;
          
          return (
            <Card 
              key={resource.id}
              variant="interactive" 
              className={`p-4 relative ${resource.isPremium ? 'opacity-80' : ''}`}
            >
              {/* Header row with badges */}
              <div className="flex items-center justify-between mb-3">
                <Badge variant={categoryVariant} className="text-xs">
                  {categoryLabels[resource.category]}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {typeIcon}
                </div>
              </div>

              {/* Title and description */}
              <h4 className="font-medium text-sm mb-1 line-clamp-1">{resource.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {resource.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">
                  {resource.duration || (resource.pages ? `${resource.pages} pages` : '')}
                </span>
                {resource.isPremium && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span className="text-xs">Premium</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
