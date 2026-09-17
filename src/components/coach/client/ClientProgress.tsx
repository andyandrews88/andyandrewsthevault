import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { clientId: string }

interface BodyEntry {
  id: string;
  entry_date: string;
  weight_kg: number | null;
  body_fat_percent: number | null;
  lean_mass_kg: number | null;
  visceral_fat_rating: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  hips_cm: number | null;
  measurement_source: string | null;
  photo_paths: string[] | null;
  notes: string | null;
}

export function ClientProgress({ clientId }: Props) {
  const [entries, setEntries] = useState<BodyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string[]>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_body_entries")
        .select("id, entry_date, weight_kg, body_fat_percent, lean_mass_kg, visceral_fat_rating, waist_cm, chest_cm, hips_cm, measurement_source, photo_paths, notes")
        .eq("user_id", clientId)
        .order("entry_date", { ascending: false })
        .limit(40);
      if (cancelled) return;
      setEntries((data || []) as BodyEntry[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  /** Progress photos stay private — signed URLs are fetched only on demand. */
  const revealPhotos = async (entry: BodyEntry) => {
    if (!entry.photo_paths?.length || photoUrls[entry.id]) return;
    setLoadingPhotos(entry.id);
    const signed = await Promise.all(
      entry.photo_paths.map((p) => supabase.storage.from("progress-photos").createSignedUrl(p, 3600)),
    );
    setPhotoUrls((s) => ({
      ...s,
      [entry.id]: signed.map((r) => r.data?.signedUrl).filter(Boolean) as string[],
    }));
    setLoadingPhotos(null);
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No body data recorded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.id} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{format(new Date(e.entry_date), "EEE d MMM yyyy")}</p>
            {e.measurement_source && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{e.measurement_source}</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
            <div><p className="text-muted-foreground">Weight</p><p className="font-mono">{e.weight_kg ? `${e.weight_kg} kg` : "—"}</p></div>
            <div><p className="text-muted-foreground">Body fat</p><p className="font-mono">{e.body_fat_percent ? `${e.body_fat_percent}%` : "—"}</p></div>
            <div><p className="text-muted-foreground">Lean mass</p><p className="font-mono">{e.lean_mass_kg ? `${e.lean_mass_kg} kg` : "—"}</p></div>
            <div><p className="text-muted-foreground">Waist</p><p className="font-mono">{e.waist_cm ? `${e.waist_cm} cm` : "—"}</p></div>
            <div><p className="text-muted-foreground">Chest</p><p className="font-mono">{e.chest_cm ? `${e.chest_cm} cm` : "—"}</p></div>
            <div><p className="text-muted-foreground">Visceral</p><p className="font-mono">{e.visceral_fat_rating ?? "—"}</p></div>
          </div>
          {e.notes && <p className="text-xs text-muted-foreground mt-2">{e.notes}</p>}
          {!!e.photo_paths?.length && (
            <div className="mt-2">
              {photoUrls[e.id] ? (
                <div className="flex gap-2 overflow-x-auto">
                  {photoUrls[e.id].map((url) => (
                    <img key={url} src={url} alt="Progress photo" className="h-32 w-24 object-cover rounded-lg flex-shrink-0" loading="lazy" />
                  ))}
                </div>
              ) : (
                <Button variant="outline" size="sm" className="gap-1.5 min-h-[44px]" onClick={() => revealPhotos(e)} disabled={loadingPhotos === e.id}>
                  {loadingPhotos === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  View {e.photo_paths.length} photo{e.photo_paths.length > 1 ? "s" : ""}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
