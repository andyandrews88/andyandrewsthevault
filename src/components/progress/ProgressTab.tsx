import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Scale, 
  TrendingUp, 
  Plus, 
  Activity,
  LineChart as LineChartIcon,
  Ruler,
  Scan
} from "lucide-react";
import { useProgressStore } from "@/stores/progressStore";
import { BodyEntryForm } from "./BodyEntryForm";
import { WeightChart } from "./WeightChart";
import { MeasurementTable } from "./MeasurementTable";
import { ProgressOverview } from "./ProgressOverview";
// WearableConnect temporarily removed - can restore later
import { kgToLbs, cmToInches } from "@/types/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ProgressTab() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { 
    bodyEntries, 
    isLoadingEntries, 
    fetchBodyEntries,
    fetchWearableConnections,
    usesImperial 
  } = useProgressStore();

  useEffect(() => {
    fetchBodyEntries();
    // Wearable connections temporarily disabled
    // fetchWearableConnections();
  }, [fetchBodyEntries]);

  const latestEntry = bodyEntries[0];
  const previousEntry = bodyEntries[1];

  // Calculate weight change
  const weightChange = latestEntry?.weight_kg && previousEntry?.weight_kg
    ? latestEntry.weight_kg - previousEntry.weight_kg
    : null;

  const displayWeight = (kg: number | null) => {
    if (!kg) return "—";
    return usesImperial ? `${kgToLbs(kg)} lbs` : `${kg} kg`;
  };

  return (
    <div className="space-y-6">
      {/* Page Description */}
      <div className="text-center">
        <Badge variant="elite" className="mb-3">PROGRESS TRACKER</Badge>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Body Composition & Metrics</h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto mb-4">
          Track your bodyweight, measurements, and body composition over time. See trends and monitor your transformation.
        </p>
      </div>

      {/* Header with Add Entry button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Your Progress
          </h3>
          <p className="text-sm text-muted-foreground">
            Track body composition and metrics
          </p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Body Entry</DialogTitle>
            </DialogHeader>
            <BodyEntryForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <ProgressOverview 
        latestEntry={latestEntry}
        weightChange={weightChange}
        usesImperial={usesImperial}
      />

      {/* Wearable Connections - temporarily disabled */}
      {/* <WearableConnect /> */}

      {/* Main content tabs */}
      {/* Determine if user has scan data */}
      {(() => {
        const hasScanData = bodyEntries.some(e => e.lean_mass_kg || e.fat_mass_kg);
        return (
      <Tabs defaultValue="weight" className="space-y-4">
        <TabsList className={`grid w-full max-w-md h-auto p-1 ${hasScanData ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="weight" className="flex items-center gap-2 py-2.5 px-3">
            <Scale className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Weight</span>
          </TabsTrigger>
          <TabsTrigger value="measurements" className="flex items-center gap-2 py-2.5 px-3">
            <Ruler className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Measures</span>
          </TabsTrigger>
          {hasScanData && (
            <TabsTrigger value="scans" className="flex items-center gap-2 py-2.5 px-3">
              <Scan className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Scans</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="weight">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-primary" />
                Weight Timeline
              </CardTitle>
              <CardDescription>
                Track your bodyweight changes over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEntries ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : bodyEntries.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <Scale className="w-12 h-12 mb-4 opacity-50" />
                  <p>No entries yet</p>
                  <p className="text-sm">Add your first entry to start tracking</p>
                </div>
              ) : (
                <WeightChart entries={bodyEntries} usesImperial={usesImperial} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurements">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-primary" />
                Body Measurements
              </CardTitle>
              <CardDescription>
                Compare circumference measurements across dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEntries ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : bodyEntries.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <Ruler className="w-12 h-12 mb-4 opacity-50" />
                  <p>No measurements yet</p>
                  <p className="text-sm">Add an entry with measurements to see comparisons</p>
                </div>
              ) : (
                <MeasurementTable entries={bodyEntries} usesImperial={usesImperial} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-primary" />
                Body Composition Scans
              </CardTitle>
              <CardDescription>
                DEXA, InBody, and other advanced body composition data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEntries ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <div className="space-y-4">
                  {bodyEntries.filter(e => e.lean_mass_kg || e.fat_mass_kg).length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                      <Scan className="w-12 h-12 mb-4 opacity-50" />
                      <p>No scan data yet</p>
                      <p className="text-sm">Add DEXA, InBody, or Bod Pod results to see your body composition</p>
                    </div>
                  ) : (
                    bodyEntries
                      .filter(e => e.lean_mass_kg || e.fat_mass_kg)
                      .slice(0, 5)
                      .map(entry => (
                        <div key={entry.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{entry.entry_date}</span>
                            {entry.measurement_source && (
                              <Badge variant="outline">{entry.measurement_source}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {entry.lean_mass_kg && (
                              <div>
                                <span className="text-muted-foreground">Lean Mass</span>
                                <p className="font-medium">{displayWeight(entry.lean_mass_kg)}</p>
                              </div>
                            )}
                            {entry.fat_mass_kg && (
                              <div>
                                <span className="text-muted-foreground">Fat Mass</span>
                                <p className="font-medium">{displayWeight(entry.fat_mass_kg)}</p>
                              </div>
                            )}
                            {entry.body_fat_percent && (
                              <div>
                                <span className="text-muted-foreground">Body Fat</span>
                                <p className="font-medium">{entry.body_fat_percent}%</p>
                              </div>
                            )}
                            {entry.visceral_fat_rating && (
                              <div>
                                <span className="text-muted-foreground">Visceral Fat</span>
                                <p className="font-medium">{entry.visceral_fat_rating}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        );
      })()}
    </div>
  );
}
