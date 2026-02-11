import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  FileText,
  Headphones,
  Download,
  Star,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fetchResources, fetchPodcasts, dbToResource } from "@/lib/vaultService";
import { VaultResource, VaultPodcast } from "@/types/vaultResources";
import { Resource } from "@/types/resources";
import { ResourceModal } from "@/components/vault/ResourceModal";

interface FeedItem {
  id: string;
  title: string;
  description: string;
  type: "video" | "podcast" | "article" | "pdf";
  category: string;
  createdAt: string;
  isFeatured: boolean;
  // For opening
  resource?: Resource;
  podcastUrl?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  video: <Play className="w-4 h-4" />,
  podcast: <Headphones className="w-4 h-4" />,
  article: <FileText className="w-4 h-4" />,
  pdf: <Download className="w-4 h-4" />,
};

const ctaLabels: Record<string, string> = {
  video: "Watch",
  podcast: "Listen",
  article: "Read",
  pdf: "Download",
};

const categoryVariants: Record<string, "data" | "success" | "elite"> = {
  training: "data",
  nutrition: "success",
  lifestyle: "elite",
};

function resourceToFeedItem(dbRes: VaultResource, resource: Resource): FeedItem {
  const typeMap: Record<string, FeedItem["type"]> = {
    youtube: "video",
    vimeo: "video",
    spotify: "podcast",
    apple_podcast: "podcast",
    article: "article",
    pdf: "pdf",
  };
  return {
    id: dbRes.id,
    title: dbRes.title,
    description: dbRes.description,
    type: typeMap[dbRes.type] || "article",
    category: dbRes.category,
    createdAt: dbRes.created_at,
    isFeatured: dbRes.is_featured,
    resource,
  };
}

function podcastToFeedItem(podcast: VaultPodcast): FeedItem {
  const url = podcast.spotify_url || podcast.apple_url || podcast.youtube_url || "";
  return {
    id: podcast.id,
    title: podcast.title,
    description: podcast.description,
    type: "podcast",
    category: "lifestyle",
    createdAt: podcast.created_at,
    isFeatured: podcast.is_featured,
    podcastUrl: url,
  };
}

interface LatestUpdatesProps {
  onNavigateToLibrary?: () => void;
}

export function LatestUpdates({ onNavigateToLibrary }: LatestUpdatesProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [dbResources, podcasts] = await Promise.all([
          fetchResources(),
          fetchPodcasts(),
        ]);

        const resItems = dbResources.map((r) =>
          resourceToFeedItem(r, dbToResource(r))
        );
        const podItems = podcasts.map(podcastToFeedItem);
        const all = [...resItems, ...podItems].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setFeedItems(all);
      } catch (err) {
        console.error("Error loading feed:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const featured = feedItems.filter((i) => i.isFeatured);
  const featuredIds = new Set(featured.map((i) => i.id));
  const recent = feedItems.filter((i) => !featuredIds.has(i.id)).slice(0, 5);

  const handleItemClick = (item: FeedItem) => {
    if (item.resource) {
      setSelectedResource(item.resource);
      setIsModalOpen(true);
    } else if (item.podcastUrl) {
      window.open(item.podcastUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (featured.length === 0 && recent.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Top Recommendations */}
      {featured.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-accent">
              Top Recommendations
            </h3>
          </div>
          <div className="space-y-2">
            {featured.map((item) => (
              <FeedCard key={item.id} item={item} onClick={() => handleItemClick(item)} />
            ))}
          </div>
        </div>
      )}

      {/* Fresh Drops */}
      {recent.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold tracking-wide uppercase text-primary">
                Fresh Drops
              </h3>
            </div>
            {onNavigateToLibrary && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={onNavigateToLibrary}
              >
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {recent.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
                showTimeAgo
              />
            ))}
          </div>
        </div>
      )}

      <ResourceModal
        resource={selectedResource}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedResource(null);
        }}
      />
    </div>
  );
}

function FeedCard({
  item,
  onClick,
  showTimeAgo = false,
}: {
  item: FeedItem;
  onClick: () => void;
  showTimeAgo?: boolean;
}) {
  const variant = categoryVariants[item.category] || "data";

  return (
    <Card
      variant="interactive"
      className="p-3 flex items-center gap-3 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-muted-foreground">
        {typeIcons[item.type]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant={variant} className="text-[10px] px-1.5 py-0">
            {item.category.toUpperCase()}
          </Badge>
          {showTimeAgo && (
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      <Button variant="ghost" size="sm" className="flex-shrink-0 text-xs text-primary">
        {ctaLabels[item.type]}
      </Button>
    </Card>
  );
}
