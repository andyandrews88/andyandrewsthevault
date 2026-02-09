import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Resource, categoryLabels, typeLabels } from "@/types/resources";
import { ExternalLink, Download, X } from "lucide-react";
import { toEmbedUrl } from "@/lib/vaultService";

interface ResourceModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

const categoryVariants: Record<string, 'data' | 'success' | 'elite'> = {
  physics: 'data',
  physiology: 'success',
  process: 'elite',
};

export function ResourceModal({ resource, isOpen, onClose }: ResourceModalProps) {
  if (!resource) return null;

  const categoryVariant = categoryVariants[resource.category] || 'data';

  const renderContent = () => {
    switch (resource.type) {
      case 'youtube':
        return (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-secondary">
            <iframe
              src={toEmbedUrl(resource.embedUrl || '', 'youtube')}
              title={resource.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case 'vimeo':
        return (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-secondary">
            <iframe
              src={toEmbedUrl(resource.embedUrl || '', 'vimeo')}
              title={resource.title}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case 'spotify':
        return (
          <div className="w-full rounded-lg overflow-hidden">
            <iframe
              src={resource.embedUrl}
              title={resource.title}
              className="w-full h-[352px]"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        );

      case 'article':
        return (
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="p-6 bg-secondary/30 rounded-lg max-h-[60vh] overflow-y-auto">
              {/* Simple markdown-like rendering */}
              {resource.content?.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.replace('# ', '')}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-semibold mt-4 mb-2">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-base font-medium mt-3 mb-1">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="text-muted-foreground ml-4">{line.replace('- ', '')}</li>;
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={i} className="font-semibold">{line.replace(/\*\*/g, '')}</p>;
                }
                if (line.trim() === '') {
                  return <br key={i} />;
                }
                return <p key={i} className="text-muted-foreground mb-2">{line}</p>;
              })}
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="text-center py-12">
            <Download className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {resource.pages} page PDF document
            </p>
            <Button variant="hero" asChild>
              <a href={resource.embedUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            </Button>
          </div>
        );

      case 'apple_podcast':
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ExternalLink className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              This episode is available on Apple Podcasts
            </p>
            <Button variant="hero" asChild>
              <a href={resource.embedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Listen on Apple Podcasts
              </a>
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={categoryVariant}>
              {categoryLabels[resource.category]}
            </Badge>
            <Badge variant="outline">
              {typeLabels[resource.type]}
            </Badge>
            {resource.duration && (
              <span className="text-xs text-muted-foreground font-mono ml-auto">
                {resource.duration}
              </span>
            )}
          </div>
          <DialogTitle>{resource.title}</DialogTitle>
          <DialogDescription>
            {resource.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
