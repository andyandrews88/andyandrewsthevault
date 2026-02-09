import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, BarChart3, Trophy } from "lucide-react";
import { WorkoutLogger } from "./WorkoutLogger";
import { StrengthTrendChart } from "./StrengthTrendChart";
import { VolumeTrendChart } from "./VolumeTrendChart";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { PRBoard } from "./PRBoard";

export function WorkoutTab() {
  const [view, setView] = useState<'logger' | 'dashboard'>('logger');

  return (
    <div className="space-y-6">
      {/* Page Description */}
      <div className="text-center">
        <Badge variant="elite" className="mb-3">WORKOUT TRACKER</Badge>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Training Log & Analytics</h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto mb-4">
          Log your workouts, track PRs in real-time, and visualize your strength progress over time.
        </p>
      </div>

      {/* Sub-tabs for Logger vs Dashboard */}
      <Tabs defaultValue="logger" className="space-y-4">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-auto p-1">
          <TabsTrigger value="logger" className="flex items-center gap-2 py-2.5 px-3">
            <Dumbbell className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Log Workout</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2 py-2.5 px-3">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Dashboard</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logger">
          <WorkoutLogger onBack={() => {}} />
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="space-y-6">
            {/* Strength & Volume Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <StrengthTrendChart />
              <VolumeTrendChart />
            </div>

            {/* Heatmap */}
            <ActivityHeatmap />

            {/* PR Board */}
            <PRBoard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
