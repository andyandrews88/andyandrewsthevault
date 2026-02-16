import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Info, AlertTriangle, CheckCircle } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
}

export function AnnouncementBanner() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!user) return;

    async function fetch() {
      // Get active announcements
      const { data: active } = await supabase
        .from("announcements")
        .select("id, title, message, type")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      // Get user's dismissals
      const { data: dismissals } = await supabase
        .from("announcement_dismissals")
        .select("announcement_id")
        .eq("user_id", user.id);

      const dismissedIds = new Set((dismissals || []).map(d => d.announcement_id));
      setAnnouncements((active || []).filter(a => !dismissedIds.has(a.id)));
    }

    fetch();
  }, [user]);

  const dismiss = async (id: string) => {
    if (!user) return;
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    await supabase.from("announcement_dismissals").insert({
      announcement_id: id,
      user_id: user.id,
    });
  };

  if (announcements.length === 0) return null;

  const icons: Record<string, React.ReactNode> = {
    info: <Info className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
  };

  const variants: Record<string, "default" | "destructive"> = {
    info: "default",
    warning: "destructive",
    success: "default",
  };

  return (
    <div className="space-y-2">
      {announcements.map(a => (
        <Alert key={a.id} variant={variants[a.type] || "default"} className="relative pr-10">
          {icons[a.type]}
          <AlertTitle className="text-sm font-medium">{a.title}</AlertTitle>
          <AlertDescription className="text-xs">{a.message}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => dismiss(a.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
