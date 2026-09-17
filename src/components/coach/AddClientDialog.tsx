import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useCoachStore } from "@/stores/coachStore";
import { ServiceTier, TIER_DESCRIPTION, TIER_LABEL } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

export function AddClientDialog({ open, onOpenChange, onDone }: Props) {
  const { createInvite } = useCoachStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<ServiceTier>("tier_1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setTier("tier_1");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are both required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { linkedExisting } = await createInvite(name.trim(), email.trim(), tier);
      toast.success(
        linkedExisting
          ? "This person already had an account — they're now linked to you."
          : "Invite email sent.",
      );
      reset();
      onOpenChange(false);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the invite.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Add client
          </DialogTitle>
          <DialogDescription>
            They receive an email invite, set their password and land linked to you at this tier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="client-name">Name</Label>
            <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Service tier</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["tier_1", "tier_2"] as ServiceTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={cn(
                    "rounded-lg border p-3 text-left min-h-[64px] transition-colors",
                    tier === t ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50",
                  )}
                >
                  <p className="text-sm font-semibold">{TIER_LABEL[t]}</p>
                  <p className="text-xs text-muted-foreground">{TIER_DESCRIPTION[t]}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full min-h-[44px]" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
