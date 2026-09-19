import { useEffect, useState } from "react";
import { CalendarClock, Loader2, MessageSquare, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useEntitlement } from "@/hooks/useEntitlement";
import { hasLiveCoaching, showsPaidCallCta } from "@/lib/entitlements";
import { Conversation } from "@/components/messaging/Conversation";
import { PushPrompt } from "@/components/messaging/PushPrompt";
import { useComposeContextStore } from "@/stores/composeContextStore";

/**
 * Athlete Coach tab.
 * Tier 1 (active): the one continuous private conversation with Andy.
 * Tier 2: no ongoing chat — paid coaching call CTA.
 * Archived: history stays readable, sending disabled.
 */
export function CoachTab() {
  const { user } = useAuthStore();
  const { entitlement, isLoading } = useEntitlement();
  const [coachName, setCoachName] = useState("your coach");
  const { context, clearContext } = useComposeContextStore();

  const coachId = entitlement.coachId;

  useEffect(() => {
    if (!coachId) return;
    let active = true;
    supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", coachId)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.display_name) setCoachName(data.display_name);
      });
    return () => {
      active = false;
    };
  }, [coachId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!coachId || coachId === user?.id) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50" />
        <p className="text-sm font-medium mt-2">No coach conversation yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your coaching thread appears here once your coaching is active.
        </p>
      </div>
    );
  }

  if (showsPaidCallCta(entitlement)) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        <CalendarClock className="h-8 w-8 mx-auto text-muted-foreground/60" />
        <div>
          <p className="text-sm font-medium">Book a paid coaching call with Andy</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Your plan covers curated programs and full logging. For direct time with Andy, book a
            one-to-one coaching call.
          </p>
        </div>
        <Button variant="outline" className="min-h-[44px]" disabled>
          Booking opens soon
        </Button>
      </div>
    );
  }

  const canSend = hasLiveCoaching(entitlement);

  return (
    <div className="space-y-3">
      {canSend && <PushPrompt />}
      {!canSend && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Your coaching is paused. Your history is safe — messaging resumes when it restarts.
          </p>
        </div>
      )}
      <div className="h-[calc(100vh-13rem)] rounded-xl border border-border overflow-hidden bg-card">
        <Conversation
          partnerId={coachId}
          partnerName={coachName}
          canSend={canSend}
          disabledReason="Messaging is paused while your coaching is inactive."
          composeContext={context}
          onClearContext={clearContext}
        />
      </div>
    </div>
  );
}
