import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Library, 
  Users, 
  Target, 
  Star,
  MessageSquare,
  Send,
  ExternalLink,
  Crown,
  Radio,
  Calculator,
  Shield,
  Activity
} from "lucide-react";
import { PodcastTab } from "@/components/vault/PodcastTab";
import { LibraryTab } from "@/components/vault/LibraryTab";
import { AdminPanel } from "@/components/vault/AdminPanel";
import { ProgressTab } from "@/components/progress/ProgressTab";
import { FoodDatabase } from "@/components/nutrition/FoodDatabase";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";

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
  const { isAdmin, isLoading: isAdminLoading } = useAdminCheck();

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <img 
            src={logo} 
            alt="Andy Andrews" 
            className="h-20 md:h-28 w-auto invert brightness-100 mb-4 drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
          />
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="elite">VAULT MEMBER</Badge>
            {isAdmin && (
              <Badge variant="default" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                ADMIN
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome to The Vault</h1>
          <p className="text-muted-foreground mb-4">Your performance architecture command center</p>
          <Button variant="elite">
            <Crown className="w-4 h-4 mr-2" />
            Apply for 1-on-1 Coaching
          </Button>
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className={`grid w-full max-w-3xl ${isAdmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Nutrition</span>
            </TabsTrigger>
            <TabsTrigger value="podcast" className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              <span className="hidden sm:inline">Podcast</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="tracks" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Tracks</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Resource Library */}
          <TabsContent value="library">
            <LibraryTab isPremiumMember={true} isAdmin={isAdmin} />
          </TabsContent>

          {/* Progress Tracking */}
          <TabsContent value="progress">
            <ProgressTab />
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <div className="space-y-6">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    The Fuel System
                  </CardTitle>
                  <CardDescription>
                    Engineering-grade nutrition calculator with 50+ curated foods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/nutrition">
                    <Button variant="hero" className="w-full sm:w-auto">
                      Open Full Calculator
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <FoodDatabase />
            </div>
          </TabsContent>

          {/* Podcast Tab */}
          <TabsContent value="podcast">
            <PodcastTab />
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

          {/* Admin Panel - Only visible to admins */}
          {isAdmin && (
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
