import { useEffect, useState } from "react";
import { Loader2, Mic } from "lucide-react";
import { useConversationStore } from "@/stores/conversationStore";

interface Props {
  path: string | null;
  localUrl?: string;
  durationSeconds: number | null;
  mine: boolean;
}

function formatClock(seconds: number | null) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Plays a private voice note via a short-lived signed URL. */
export function VoiceNotePlayer({ path, localUrl, durationSeconds, mine }: Props) {
  const getAudioUrl = useConversationStore((s) => s.getAudioUrl);
  const [url, setUrl] = useState<string | null>(localUrl ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (localUrl) {
      setUrl(localUrl);
      return;
    }
    if (!path) return;
    getAudioUrl(path).then((signed) => {
      if (cancelled) return;
      if (signed) setUrl(signed);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [path, localUrl, getAudioUrl]);

  if (failed) {
    return <p className="text-xs text-muted-foreground">Voice note unavailable</p>;
  }

  return (
    <div className="flex items-center gap-2 min-w-[11rem]">
      <Mic className={`h-3.5 w-3.5 shrink-0 ${mine ? "opacity-80" : "text-muted-foreground"}`} />
      {url ? (
        <audio src={url} controls preload="none" className="h-8 w-full max-w-[13rem]" />
      ) : (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      )}
      {durationSeconds ? (
        <span className="text-[10px] tabular-nums opacity-70">{formatClock(durationSeconds)}</span>
      ) : null}
    </div>
  );
}
