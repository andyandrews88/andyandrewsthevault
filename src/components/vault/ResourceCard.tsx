import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Resource, categoryLabels } from "@/types/resources";
import { 
  Play, 
  FileText, 
  Headphones, 
  Download, 
  Lock,
  ExternalLink,
  Pencil,
  Trash2,
  Star
} from "lucide-react";

interface ResourceCardProps {
  resource: Resource;
  onClick: () => void;
  isLocked?: boolean;
  isAdmin?: boolean;
  isFeatured?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFeatured?: () => void;
}

const categoryVariants: Record<string, 'data' | 'success' | 'elite'> = {
  training: 'data',
  nutrition: 'success',
  lifestyle: 'elite',
};

const typeIcons: Record<string, React.ReactNode> = {
  youtube: <Play className="w-4 h-4" />,
  vimeo: <Play className="w-4 h-4" />,
  spotify: <Headphones className="w-4 h-4" />,
  apple_podcast: <Headphones className="w-4 h-4" />,
  article: <FileText className="w-4 h-4" />,
  pdf: <Download className="w-4 h-4" />,
};

export function ResourceCard({ 
  resource, 
  onClick, 
  isLocked = false, 
  isAdmin = false,
  isFeatured = false,
  onEdit,
  onDelete,
  onToggleFeatured,
}: ResourceCardProps) {
  const categoryVariant = categoryVariants[resource.category] || 'data';
  const typeIcon = typeIcons[resource.type] || <FileText className="w-4 h-4" />;
  
  const isExternalLink = resource.type === 'apple_podcast';

  const handleClick = () => {
    if (isExternalLink && resource.embedUrl) {
      window.open(resource.embedUrl, '_blank');
    } else {
      onClick();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleToggleFeatured = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFeatured?.();
  };

  return (
    <Card 
      variant="interactive" 
      className={`p-4 relative ${isLocked ? 'opacity-75' : ''} ${isFeatured ? 'ring-1 ring-accent/40' : ''}`}
      onClick={handleClick}
    >
      {/* Admin actions */}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${isFeatured ? 'text-accent' : ''}`}
            onClick={handleToggleFeatured}
            title={isFeatured ? 'Remove from featured' : 'Feature on dashboard'}
          >
            <Star className={`w-3 h-3 ${isFeatured ? 'fill-accent' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleEdit}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Header row with badges */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant={categoryVariant} className="text-xs">
          {categoryLabels[resource.category]}
        </Badge>
        <div className="flex items-center gap-1 text-muted-foreground">
          {typeIcon}
          {isExternalLink && <ExternalLink className="w-3 h-3 ml-1" />}
        </div>
      </div>

      {/* Title and description */}
      <h4 className="font-medium text-sm mb-1 line-clamp-1">{resource.title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {resource.description}
      </p>

      {/* Footer with duration/pages and lock status */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          {resource.duration || (resource.pages ? `${resource.pages} pages` : '')}
        </span>
        {isLocked && resource.isPremium && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span className="text-xs">Premium</span>
          </div>
        )}
      </div>

      {/* Lock overlay for premium content */}
      {isLocked && resource.isPremium && (
        <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="text-center p-4">
            <Lock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Join The Vault to unlock</p>
          </div>
        </div>
      )}
    </Card>
  );
}
