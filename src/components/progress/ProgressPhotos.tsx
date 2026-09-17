import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";

interface PhotoGroup {
  entryId: string;
  date: string;
  paths: string[];
}

export function ProgressPhotos() {
  const { user } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [groups, setGroups] = useState<PhotoGroup[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("user_body_entries")
      .select("id, entry_date, photo_paths")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .limit(24);

    const withPhotos = (data ?? [])
      .filter((e) => (e.photo_paths ?? []).length > 0)
      .map((e) => ({ entryId: e.id, date: e.entry_date, paths: e.photo_paths as string[] }));
    setGroups(withPhotos);

    const allPaths = withPhotos.flatMap((g) => g.paths);
    if (allPaths.length > 0) {
      const { data: signed } = await supabase.storage
        .from("progress-photos")
        .createSignedUrls(allPaths, 3600);
      const map: Record<string, string> = {};
      (signed ?? []).forEach((s) => {
        if (s.path && s.signedUrl) map[s.path] = s.signedUrl;
      });
      setUrls(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("progress-photos").upload(path, file);
        if (error) throw error;
        paths.push(path);
      }

      const { data: existing } = await supabase
        .from("user_body_entries")
        .select("id, photo_paths")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .maybeSingle();

      if (existing) {
        const merged = [...((existing.photo_paths as string[]) ?? []), ...paths];
        const { error } = await supabase
          .from("user_body_entries")
          .update({ photo_paths: merged })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_body_entries").insert({
          user_id: user.id,
          entry_date: today,
          photo_paths: paths,
          entry_source: "photo",
        });
        if (error) throw error;
      }

      toast.success("Photos saved — only you and your coach can see them");
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Could not upload those photos.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
      <Button
        variant="outline"
        className="w-full h-11"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
        Add progress photos
      </Button>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No progress photos yet. They stay private to you and your coach.
        </p>
      ) : (
        groups.map((g) => (
          <div key={g.entryId} className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {format(new Date(g.date), "d MMM yyyy")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {g.paths.map((p) =>
                urls[p] ? (
                  <img
                    key={p}
                    src={urls[p]}
                    alt={`Progress photo ${format(new Date(g.date), "d MMM yyyy")}`}
                    className="aspect-[3/4] w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div key={p} className="aspect-[3/4] w-full rounded-lg bg-muted" />
                )
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
