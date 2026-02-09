import { DailyCheckin } from "./DailyCheckin";
import { ReadinessChart } from "./ReadinessChart";

export function LifestyleTab() {
  return (
    <div className="space-y-6">
      <DailyCheckin />
      <ReadinessChart />
    </div>
  );
}
