import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import {
  useConversationStore,
  type ConversationMessage,
  type MessageContextType,
} from "@/stores/conversationStore";
import { VoiceRecorder } from "./VoiceRecorder";
import { VoiceNotePlayer } from "./VoiceNotePlayer";
import { ContextChip } from "./ContextChip";

interface Props {
  partnerId: string;
  partnerName: string;
  /** false when the relationship is archived or the tier has no live coaching */
  canSend: boolean;
  disabledReason?: string;
  /** pre-attach a workout / meal context to the next message */
  composeContext?: { type: MessageContextType; id: string; label: string } | null;
  onClearContext?: () => void;
  autoFocus?: boolean;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function Conversation({
  partnerId,
  partnerName,
  canSend,
  disabledReason,
  composeContext,
  onClearContext,
  autoFocus,
}: Props) {
  const { user } = useAuthStore();
  const { messages, isLoading, load, subscribe, sendText, sendVoice, retry, discard, markRead, reset } =
    useConversationStore();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    load(user.id, partnerId).then(() => markRead(user.id, partnerId));
    const unsub = subscribe(user.id, partnerId);
    return () => {
      unsub();
      reset();
    };
  }, [user?.id, partnerId, load, subscribe, markRead, reset]);

  // Mark incoming messages read while the thread is open.
  useEffect(() => {
    if (!user) return;
    const hasUnread = messages.some(
      (m) => m.to_user_id === user.id && m.from_user_id === partnerId && !m.is_read
    );
    if (hasUnread) markRead(user.id, partnerId);
  }, [messages, user?.id, partnerId, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const grouped = useMemo(() => {
    const out: { day: string; items: ConversationMessage[] }[] = [];
    for (const m of messages) {
      const day = dayLabel(m.created_at);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(m);
      else out.push({ day, items: [m] });
    }
    return out;
  }, [messages]);

  const context = composeContext ? { type: composeContext.type, id: composeContext.id } : undefined;

  const handleSend = useCallback(async () => {
    if (!user || !draft.trim()) return;
    setSending(true);
    const text = draft.trim();
    setDraft("");
    const ok = await sendText(user.id, partnerId, text, context);
    if (ok) onClearContext?.();
    setSending(false);
  }, [user, draft, partnerId, sendText, context, onClearContext]);

  const handleVoice = useCallback(
    async (blob: Blob, duration: number) => {
      if (!user) return;
      setSending(true);
      const ok = await sendVoice(user.id, partnerId, blob, duration, context);
      if (ok) onClearContext?.();
      setSending(false);
    },
    [user, partnerId, sendVoice, context, onClearContext]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4">
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm font-medium">Start of your conversation</p>
            <p className="text-xs text-muted-foreground mt-1">
              Private between you and {partnerName}.
            </p>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.day} className="space-y-2">
            <div className="flex justify-center">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-secondary/60 rounded-full px-2 py-0.5">
                {group.day}
              </span>
            </div>
            {group.items.map((m) => {
              const mine = m.from_user_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    } ${m.failed ? "opacity-70 ring-1 ring-destructive" : ""}`}
                  >
                    {m.context_type && m.context_id && (
                      <ContextChip type={m.context_type} id={m.context_id} mine={mine} />
                    )}

                    {m.kind === "voice" ? (
                      <VoiceNotePlayer
                        path={m.audio_path}
                        localUrl={m.localAudioUrl}
                        durationSeconds={m.audio_duration_seconds}
                        mine={mine}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    )}

                    <div className="flex items-center gap-2 justify-end mt-1">
                      <span className="text-[10px] opacity-60">{timeLabel(m.created_at)}</span>
                      {mine && m.pending && <Loader2 className="h-3 w-3 animate-spin opacity-70" />}
                      {mine && !m.pending && !m.failed && (
                        <span className="text-[10px] opacity-60">{m.is_read ? "Read" : "Sent"}</span>
                      )}
                    </div>

                    {m.failed && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <AlertCircle className="h-3 w-3 text-destructive" />
                        <span className="text-[10px] text-destructive">Not sent</span>
                        <button
                          className="text-[10px] underline min-h-[24px]"
                          onClick={() => user && retry(m.id, user.id)}
                        >
                          <RotateCcw className="h-3 w-3 inline mr-0.5" />
                          Retry
                        </button>
                        <button
                          className="text-[10px] underline min-h-[24px]"
                          onClick={() => discard(m.id)}
                        >
                          Discard
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {canSend ? (
        <div className="border-t border-border bg-background px-3 py-2 space-y-2">
          {composeContext && (
            <div className="flex items-center gap-2 rounded-md bg-secondary/60 px-2 py-1.5 text-[11px]">
              <span className="truncate">About: {composeContext.label}</span>
              <button
                className="ml-auto text-muted-foreground"
                onClick={onClearContext}
                aria-label="Remove context"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              autoFocus={autoFocus}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${partnerName}`}
              rows={1}
              className="min-h-[44px] max-h-32 resize-none"
            />
            <VoiceRecorder sending={sending} onSend={handleVoice} />
            <Button
              size="icon"
              className="h-11 w-11 shrink-0"
              disabled={!draft.trim() || sending}
              onClick={handleSend}
              aria-label="Send message"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border bg-background px-4 py-3">
          <p className="text-xs text-muted-foreground text-center">
            {disabledReason ?? "Messaging is not available on this account."}
          </p>
        </div>
      )}
    </div>
  );
}
