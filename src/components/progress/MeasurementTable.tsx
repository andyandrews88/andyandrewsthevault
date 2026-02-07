import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { type BodyEntry, cmToInches } from "@/types/progress";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface MeasurementTableProps {
  entries: BodyEntry[];
  usesImperial: boolean;
}

type MeasurementKey = 
  | 'neck_cm' | 'shoulders_cm' | 'chest_cm' | 'waist_cm' | 'hips_cm'
  | 'left_bicep_cm' | 'right_bicep_cm' | 'left_forearm_cm' | 'right_forearm_cm'
  | 'left_thigh_cm' | 'right_thigh_cm' | 'left_calf_cm' | 'right_calf_cm';

const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  neck_cm: 'Neck',
  shoulders_cm: 'Shoulders',
  chest_cm: 'Chest',
  waist_cm: 'Waist',
  hips_cm: 'Hips',
  left_bicep_cm: 'L Bicep',
  right_bicep_cm: 'R Bicep',
  left_forearm_cm: 'L Forearm',
  right_forearm_cm: 'R Forearm',
  left_thigh_cm: 'L Thigh',
  right_thigh_cm: 'R Thigh',
  left_calf_cm: 'L Calf',
  right_calf_cm: 'R Calf',
};

export function MeasurementTable({ entries, usesImperial }: MeasurementTableProps) {
  const [compareCount, setCompareCount] = useState<string>("3");
  
  // Filter entries that have any measurement data
  const entriesWithMeasurements = useMemo(() => {
    return entries.filter(entry => 
      Object.keys(MEASUREMENT_LABELS).some(key => entry[key as MeasurementKey] !== null)
    ).slice(0, parseInt(compareCount));
  }, [entries, compareCount]);

  const formatMeasurement = (value: number | null): string => {
    if (value === null) return "—";
    const converted = usesImperial ? cmToInches(value) : value;
    return `${converted}`;
  };

  const getChange = (current: number | null, previous: number | null): { value: number | null; direction: 'up' | 'down' | 'same' } => {
    if (current === null || previous === null) return { value: null, direction: 'same' };
    const diff = Math.round((current - previous) * 10) / 10;
    return {
      value: diff,
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
    };
  };

  if (entriesWithMeasurements.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No measurement data to display. Add entries with circumference measurements to see comparisons.
      </div>
    );
  }

  const measurementKeys = Object.keys(MEASUREMENT_LABELS) as MeasurementKey[];
  const unit = usesImperial ? "in" : "cm";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Showing measurements in {usesImperial ? "inches" : "centimeters"}
        </span>
        <Select value={compareCount} onValueChange={setCompareCount}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 entries</SelectItem>
            <SelectItem value="3">3 entries</SelectItem>
            <SelectItem value="5">5 entries</SelectItem>
            <SelectItem value="10">10 entries</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Measurement</TableHead>
              {entriesWithMeasurements.map((entry, index) => (
                <TableHead key={entry.id} className="text-center min-w-24">
                  <div className="flex flex-col items-center">
                    <span>{format(parseISO(entry.entry_date), "MMM d")}</span>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs mt-1">Latest</Badge>
                    )}
                  </div>
                </TableHead>
              ))}
              {entriesWithMeasurements.length >= 2 && (
                <TableHead className="text-center min-w-20">Change</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {measurementKeys.map(key => {
              const hasData = entriesWithMeasurements.some(e => e[key] !== null);
              if (!hasData) return null;

              const latestValue = entriesWithMeasurements[0]?.[key];
              const previousValue = entriesWithMeasurements[1]?.[key];
              const change = getChange(latestValue, previousValue);

              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">{MEASUREMENT_LABELS[key]}</TableCell>
                  {entriesWithMeasurements.map(entry => (
                    <TableCell key={entry.id} className="text-center">
                      {formatMeasurement(entry[key])}
                      <span className="text-muted-foreground text-xs ml-1">{unit}</span>
                    </TableCell>
                  ))}
                  {entriesWithMeasurements.length >= 2 && (
                    <TableCell className="text-center">
                      {change.value !== null ? (
                        <div className={`flex items-center justify-center gap-1 ${
                          change.direction === 'down' ? 'text-green-500' : 
                          change.direction === 'up' ? 'text-amber-500' : 
                          'text-muted-foreground'
                        }`}>
                          {change.direction === 'down' && <TrendingDown className="w-3 h-3" />}
                          {change.direction === 'up' && <TrendingUp className="w-3 h-3" />}
                          {change.direction === 'same' && <Minus className="w-3 h-3" />}
                          <span className="text-sm">
                            {change.direction !== 'same' && (change.value > 0 ? '+' : '')}
                            {usesImperial ? cmToInches(change.value) : change.value}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
