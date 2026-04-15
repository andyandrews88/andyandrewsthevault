import { DailyCheckin } from "./DailyCheckin";
import { ReadinessChart } from "./ReadinessChart";
import { BreathworkSection } from "./BreathworkSection";

export function LifestyleTab() {
  return (
    <div className="space-y-4">
      <DailyCheckin />
      <ReadinessChart />
      <BreathworkSection />
    </div>
  );
}
