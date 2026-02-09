import { useEffect } from "react";
import { TodaySnapshot } from "./TodaySnapshot";
import { WeeklyReview } from "./WeeklyReview";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Badge } from "@/components/ui/badge";

export function VaultDashboard() {
  const { fetchAll, isLoading } = useDashboardStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
      <div className="text-center mb-2">
        <Badge variant="elite" className="mb-2">TODAY'S OVERVIEW</Badge>
      </div>
      <TodaySnapshot />
      <WeeklyReview />
    </div>
  );
}
