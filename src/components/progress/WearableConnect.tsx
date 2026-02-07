import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Watch, 
  Link2, 
  Link2Off, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from "lucide-react";
import { useProgressStore } from "@/stores/progressStore";
import { 
  type WearableDevice, 
  WEARABLE_DEVICE_INFO 
} from "@/types/progress";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

// Device logos/icons as simple components
function WhoopIcon() {
  return (
    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
      <span className="text-white text-xs font-bold">W</span>
    </div>
  );
}

function GarminIcon() {
  return (
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
      <span className="text-primary-foreground text-xs font-bold">G</span>
    </div>
  );
}

function FitbitIcon() {
  return (
    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
      <span className="text-accent-foreground text-xs font-bold">F</span>
    </div>
  );
}

function AppleHealthIcon() {
  return (
    <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
      <span className="text-destructive-foreground text-xs">❤️</span>
    </div>
  );
}

const DEVICE_ICONS: Record<WearableDevice, () => JSX.Element> = {
  whoop: WhoopIcon,
  garmin: GarminIcon,
  fitbit: FitbitIcon,
  apple_health: AppleHealthIcon,
};

export function WearableConnect() {
  const { wearableConnections, isLoadingConnections, fetchWearableConnections } = useProgressStore();

  const getConnection = (device: WearableDevice) => {
    return wearableConnections.find(c => c.device_type === device);
  };

  const handleConnect = async (device: WearableDevice) => {
    // For now, show a message that OAuth setup is required
    toast.info(
      `${WEARABLE_DEVICE_INFO[device].name} integration requires API credentials. Contact your administrator to enable this feature.`,
      { duration: 5000 }
    );
  };

  const handleDisconnect = async (device: WearableDevice) => {
    toast.info("Disconnect functionality coming soon");
  };

  const handleSync = async (device: WearableDevice) => {
    toast.info("Manual sync functionality coming soon");
  };

  const devices: WearableDevice[] = ['whoop', 'garmin', 'fitbit', 'apple_health'];

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Watch className="w-5 h-5 text-primary" />
          Connected Devices
        </CardTitle>
        <CardDescription>
          Connect your wearables to automatically sync fitness data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {devices.map(device => {
            const connection = getConnection(device);
            const info = WEARABLE_DEVICE_INFO[device];
            const Icon = DEVICE_ICONS[device];
            const isConnected = connection?.is_connected;

            return (
              <div
                key={device}
                className={`p-4 rounded-lg border ${
                  isConnected 
                    ? 'border-primary/50 bg-primary/5' 
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon />
                    <div>
                      <h4 className="font-medium text-sm">{info.name}</h4>
                      {isConnected && (
                        <Badge variant="outline" className="text-xs text-primary border-primary/50">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {isConnected ? (
                  <div className="space-y-2">
                    {connection?.last_sync_at && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last sync: {format(parseISO(connection.last_sync_at), "MMM d, h:mm a")}
                      </p>
                    )}
                    {connection?.sync_error && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {connection.sync_error}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSync(device)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Sync
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDisconnect(device)}
                      >
                        <Link2Off className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {device === 'apple_health' 
                        ? 'Requires iOS companion app'
                        : `Track ${info.metrics.length} metrics`
                      }
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full"
                      onClick={() => handleConnect(device)}
                      disabled={device === 'apple_health'}
                    >
                      <Link2 className="w-3 h-3 mr-1" />
                      Connect
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Wearable integrations require API credentials. Once configured, your data will sync automatically.
        </p>
      </CardContent>
    </Card>
  );
}
