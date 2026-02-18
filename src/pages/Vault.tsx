import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Library, Users, Target, Star, ExternalLink, Crown,
  Radio, Shield, Activity, Dumbbell, Heart, LayoutDashboard
} from "lucide-react";
import { PodcastTab } from "@/components/vault/PodcastTab";
import { LibraryTab } from "@/components/vault/LibraryTab";
import { AdminPanel } from "@/components/vault/AdminPanel";
import { ProgressTab } from "@/components/progress/ProgressTab";
import { WorkoutTab } from "@/components/workout/WorkoutTab";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { LifestyleTab } from "@/components/lifestyle/LifestyleTab";
import { VaultDashboard as DashboardView } from "@/components/dashboard/VaultDashboard";
import { ProgramLibrary } from "@/components/tracks/ProgramLibrary";
import logo from "@/assets/logo.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { OnboardingWalkthrough } from "@/components/vault/OnboardingWalkthrough";
import { useSearchParams } from "react-router-dom";
import { useNotificationStore } from "@/stores/notificationStore";
import { useCommunityStore } from "@/stores/communityStore";

export function VaultDashboard() {
  const { isAdmin } = useAdminCheck();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'dashboard';
  const { hasNewAnnouncement, markCommunityVisited } = useNotificationStore();
  const { unreadDmCount } = useCommunityStore();

  const showCommunityDot = hasNewAnnouncement || unreadDmCount > 0;

  const handleTabChange = (value: string) => {
    if (value === 'community') {
      markCommunityVisited();
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <OnboardingWalkthrough />
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center mb-6 md:mb-8">
          <img 
            src={logo} 
            alt="Andy Andrews" 
            className="h-14 md:h-28 w-auto invert brightness-100 mb-3 md:mb-4 drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
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
          <h1 className="text-xl md:text-3xl font-bold">Welcome to The Vault</h1>
          <p className="text-muted-foreground mb-4 hidden sm:block">Your performance architecture command center</p>
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSeNZfnUe0PaxJFym_OJehlxbNmvbo9SPA6GDd6GIegdIaAD9Q/viewform?usp=header" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1.5 transition-colors"
          >
            <Crown className="w-3 h-3 text-accent" />
            Apply for 1-on-1 Coaching
          </a>
        </div>

        {/* Main tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-6" onValueChange={handleTabChange}>
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:-mx-6 md:px-6">
            <TabsList className="inline-flex w-max min-w-full gap-0.5 sm:gap-1 h-auto p-1">
              <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 whitespace-nowrap min-w-[52px] sm:min-w-0" aria-label="Dashboard">
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-[10px] sm:text-sm leading-none">Home</span>
              </TabsTrigger>
              <TabsTrigger value="workouts" className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 whitespace-nowrap min-w-[52px] sm:min-w-0" aria-label="Workouts">
                <Dumbbell className="w-4 h-4" />
                <span className="text-[10px] sm:text-sm leading-none">Train</span>
              </TabsTrigger>
              <TabsTrigger value="library" className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 whitespace-nowrap min-w-[52px] sm:min-w-0" aria-label="Library">
                <Library className="w-4 h-4" />
                <span className="text-[10px] sm:text-sm leading-none">Library</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 whitespace-nowrap min-w-[52px] sm:min-w-0" aria-label="Progress">
                <Activity className="w-4 h-4" />
                <span className="text-[10px] sm:text-sm leading-none">Progress</span>
              </TabsTrigger>
              <TabsTrigger value="lifestyle" className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 whitespace-nowrap min-w-[52px] sm:min-w-0" aria-label="Lifestyle">
                <Heart className="w-4 h-4" />
                <span className="text-[10px] sm:text-sm leading-none">Lifestyle</span>
              </TabsTrigger>
              <TabsTrigger value="podcast" className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 whitespace-nowrap min-w-[52px] sm:min-w-0" aria-label="Podcast">
                <Radio className="w-4 h-4" />
                <span className="text-[10px] sm:text-sm leading-none">Podcast</span>
              </TabsTrigger>
              <TabsTrigger value="community" className="relative flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 whitespace-nowrap min-w-[52px] sm:min-w-0" aria-label="Community">
                <div className="relative">
                  <Users className="w-4 h-4" />
                  {showCommunityDot && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive ring-1 ring-background" />
                  )}
                </div>
                <span className="text-[10px] sm:text-sm leading-none">Community</span>
              </TabsTrigger>
              <TabsTrigger value="tracks" className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 whitespace-nowrap min-w-[52px] sm:min-w-0" aria-label="Tracks">
                <Target className="w-4 h-4" />
                <span className="text-[10px] sm:text-sm leading-none">Tracks</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 whitespace-nowrap min-w-[52px] sm:min-w-0" aria-label="Admin">
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] sm:text-sm leading-none">Admin</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="dashboard"><DashboardView /></TabsContent>
          <TabsContent value="library"><LibraryTab isPremiumMember={true} isAdmin={isAdmin} /></TabsContent>
          <TabsContent value="progress"><ProgressTab /></TabsContent>
          <TabsContent value="lifestyle"><LifestyleTab /></TabsContent>
          <TabsContent value="workouts"><WorkoutTab /></TabsContent>
          <TabsContent value="podcast"><PodcastTab /></TabsContent>
          <TabsContent value="community"><CommunityFeed /></TabsContent>

          {/* Track Selection */}
          <TabsContent value="tracks">
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
                      Build the base. Address structural imbalances and establish movement competency before adding intensity.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>• Movement quality focus</li>
                      <li>• Mobility protocols</li>
                      <li>• Base aerobic development</li>
                      <li>• 3 days/week programming</li>
                    </ul>
                    <a href="https://dashboard.coachrx.app/programs/sales/74471" target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />Join on CoachRx
                      </Button>
                    </a>
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
                      <Badge variant="secondary" className="text-xs">COMING SOON</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Push boundaries. Designed for athletes with solid foundations ready to optimize every aspect of performance.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>• Advanced strength protocols</li>
                      <li>• Competition prep strategies</li>
                      <li>• Periodization models</li>
                      <li>• 5-6 days/week programming</li>
                    </ul>
                    <Button variant="outline" className="w-full" disabled>Coming Soon</Button>
                  </div>
                </div>
              </Card>
            </div>
            <Card variant="elevated" className="mt-6 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-accent/10 text-accent"><Crown className="w-6 h-6" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">1-on-1 Coaching</h3>
                    <Badge variant="elite" className="text-xs">ELITE</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ready for elite-level attention? If your audit shows you're in the Performance or Elite tier, you may qualify for personalized coaching with Andy.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    <li>• Fully customized programming</li>
                    <li>• Weekly check-ins & adjustments</li>
                    <li>• Direct access to Andy</li>
                    <li>• Comprehensive performance review</li>
                  </ul>
                  <a href="https://docs.google.com/forms/d/e/1FAIpQLSeNZfnUe0PaxJFym_OJehlxbNmvbo9SPA6GDd6GIegdIaAD9Q/viewform?usp=header" target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="elite" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />Apply Now
                    </Button>
                  </a>
                </div>
              </div>
            </Card>

            {/* Free Programs Library */}
            <ProgramLibrary />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin"><AdminPanel /></TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
