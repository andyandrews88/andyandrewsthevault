import { CalendarClock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Conversation } from "@/components/messaging/Conversation";
import { useComposeContextStore } from "@/stores/composeContextStore";
import { ServiceTier } from "@/lib/entitlements";

interface Props {
  clientId: string;
  clientName: string;
  tier: ServiceTier;
  status: "active" | "archived" | "pending";
}

export function ClientMessages({ clientId, clientName, tier, status }: Props) {
  const { context, clearContext } = useComposeContextStore();


  if (tier === "tier_2") {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
        <CalendarClock className="h-7 w-7 mx-auto text-muted-foreground/60" />
        <p className="text-sm font-medium">No ongoing coaching thread</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {clientName} is on Tier 2 (curated programs). Their route to your time is a paid coaching call — booking and
          payment arrive in a later phase.
        </p>
        <Button variant="outline" size="sm" className="min-h-[44px]" disabled>
          Paid call booking — coming soon
        </Button>
      </div>
    );
  }

  const active = status === "active";

  return (
    <div className="space-y-2">
      {!active && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Archived — history is preserved. Restore {clientName} to resume messaging.
          </p>
        </div>
      )}
      <div className="h-[60vh] rounded-xl border border-border overflow-hidden">
        <Conversation
          partnerId={clientId}
          partnerName={clientName}
          canSend={active}
          disabledReason="This client is archived. Restore them to send messages."
          composeContext={context}
          onClearContext={clearContext}
        />
      </div>
    </div>
  );
}
