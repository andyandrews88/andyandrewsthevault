import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ExternalLink, Crown, Star, Target,
} from "lucide-react";
import { PodcastTab } from "@/components/vault/PodcastTab";
import { LibraryTab } from "@/components/vault/LibraryTab";
import { AdminPanel } from "@/components/vault/AdminPanel";
import { ProgressTab } from "@/components/progress/ProgressTab";
import { WorkoutTab } from "@/components/workout/WorkoutTab";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { LifestyleTab } from "@/components/lifestyle/LifestyleTab";
import { VaultDashboard as DashboardView } from "@/components/dashboard/VaultDashboard";
import { PrivateCoachingPanel } from "@/components/dashboard/PrivateCoachingPanel";
import { ProgramLibrary } from "@/components/tracks/ProgramLibrary";
import { BottomNav } from "@/components/layout/BottomNav";
import { VAULT_TABS, APP_VERSION, APP_BUILD_DATE } from "@/lib/navigationConstants";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { OnboardingWalkthrough } from "@/components/vault/OnboardingWalkthrough";
import { useSearchParams } from "react-router-dom";
import { useNotificationStore } from "@/stores/notificationStore";
import { useCommunityStore } from "@/stores/communityStore";
import { Shield } from "lucide-react";

export function VaultDashboard() {
  const { isAdmin } = useAdminCheck();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { hasNewAnnouncement, markCommunityVisited } = useNotificationStore();
  const { unreadDmCount } = useCommunityStore();

  const showCommunityDot = hasNewAnnouncement || unreadDmCount > 0;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
    if (value === 'community') {
      markCommunityVisited();
    }
  };

  const handleOnboardingComplete = (tab?: string) => {
    if (tab) setActiveTab(tab);
  };

  // Filter tabs based on admin status
  const visibleTabs = VAULT_TABS.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="min-h-screen pt-6 md:pt-24 pb-20 md:pb-12">
      <OnboardingWalkthrough onComplete={handleOnboardingComplete} onTabChange={handleTabChange} currentTab={activeTab} />
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Mobile compact top bar */}
        <div className="flex md:hidden items-center justify-between mb-3">
          <img
            src={logo}
            alt="Andy Andrews"
            className="h-8 w-auto invert brightness-100 drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
          />
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                ADMIN
              </Badge>
            )}
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-mono text-muted-foreground">
              V
            </div>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex flex-col items-center text-center mb-8">
          <img 
            src={logo} 
            alt="Andy Andrews" 
            className="h-28 w-auto invert brightness-100 mb-4 drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
          />
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="elite">VAULT MEMBER</Badge>
            {isAdmin && (
              <Badge variant="default" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                ADMIN
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold">Welcome to The Vault</h1>
          <p className="text-muted-foreground mb-2">Your performance architecture command center</p>
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSeNZfnUe0PaxJFym_OJehlxbNmvbo9SPA6GDd6GIegdIaAD9Q/viewform?usp=header" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1.5 transition-colors"
          >
            <Crown className="w-3 h-3 text-accent" />
            Apply for 1-on-1 Coaching
          </a>
          {isAdmin && (
            <p className="text-[10px] text-muted-foreground/40 mt-1 font-mono">
              v{APP_VERSION} · {APP_BUILD_DATE}
            </p>
          )}
        </div>

        {/* Main tabs */}
        <Tabs value={activeTab} className="space-y-6" onValueChange={handleTabChange}>
          {/* Tab strip — hidden on mobile, shown on desktop */}
          <div className="relative hidden md:block">
            <TabsList className="flex overflow-x-auto scrollbar-hide gap-1 h-auto p-1 pr-4 sm:inline-flex sm:w-auto sm:flex-wrap">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const showDot = tab.id === "community" && showCommunityDot;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] whitespace-nowrap"
                    aria-label={tab.label}
                  >
                    <div className="relative">
                      <Icon className="w-4 h-4" />
                      {showDot && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive ring-1 ring-background" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm leading-none">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {activeTab === "dashboard" && <TabsContent value="dashboard" forceMount><DashboardView /></TabsContent>}
          {activeTab === "workouts" && <TabsContent value="workouts" forceMount><WorkoutTab /></TabsContent>}
          {activeTab === "library" && <TabsContent value="library" forceMount><LibraryTab isPremiumMember={true} isAdmin={isAdmin} /></TabsContent>}
          {activeTab === "progress" && <TabsContent value="progress" forceMount><ProgressTab /></TabsContent>}
          {activeTab === "lifestyle" && <TabsContent value="lifestyle" forceMount><LifestyleTab /></TabsContent>}
          {activeTab === "podcast" && <TabsContent value="podcast" forceMount><PodcastTab /></TabsContent>}
          {activeTab === "community" && <TabsContent value="community" forceMount><CommunityFeed /></TabsContent>}
          {activeTab === "coaching" && (
            <TabsContent value="coaching" forceMount>
              <div className="mb-4">
                <p className="section-label mb-1">MY COACHING</p>
                <h2 className="text-base font-semibold">Your programme, sessions & billing</h2>
              </div>
              <PrivateCoachingPanel />
            </TabsContent>
          )}

          {/* Track Selection */}
          {activeTab === "tracks" && (
          <TabsContent value="tracks" forceMount>
            <div className="mb-4">
              <p className="section-label mb-1">TRAINING PROGRAMS</p>
              <h2 className="text-base font-semibold">Choose Your Path</h2>
              <p className="text-xs text-muted-foreground hidden sm:block max-w-xl mt-1">
                Foundation for building fundamentals or Performance for advanced optimization.
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
          )}

          {isAdmin && activeTab === "admin" && (
            <TabsContent value="admin" forceMount><AdminPanel /></TabsContent>
          )}
        </Tabs>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
