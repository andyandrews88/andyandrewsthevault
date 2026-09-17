import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Archive, ArchiveRestore, ChevronRight, Dumbbell, Loader2, Mail, Search, UserPlus, Library, ClipboardList, ChevronLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useCoachStore, RosterClient } from "@/stores/coachStore";
import { useEntitlement } from "@/hooks/useEntitlement";
import { TIER_LABEL } from "@/lib/entitlements";
import { AddClientDialog } from "@/components/coach/AddClientDialog";

function ClientRow({ client, onOpen, onArchive, onRestore }: {
  client: RosterClient;
  onOpen: () => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const initials = client.displayName.slice(0, 2).toUpperCase();
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left min-h-[44px]">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={client.avatarUrl || undefined} />
          <AvatarFallback className="text-xs bg-primary/15 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{client.displayName}</p>
            <Badge variant="outline" className="text-[10px] flex-shrink-0">{TIER_LABEL[client.tier]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {client.activeProgramName ?? "No assigned program"}
            {" · "}
            {client.lastWorkoutDate
              ? `Last session ${format(new Date(client.lastWorkoutDate), "MMM d")}`
              : "No sessions logged"}
          </p>
        </div>
      </button>
      <div className="flex items-center gap-1 flex-shrink-0">
        {client.status === "active" ? (
          <>
            <span className="text-xs font-mono text-muted-foreground tabular-nums mr-1" title="Completed sessions in the last 7 days">
              {client.completedLast7}/7d
            </span>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Archive client" onClick={onArchive}>
              <Archive className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Restore client" onClick={onRestore}>
            <ArchiveRestore className="h-4 w-4" />
          </Button>
        )}
        <button onClick={onOpen} className="p-2 text-muted-foreground" aria-label="Open client">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function CoachRoster() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { entitlement, isLoading: entLoading } = useEntitlement();
  const { clients, invites, isLoading, error, load, setRelationshipStatus, resendInvite, revokeInvite } = useCoachStore();
  const [view, setView] = useState<"active" | "archived" | "invites">("active");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) load(user.id);
  }, [user?.id, load]);

  useEffect(() => {
    if (!entLoading && !entitlement.isCoach) navigate("/vault", { replace: true });
  }, [entLoading, entitlement.isCoach, navigate]);

  const visibleClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .filter((c) => c.clientId !== user?.id) // Andy's own athlete profile is not a roster row
      .filter((c) => (view === "archived" ? c.status === "archived" : c.status === "active"))
      .filter((c) => !q || c.displayName.toLowerCase().includes(q));
  }, [clients, view, query, user?.id]);

  const pendingInvites = invites.filter((i) => i.status === "pending");

  const handleStatus = async (client: RosterClient, status: "active" | "archived") => {
    setBusyId(client.relationshipId);
    try {
      await setRelationshipStatus(client.relationshipId, status);
      toast.success(status === "archived" ? `${client.displayName} archived — history kept.` : `${client.displayName} restored.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update this client.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="container mx-auto max-w-3xl px-4 pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vault")} aria-label="Back to my Vault">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="section-label">COACH</p>
            <h1 className="text-xl font-bold leading-tight">Roster</h1>
          </div>
          <Button size="sm" className="gap-1.5 min-h-[44px]" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add client
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 flex-1 min-h-[44px]" onClick={() => navigate("/coach/programs")}>
            <ClipboardList className="h-4 w-4" />Programs
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 flex-1 min-h-[44px]" onClick={() => navigate("/admin/templates")}>
            <Dumbbell className="h-4 w-4" />Templates
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 flex-1 min-h-[44px]" onClick={() => navigate("/coach/movements")}>
            <Library className="h-4 w-4" />Movements
          </Button>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="invites" className="gap-1.5">
              Invites
              {pendingInvites.length > 0 && (
                <span className="text-[10px] rounded-full bg-primary/20 text-primary px-1.5">{pendingInvites.length}</span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {view !== "invites" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clients" className="pl-9" />
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!isLoading && view !== "invites" && (
          <div className="space-y-2">
            {visibleClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                {view === "active" ? "No active clients yet." : "No archived clients."}
              </p>
            ) : (
              visibleClients.map((c) => (
                <div key={c.relationshipId} className={busyId === c.relationshipId ? "opacity-60 pointer-events-none" : ""}>
                  <ClientRow
                    client={c}
                    onOpen={() => navigate(`/coach/client/${c.clientId}`)}
                    onArchive={() => handleStatus(c, "archived")}
                    onRestore={() => handleStatus(c, "active")}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {!isLoading && view === "invites" && (
          <div className="space-y-2">
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No invites sent yet.</p>
            ) : (
              invites.map((inv) => (
                <div key={inv.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-secondary flex-shrink-0"><Mail className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{inv.name}</p>
                        <Badge variant="outline" className="text-[10px]">{TIER_LABEL[inv.service_tier]}</Badge>
                        <Badge
                          variant={inv.status === "pending" ? "default" : "secondary"}
                          className="text-[10px] capitalize"
                        >
                          {inv.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Sent {format(new Date(inv.sent_at), "MMM d")}
                        {inv.resent_at ? ` · resent ${format(new Date(inv.resent_at), "MMM d")}` : ""}
                      </p>
                    </div>
                  </div>
                  {inv.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline" size="sm" className="flex-1 min-h-[44px]"
                        onClick={async () => {
                          setBusyId(inv.id);
                          try { await resendInvite(inv.id); toast.success("Invite resent."); }
                          catch (e) { toast.error(e instanceof Error ? e.message : "Could not resend."); }
                          finally { setBusyId(null); }
                        }}
                        disabled={busyId === inv.id}
                      >
                        Resend
                      </Button>
                      <Button
                        variant="outline" size="sm" className="flex-1 min-h-[44px] text-destructive"
                        onClick={async () => {
                          setBusyId(inv.id);
                          try { await revokeInvite(inv.id); toast.success("Invite revoked."); if (user) await load(user.id, true); }
                          catch (e) { toast.error(e instanceof Error ? e.message : "Could not revoke."); }
                          finally { setBusyId(null); }
                        }}
                        disabled={busyId === inv.id}
                      >
                        Revoke
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <AddClientDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onDone={() => { if (user) load(user.id, true); }}
      />
    </div>
  );
}
