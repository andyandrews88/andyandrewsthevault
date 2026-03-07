import { Play, FileText, Headphones, Mic } from "lucide-react";
import { ResourceType } from "@/types/resources";

interface ContentTypeIndicatorProps {
  type: ResourceType;
  duration?: string;
  pages?: number;
  size?: 'sm' | 'md';
}

const typeConfig: Record<ResourceType, { icon: React.ReactNode; label: string; emoji: string }> = {
  youtube: { icon: <Play className="w-3.5 h-3.5" />, label: 'Video', emoji: '🎥' },
  vimeo: { icon: <Play className="w-3.5 h-3.5" />, label: 'Video', emoji: '🎥' },
  spotify: { icon: <Mic className="w-3.5 h-3.5" />, label: 'Podcast', emoji: '🎙️' },
  apple_podcast: { icon: <Headphones className="w-3.5 h-3.5" />, label: 'Podcast', emoji: '🎙️' },
  article: { icon: <FileText className="w-3.5 h-3.5" />, label: 'Article', emoji: '📝' },
  pdf: { icon: <FileText className="w-3.5 h-3.5" />, label: 'PDF', emoji: '📄' },
};

export function getCtaLabel(type: ResourceType): string {
  if (type === 'youtube' || type === 'vimeo') return 'Watch Now →';
  if (type === 'spotify' || type === 'apple_podcast') return 'Listen Now →';
  return 'Read Now →';
}

export function getMetaLabel(type: ResourceType, duration?: string, pages?: number): string {
  if (pages) return `${pages} pages`;
  if (duration) return duration;
  if (type === 'article') return '5 min read';
  return '';
}

export function getCategoryEmoji(category: string): string {
  if (category === 'training') return '🏋️';
  if (category === 'nutrition') return '🥗';
  return '🧘';
}

export function getCategoryColor(category: string): string {
  if (category === 'training') return 'hsl(18 100% 60%)';
  if (category === 'nutrition') return 'hsl(110 100% 55%)';
  return 'hsl(192 100% 50%)';
}

export function ContentTypeIndicator({ type, duration, pages, size = 'sm' }: ContentTypeIndicatorProps) {
  const config = typeConfig[type] || typeConfig.article;
  const meta = getMetaLabel(type, duration, pages);

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{config.emoji}</span>
      {config.icon}
      <span className={`font-medium ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>{config.label}</span>
      {meta && (
        <>
          <span className="text-[10px]">·</span>
          <span className={`font-mono ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>{meta}</span>
        </>
      )}
    </div>
  );
}

export { typeConfig };
