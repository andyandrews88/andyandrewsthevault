import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, Archive, ArchiveRestore } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useEntitlement } from "@/hooks/useEntitlement";
import { useCoachStore } from "@/stores/coachStore";
import { ServiceTier } from "@/lib/entitlements";
import { ClientOverview, OverviewData } from "@/components/coach/client/ClientOverview";
import { ClientTraining } from "@/components/coach/client/ClientTraining";
import { ClientNutrition } from "@/components/coach/client/ClientNutrition";
import { ClientProgress } from "@/components/coach/client/ClientProgress";
import { ClientMessages } from "@/components/coach/client/ClientMessages";
import { AssignTemplateWizard } from "@/components/admin/AssignTemplateWizard";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface Header {
  displayName: string;
  avatarUrl: string | null;
  tier: ServiceTier;
  status: "active" | "archived" | "pending";
  relationshipId: string;
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function CoachClient() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { entitlement, isLoading: entLoading } = useEntitlement();
  const { setRelationshipStatus, load } = useCoachStore();
  const { unreadCount: unreadFromClient } = useUnreadMessages(clientId);

  const [header, setHeader] = useState<Header | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");
  const [assignOpen, setAssignOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!entLoading && !entitlement.isCoach) navigate("/vault", { replace: true });
  }, [entLoading, entitlement.isCoach, navigate]);

  /** Single data load for the header + overview snapshot. */
  useEffect(() => {
    if (!clientId || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [relRes, profileRes, workoutRes, foodRes, targetRes, bodyRes, dmRes] = await Promise.all([
          supabase
            .from("coach_client_relationships")
            .select("id, service_tier, status")
            .eq("coach_id", user.id)
            .eq("client_id", clientId)
            .maybeSingle(),
          supabase.from("user_profiles").select("display_name, avatar_url").eq("id", clientId).maybeSingle(),
          supabase
            .from("workouts")
            .select("date, is_completed")
            .eq("user_id", clientId)
            .eq("is_completed", true)
            .gte("date", daysAgoIso(28))
            .order("date", { ascending: false }),
          supabase
            .from("user_food_diary")
            .select("entry_date")
            .eq("user_id", clientId)
            .order("entry_date", { ascending: false })
            .limit(1),
          supabase.from("nutrition_targets").select("id").eq("user_id", clientId).limit(1),
          supabase
            .from("user_body_entries")
            .select("entry_date, weight_kg, body_fat_percent")
            .eq("user_id", clientId)
            .order("entry_date", { ascending: false })
            .limit(1),
          supabase
            .from("direct_messages")
            .select("id", { count: "exact", head: true })
            .eq("from_user_id", clientId)
            .eq("to_user_id", user.id)
            .eq("is_read", false),
        ]);

        if (cancelled) return;

        if (!relRes.data) {
          setError("You do not coach this client.");
          setLoading(false);
          return;
        }

        const enrollRes = await supabase
          .from("user_program_enrollments")
          .select("program:programs(name)")
          .eq("user_id", clientId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();

        const completed = workoutRes.data || [];
        const sevenDaysAgo = daysAgoIso(7);

        setHeader({
          displayName: profileRes.data?.display_name || "Client",
          avatarUrl: profileRes.data?.avatar_url || null,
          tier: relRes.data.service_tier as ServiceTier,
          status: relRes.data.status as Header["status"],
          relationshipId: relRes.data.id,
        });
        setOverview({
          completedLast7: completed.filter((w: any) => w.date >= sevenDaysAgo).length,
          completedLast28: completed.length,
          lastWorkoutDate: (completed[0] as any)?.date ?? null,
          activeProgramName: (enrollRes.data as any)?.program?.name ?? null,
          lastFoodLogDate: foodRes.data?.[0]?.entry_date ?? null,
          hasNutritionTarget: (targetRes.data || []).length > 0,
          latestBodyEntry: (bodyRes.data?.[0] as any) ?? null,
          unreadFromClient: dmRes.count ?? 0,
        });
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load this client.");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId, user?.id]);

  const toggleArchive = async () => {
    if (!header) return;
    const next = header.status === "active" ? "archived" : "active";
    setBusy(true);
    try {
      await setRelationshipStatus(header.relationshipId, next);
      setHeader({ ...header, status: next });
      if (user) await load(user.id, true);
      toast.success(next === "archived" ? "Client archived — all history kept." : "Client restored.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update this client.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || entLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (error || !header || !overview || !clientId) {
    return (
      <div className="min-h-screen bg-background px-4 pt-10 text-center space-y-4">
        <p className="text-destructive text-sm">{error || "Client not found."}</p>
        <Button variant="outline" onClick={() => navigate("/coach")}>Back to roster</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="container mx-auto max-w-3xl px-4 pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/coach")} aria-label="Back to roster">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-11 w-11">
            <AvatarImage src={header.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/15 text-primary text-xs">
              {header.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="section-label">CLIENT</p>
            <h1 className="text-lg font-bold leading-tight truncate">{header.displayName}</h1>
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11" onClick={toggleArchive} disabled={busy}
            aria-label={header.status === "active" ? "Archive client" : "Restore client"}>
            {header.status === "active" ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              Messages
              {unreadFromClient > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {unreadFromClient}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <ClientOverview tier={header.tier} status={header.status} data={overview} />
          </TabsContent>
          <TabsContent value="training" className="mt-4">
            {tab === "training" && (
              <ClientTraining
                clientId={clientId}
                clientName={header.displayName}
                tier={header.tier}
                onAssignProgram={() => setAssignOpen(true)}
              />
            )}
          </TabsContent>
          <TabsContent value="nutrition" className="mt-4">
            {tab === "nutrition" && <ClientNutrition clientId={clientId} tier={header.tier} />}
          </TabsContent>
          <TabsContent value="progress" className="mt-4">
            {tab === "progress" && <ClientProgress clientId={clientId} />}
          </TabsContent>
          <TabsContent value="messages" className="mt-4">
            {tab === "messages" && (
              <ClientMessages
                clientId={clientId}
                clientName={header.displayName}
                tier={header.tier}
                status={header.status}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AssignTemplateWizard
        open={assignOpen}
        onOpenChange={setAssignOpen}
        targetUserId={clientId}
        targetDisplayName={header.displayName}
      />
    </div>
  );
}
