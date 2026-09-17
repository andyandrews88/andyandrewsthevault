import { useEffect, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useCommunityStore } from "@/stores/communityStore";
import { DirectMessagePane } from "@/components/community/DirectMessagePane";

export function CoachTab() {
  const { user } = useAuthStore();
  const { fetchDirectMessages } = useCommunityStore();
  const [coachId, setCoachId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("coach_client_relationships")
        .select("coach_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (!active) return;
      setCoachId(data?.coach_id ?? null);
      setLoading(false);
    })();
    fetchDirectMessages(user.id);
    return () => {
      active = false;
    };
  }, [user, fetchDirectMessages]);

  if (loading) {
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

  return (
    <div className="h-[calc(100vh-11rem)]">
      <DirectMessagePane conversationPartnerId={coachId} />
    </div>
  );
}
