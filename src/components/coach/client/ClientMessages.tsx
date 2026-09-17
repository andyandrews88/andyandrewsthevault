import { useEffect } from "react";
import { CalendarClock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DirectMessagePane } from "@/components/community/DirectMessagePane";
import { useCommunityStore } from "@/stores/communityStore";
import { useAuthStore } from "@/stores/authStore";
import { ServiceTier } from "@/lib/entitlements";

interface Props {
  clientId: string;
  clientName: string;
  tier: ServiceTier;
  status: "active" | "archived" | "pending";
}

export function ClientMessages({ clientId, clientName, tier, status }: Props) {
  const { user } = useAuthStore();
  const { fetchDirectMessages } = useCommunityStore();

  useEffect(() => {
    if (user) fetchDirectMessages(user.id);
  }, [user?.id, fetchDirectMessages]);

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

  if (status !== "active") {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
        <Lock className="h-7 w-7 mx-auto text-muted-foreground/60" />
        <p className="text-sm font-medium">Conversation archived</p>
        <p className="text-xs text-muted-foreground">
          History is preserved. Restore this client to resume messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[60vh] rounded-xl border border-border overflow-hidden">
      <DirectMessagePane conversationPartnerId={clientId} />
    </div>
  );
}
