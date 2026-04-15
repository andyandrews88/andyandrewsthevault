import { useEffect, useState, ReactNode } from "react";
import { TodaySnapshot } from "./TodaySnapshot";
import { TrainingSuggestion } from "./TrainingSuggestion";
import { WeeklyReview } from "./WeeklyReview";
import { LatestUpdates } from "./LatestUpdates";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { GoalsPanel } from "@/components/goals/GoalsPanel";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Badge } from "@/components/ui/badge";
import { NotificationSettings } from "@/components/vault/NotificationSettings";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { CollapsibleDashboardSection } from "@/components/ui/CollapsibleDashboardSection";
import { Button } from "@/components/ui/button";
import { Settings2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";

const DEFAULT_ORDER = ["snapshot", "training", "updates", "goals", "review"];

const PRIMARY_SECTIONS = new Set(["snapshot", "training"]);

const SECTION_META: Record<string, { title: string }> = {
  snapshot: { title: "Today's Snapshot" },
  training: { title: "Training Suggestion" },
  updates: { title: "Latest Updates" },
  goals: { title: "Goals" },
  review: { title: "Weekly Review" },
};

const SECTION_COMPONENTS: Record<string, () => ReactNode> = {
  snapshot: () => <TodaySnapshot />,
  training: () => <TrainingSuggestion />,
  updates: () => <LatestUpdates />,
  goals: () => <GoalsPanel />,
  review: () => <WeeklyReview />,
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export function VaultDashboard() {
  const { fetchAll, isLoading } = useDashboardStore();
  const { checkForNewAnnouncements, loadNotificationPrefs } = useNotificationStore();
  const { user } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const isMobile = useIsMobile();
  const { order, moveUp, moveDown, toggleCollapse, isCollapsed, toggleHidden, isHidden, resetLayout } = useDashboardLayout("vault-dashboard-layout", DEFAULT_ORDER);

  useEffect(() => {
    fetchAll();
    checkForNewAnnouncements();
    if (user?.id) {
      loadNotificationPrefs(user.id);
    }
  }, [fetchAll, checkForNewAnnouncements, loadNotificationPrefs, user?.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const visibleSections = order.filter(id => {
    if (!editMode && isHidden(id)) return false;
    return true;
  });

  const primarySections = isMobile && !editMode && !showMore
    ? visibleSections.filter(id => PRIMARY_SECTIONS.has(id))
    : visibleSections;

  const hasMoreSections = isMobile && !editMode && visibleSections.length > primarySections.length;

  return (
    <div className="space-y-4 md:space-y-6">
      <AnnouncementBanner />

      {/* Greeting row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {format(new Date(), "EEEE, d MMMM")}
          </p>
          <h2 className="text-2xl md:text-3xl font-display tracking-wide text-foreground" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {getGreeting()}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {editMode ? (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetLayout} title="Reset layout">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="default" size="sm" className="h-8 text-xs px-3" onClick={() => setEditMode(false)}>
                Done
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-muted-foreground"
              onClick={() => setEditMode(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Customize</span>
            </Button>
          )}
          <NotificationSettings />
        </div>
      </div>

      {primarySections.map((id, idx) => {
        const meta = SECTION_META[id];
        const render = SECTION_COMPONENTS[id];
        if (!meta || !render) return null;
        return (
          <CollapsibleDashboardSection
            key={id}
            id={id}
            title={meta.title}
            isOpen={!isCollapsed(id)}
            onToggle={() => toggleCollapse(id)}
            onMoveUp={() => moveUp(id)}
            onMoveDown={() => moveDown(id)}
            isFirst={idx === 0}
            isLast={idx === visibleSections.length - 1}
            editMode={editMode}
            isHidden={isHidden(id)}
            onToggleHidden={() => toggleHidden(id)}
          >
            {render()}
          </CollapsibleDashboardSection>
        );
      })}

      {isMobile && !editMode && (hasMoreSections || showMore) && (
        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground gap-2"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show More ({visibleSections.length - primarySections.length})
            </>
          )}
        </Button>
      )}
    </div>
  );
}
