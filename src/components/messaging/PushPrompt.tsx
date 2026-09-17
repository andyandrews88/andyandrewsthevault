import { useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebPush } from "@/hooks/useWebPush";
import { useToast } from "@/hooks/use-toast";

const DISMISS_KEY = "vault_push_prompt_dismissed";

/**
 * Contextual, user-initiated push opt-in.
 * The browser permission prompt only appears after the user taps "Turn on".
 */
export function PushPrompt() {
  const { isSupported, isSubscribed, permission, loading, subscribe } = useWebPush();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "true"
  );

  if (!isSupported || isSubscribed || dismissed || permission === "denied") return null;

  const enable = async () => {
    const ok = await subscribe();
    toast(
      ok
        ? { title: "Notifications on", description: "You'll be alerted about new coach messages." }
        : {
            title: "Notifications not enabled",
            description: "Your device or browser blocked the request.",
            variant: "destructive",
          }
    );
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
      <p className="text-xs text-muted-foreground flex-1">
        Get notified when a new message arrives.
      </p>
      <Button size="sm" className="min-h-[36px]" disabled={loading} onClick={enable}>
        Turn on
      </Button>
      <button
        aria-label="Dismiss"
        className="text-muted-foreground p-1"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "true");
          setDismissed(true);
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
