import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  disabled?: boolean;
  sending?: boolean;
  onSend: (blob: Blob, durationSeconds: number) => void;
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Records a real voice note (MediaRecorder) for coach <-> client communication. */
export function VoiceRecorder({ disabled, sending, onSend }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState<{ blob: Blob; url: string; duration: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => stopTimer, []);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording isn't supported on this device or browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        setClip({ blob, url: URL.createObjectURL(blob), duration });
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access was blocked. Allow it in your browser settings to send voice notes.");
    }
  }, []);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    stopTimer();
    setRecording(false);
  }, []);

  const discard = () => {
    if (clip) URL.revokeObjectURL(clip.url);
    setClip(null);
    setSeconds(0);
  };

  if (clip) {
    return (
      <div className="flex items-center gap-2 w-full">
        <audio src={clip.url} controls className="h-9 flex-1 min-w-0" />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-11 w-11 shrink-0"
          onClick={discard}
          aria-label="Discard voice note"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          className="h-11 w-11 shrink-0"
          disabled={sending}
          onClick={() => {
            onSend(clip.blob, clip.duration);
            URL.revokeObjectURL(clip.url);
            setClip(null);
            setSeconds(0);
          }}
          aria-label="Send voice note"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {recording && (
        <span className="text-xs tabular-nums text-destructive font-medium">
          {formatClock(seconds)}
        </span>
      )}
      <Button
        type="button"
        size="icon"
        variant={recording ? "destructive" : "ghost"}
        className="h-11 w-11 shrink-0"
        disabled={disabled}
        onClick={recording ? stop : start}
        aria-label={recording ? "Stop recording" : "Record voice note"}
      >
        {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
      {error && <span className="text-[11px] text-destructive max-w-[10rem]">{error}</span>}
    </div>
  );
}
