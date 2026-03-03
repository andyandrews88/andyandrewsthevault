import { useEffect, useState, ReactNode } from "react";
import { TodaySnapshot } from "./TodaySnapshot";
import { TrainingSuggestion } from "./TrainingSuggestion";
import { WeeklyReview } from "./WeeklyReview";
import { LatestUpdates } from "./LatestUpdates";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { GoalsPanel } from "@/components/goals/GoalsPanel";
import { PrivateCoachingPanel } from "./PrivateCoachingPanel";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Badge } from "@/components/ui/badge";
import { NotificationSettings } from "@/components/vault/NotificationSettings";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { CollapsibleDashboardSection } from "@/components/ui/CollapsibleDashboardSection";
import { Button } from "@/components/ui/button";
import { Settings2, RotateCcw } from "lucide-react";

const DEFAULT_ORDER = ["coaching", "snapshot", "training", "updates", "goals", "review"];

const SECTION_META: Record<string, { title: string }> = {
  coaching: { title: "My Coaching" },
  snapshot: { title: "Today's Snapshot" },
  training: { title: "Training Suggestion" },
  updates: { title: "Latest Updates" },
  goals: { title: "Goals" },
  review: { title: "Weekly Review" },
};

const SECTION_COMPONENTS: Record<string, () => ReactNode> = {
  coaching: () => <PrivateCoachingPanel />,
  snapshot: () => <TodaySnapshot />,
  training: () => <TrainingSuggestion />,
  updates: () => <LatestUpdates />,
  goals: () => <GoalsPanel />,
  review: () => <WeeklyReview />,
};

export function VaultDashboard() {
  const { fetchAll, isLoading } = useDashboardStore();
  const { checkForNewAnnouncements, loadNotificationPrefs } = useNotificationStore();
  const { user } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const { order, moveUp, moveDown, toggleCollapse, isCollapsed, resetLayout } = useDashboardLayout("vault-dashboard-layout", DEFAULT_ORDER);

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

  return (
    <div className="space-y-6">
      <AnnouncementBanner />
      <div className="text-center mb-2 relative">
        <Badge variant="elite" className="mb-2">TODAY'S OVERVIEW</Badge>
        <div className="absolute right-0 top-0 flex items-center gap-1">
          <Button
            variant={editMode ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditMode(!editMode)}
            title={editMode ? "Done editing" : "Edit layout"}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          {editMode && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetLayout} title="Reset layout">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <NotificationSettings />
        </div>
      </div>

      {order.map((id, idx) => {
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
            isLast={idx === order.length - 1}
            editMode={editMode}
          >
            {render()}
          </CollapsibleDashboardSection>
        );
      })}
    </div>
  );
}
