import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Library, 
  Users, 
  Target, 
  Star,
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
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";

export function VaultDashboard() {
  const { isAdmin } = useAdminCheck();

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
          <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
            <TabsList className="inline-flex w-max min-w-full gap-1 h-auto p-1">
              <TabsTrigger value="library" className="flex items-center gap-2 px-3 py-2.5 whitespace-nowrap">
                <Library className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Library</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2 px-3 py-2.5 whitespace-nowrap">
                <Activity className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Progress</span>
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="flex items-center gap-2 px-3 py-2.5 whitespace-nowrap">
                <Calculator className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Nutrition</span>
              </TabsTrigger>
              <TabsTrigger value="podcast" className="flex items-center gap-2 px-3 py-2.5 whitespace-nowrap">
                <Radio className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Podcast</span>
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2 px-3 py-2.5 whitespace-nowrap">
                <Users className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Community</span>
              </TabsTrigger>
              <TabsTrigger value="tracks" className="flex items-center gap-2 px-3 py-2.5 whitespace-nowrap">
                <Target className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Tracks</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="flex items-center gap-2 px-3 py-2.5 whitespace-nowrap">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Admin</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

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
            <CommunityFeed />
          </TabsContent>

          {/* Track Selection */}
          <TabsContent value="tracks">
            {/* Page Description */}
            <div className="text-center mb-6">
              <Badge variant="elite" className="mb-3">TRAINING PROGRAMS</Badge>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Choose Your Path</h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
                Foundation for building fundamentals or Performance for advanced optimization. 
                Select the track that matches your current level.
              </p>
            </div>

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
