import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Headphones, ExternalLink, Play } from "lucide-react";

const podcastEpisodes = [
  {
    id: 1,
    title: "We are rebranding",
    description: "Welcome to HPA Podcast - reimagined for Health, Performance & Aesthetics",
    duration: "3 min",
    date: "01/30/2025",
    category: "Announcement",
    url: "https://podcasts.apple.com/us/podcast/we-are-rebranding/id1538797196?i=1000687131996",
    featured: true
  },
  {
    id: 2,
    title: "Secret to Motivation",
    description: "Understanding what really drives long-term consistency",
    duration: "20 min",
    date: "01/23/2025",
    category: "Mindset",
    url: "https://podcasts.apple.com/us/podcast/hpa-training-podcast/id1538797196",
    featured: false
  },
  {
    id: 3,
    title: "Tracking the Right Metrics",
    description: "What to measure and why most people get it wrong",
    duration: "14 min",
    date: "01/16/2025",
    category: "Data & Progress",
    url: "https://podcasts.apple.com/us/podcast/hpa-training-podcast/id1538797196",
    featured: false
  },
  {
    id: 4,
    title: "Decision Fatigue & Food Prep",
    description: "Simplify your nutrition to stay consistent",
    duration: "10 min",
    date: "01/09/2025",
    category: "Nutrition",
    url: "https://podcasts.apple.com/us/podcast/hpa-training-podcast/id1538797196",
    featured: false
  },
  {
    id: 5,
    title: "How to Make Progress in the Gym",
    description: "The fundamentals of progressive overload done right",
    duration: "10 min",
    date: "01/02/2025",
    category: "Training",
    url: "https://podcasts.apple.com/us/podcast/hpa-training-podcast/id1538797196",
    featured: false
  },
  {
    id: 6,
    title: "The Goldilocks Zone",
    description: "Finding the sweet spot between too much and too little",
    duration: "2 min",
    date: "12/26/2024",
    category: "Training",
    url: "https://podcasts.apple.com/us/podcast/hpa-training-podcast/id1538797196",
    featured: false
  },
  {
    id: 7,
    title: "Worlds Best Program",
    description: "Why the best program is the one you'll actually follow",
    duration: "9 min",
    date: "12/19/2024",
    category: "Onboarding",
    url: "https://podcasts.apple.com/us/podcast/hpa-training-podcast/id1538797196",
    featured: false
  },
];

const categoryVariant = (category: string) => {
  switch (category) {
    case "Mindset": return "elite";
    case "Data & Progress": return "data";
    case "Nutrition": return "success";
    case "Training": return "default";
    case "Announcement": return "warning";
    default: return "secondary";
  }
};

export function PodcastTab() {
  const featuredEpisode = podcastEpisodes.find(ep => ep.featured);
  const regularEpisodes = podcastEpisodes.filter(ep => !ep.featured);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Headphones className="w-6 h-6 text-primary" />
                <CardTitle>HPA Training Podcast</CardTitle>
              </div>
              <CardDescription>Health, Performance & Aesthetics</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="data">27 EPISODES</Badge>
              <Button variant="hero" asChild>
                <a 
                  href="https://podcasts.apple.com/us/podcast/hpa-training-podcast/id1538797196" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Listen on Apple Podcasts
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Featured Episode */}
      {featuredEpisode && (
        <Card variant="data" className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-center justify-center p-6 rounded-lg bg-primary/10 md:w-32 md:h-32">
              <Play className="w-12 h-12 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={categoryVariant(featuredEpisode.category)}>{featuredEpisode.category}</Badge>
                <span className="text-xs text-muted-foreground">{featuredEpisode.date}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{featuredEpisode.title}</h3>
              <p className="text-muted-foreground mb-4">{featuredEpisode.description}</p>
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-muted-foreground">{featuredEpisode.duration}</span>
                <Button variant="outline" size="sm" asChild>
                  <a href={featuredEpisode.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Listen Now
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Episode Grid */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-lg">All Episodes</CardTitle>
          <CardDescription>Curated content for performance-focused athletes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularEpisodes.map((episode) => (
              <a 
                key={episode.id}
                href={episode.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card variant="interactive" className="p-4 h-full">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{episode.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{episode.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-mono text-muted-foreground">{episode.duration}</span>
                        <Badge variant={categoryVariant(episode.category)} className="text-xs py-0">
                          {episode.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
