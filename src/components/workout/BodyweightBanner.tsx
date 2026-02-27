import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export function BodyweightBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkBodyWeight();
  }, []);

  const checkBodyWeight = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const { count } = await supabase
      .from('user_body_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .not('weight_kg', 'is', null)
      .gte('entry_date', thirtyDaysAgo);

    setShow((count ?? 0) === 0);
  };

  if (!show || dismissed) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs">
      <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
      <p className="text-warning flex-1">
        Log your body weight in <span className="font-medium">Progress</span> for accurate volume tracking on bodyweight exercises.
      </p>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
