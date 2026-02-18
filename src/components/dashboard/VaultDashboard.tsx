import { useEffect } from "react";
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

export function VaultDashboard() {
  const { fetchAll, isLoading } = useDashboardStore();
  const { checkForNewAnnouncements, loadNotificationPrefs } = useNotificationStore();
  const { user } = useAuthStore();

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
        <div className="absolute right-0 top-0">
          <NotificationSettings />
        </div>
      </div>
      <TodaySnapshot />
      <TrainingSuggestion />
      <LatestUpdates />
      <GoalsPanel />
      <WeeklyReview />
    </div>
  );
}
