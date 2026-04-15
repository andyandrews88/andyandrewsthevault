import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, BarChart3, CalendarDays } from "lucide-react";
import { WorkoutLogger } from "./WorkoutLogger";
import { ActiveProgramSwitcher } from "@/components/tracks/ActiveProgramSwitcher";
import { StrengthTrendChart } from "./StrengthTrendChart";
import { VolumeTrendChart } from "./VolumeTrendChart";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { PRBoard } from "./PRBoard";
import { ProgramCalendarView } from "./ProgramCalendarView";
import { MovementBalanceChart } from "./MovementBalanceChart";
import { IntensityTrendChart } from "./IntensityTrendChart";
import { ComplianceDonut } from "./ComplianceDonut";
import { useWorkoutStore } from "@/stores/workoutStore";
import { useWorkoutRealtime } from "@/hooks/useWorkoutRealtime";

export function WorkoutTab() {
  const [activeTab, setActiveTab] = useState("logger");
  const { loadWorkoutIntoActive, editWorkout } = useWorkoutStore();
  useWorkoutRealtime();

  const handleOpenWorkout = async (workoutId: string) => {
    await loadWorkoutIntoActive(workoutId);
    setActiveTab("logger");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <p className="section-label mb-1">WORKOUT TRACKER</p>
        <h2 className="text-base font-semibold">Training Log & Analytics</h2>
      </div>

      {/* Sub-tabs for Logger vs Dashboard vs Calendar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 h-auto p-1">
          <TabsTrigger value="logger" className="flex items-center gap-2 py-2.5 px-3">
            <Dumbbell className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Log Workout</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2 py-2.5 px-3">
            <CalendarDays className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2 py-2.5 px-3">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logger">
          <div className="space-y-4">
            <ActiveProgramSwitcher />
            <WorkoutLogger onBack={() => {}} />
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <ProgramCalendarView
            onSwitchToLogger={() => setActiveTab("logger")}
            onOpenWorkout={handleOpenWorkout}
          />
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <StrengthTrendChart />
              <VolumeTrendChart />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <IntensityTrendChart />
              <ComplianceDonut />
            </div>
            <MovementBalanceChart />
            <ActivityHeatmap />
            <PRBoard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
