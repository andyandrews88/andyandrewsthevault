import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Library, 
  Users, 
  Target, 
  Star,
  Play,
  FileText,
  MessageSquare,
  Send,
  ExternalLink,
  Lock,
  Crown
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

// Mock data for resources
const resources = [
  { id: 1, title: "Back Squat Mechanics", type: "video", category: "Movement Blueprint", duration: "12:34" },
  { id: 2, title: "Front Rack Mobility", type: "video", category: "Movement Blueprint", duration: "8:22" },
  { id: 3, title: "Deadlift Position Guide", type: "pdf", category: "Movement Blueprint", pages: 15 },
  { id: 4, title: "Pressing Progression", type: "video", category: "Movement Blueprint", duration: "15:45" },
  { id: 5, title: "Zone 2 Protocol", type: "pdf", category: "Engine Development", pages: 8 },
  { id: 6, title: "Core Stability Series", type: "video", category: "Movement Blueprint", duration: "22:10" },
];

// Mock community posts
const communityPosts = [
  { 
    id: 1, 
    author: "Marcus T.", 
    content: "Just hit a 10% improvement on my front squat ratio after 6 weeks on the thoracic mobility protocol. The pause work at the bottom really made the difference.", 
    time: "2 hours ago",
    likes: 12
  },
  { 
    id: 2, 
    author: "Sarah K.", 
    content: "Question for the community: Has anyone found a good way to program Zone 2 work around heavy squat days? Struggling with recovery.", 
    time: "5 hours ago",
    likes: 8
  },
  { 
    id: 3, 
    author: "Andy Andrews", 
    content: "Weekly reminder: Your engine work should never compromise your strength work. If you're feeling ground down, reduce volume on conditioning before touching the barbell work.", 
    time: "1 day ago",
    likes: 47,
    verified: true
  },
];

export function VaultDashboard() {
  const [newPost, setNewPost] = useState("");

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Badge variant="elite" className="mb-2">VAULT MEMBER</Badge>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome to The Vault</h1>
            <p className="text-muted-foreground">Your performance architecture command center</p>
          </div>
          <Button variant="elite">
            <Crown className="w-4 h-4 mr-2" />
            Apply for 1-on-1 Coaching
          </Button>
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="tracks" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Tracks</span>
            </TabsTrigger>
          </TabsList>

          {/* Resource Library */}
          <TabsContent value="library">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Movement Blueprints</CardTitle>
                <CardDescription>Video tutorials and PDF guides for optimal movement patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((resource) => (
                    <Card key={resource.id} variant="interactive" className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          resource.type === 'video' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                        }`}>
                          {resource.type === 'video' ? <Play className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{resource.title}</h4>
                          <p className="text-xs text-muted-foreground">{resource.category}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {resource.type === 'video' ? resource.duration : `${resource.pages} pages`}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Community Hub */}
          <TabsContent value="community">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Community Hub</CardTitle>
                <CardDescription>Share insights, ask questions, and connect with fellow athletes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* New post input */}
                <div className="flex gap-3">
                  <Input
                    placeholder="Share your progress or ask a question..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="default" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Posts */}
                <div className="space-y-4">
                  {communityPosts.map((post) => (
                    <div key={post.id} className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">{post.author}</span>
                        {post.verified && (
                          <Badge variant="elite" className="text-xs py-0">
                            <Star className="w-3 h-3 mr-1" />
                            Coach
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">{post.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{post.content}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Reply
                        </button>
                        <span className="text-xs text-muted-foreground">
                          {post.likes} likes
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Track Selection */}
          <TabsContent value="tracks">
            <div className="grid md:grid-cols-2 gap-6">
              <Card variant="interactive" className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-secondary text-foreground">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Foundation Track</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Build the base. Address structural imbalances and establish movement competency 
                      before adding intensity.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>• Movement quality focus</li>
                      <li>• Mobility protocols</li>
                      <li>• Base aerobic development</li>
                      <li>• 3 days/week programming</li>
                    </ul>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Join on CoachRx
                    </Button>
                  </div>
                </div>
              </Card>

              <Card variant="data" className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <Star className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">Performance Track</h3>
                      <Badge variant="elite" className="text-xs">ADVANCED</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Push boundaries. Designed for athletes with solid foundations ready to 
                      optimize every aspect of performance.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>• Advanced strength protocols</li>
                      <li>• Competition prep strategies</li>
                      <li>• Periodization models</li>
                      <li>• 5-6 days/week programming</li>
                    </ul>
                    <Button variant="hero" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Join on CoachRx
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* 1-on-1 CTA */}
            <Card variant="elevated" className="mt-6 p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 rounded-lg bg-accent/10">
                  <Crown className="w-8 h-8 text-accent" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-semibold text-lg mb-1">Ready for Elite-Level Attention?</h3>
                  <p className="text-sm text-muted-foreground">
                    If your audit shows you're in the Performance or Elite tier, you may qualify for 
                    1-on-1 coaching with Andy.
                  </p>
                </div>
                <Button variant="elite" size="lg">
                  Apply Now
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
