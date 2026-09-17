import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single source of truth for the private coach <-> client conversation.
 *
 * One continuous thread per (coach, client) pair, built from `direct_messages`.
 * Used by both the athlete Coach tab and the coach client workspace Messages tab —
 * there is no parallel messaging system.
 */

export type MessageKind = "text" | "voice";
export type MessageContextType = "workout" | "food_entry";

export interface ConversationMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  kind: MessageKind;
  audio_path: string | null;
  audio_duration_seconds: number | null;
  is_read: boolean;
  read_at: string | null;
  context_type: MessageContextType | null;
  context_id: string | null;
  created_at: string;
  /** client-side only */
  pending?: boolean;
  failed?: boolean;
  localAudioUrl?: string;
}

interface OutboxItem {
  tempId: string;
  partnerId: string;
  content: string;
  kind: MessageKind;
  audioPath: string | null;
  audioDuration: number | null;
  contextType: MessageContextType | null;
  contextId: string | null;
}

interface ConversationState {
  partnerId: string | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  outbox: Record<string, OutboxItem>;
  signedAudio: Record<string, string>;

  load: (userId: string, partnerId: string) => Promise<void>;
  subscribe: (userId: string, partnerId: string) => () => void;
  sendText: (
    userId: string,
    partnerId: string,
    content: string,
    context?: { type: MessageContextType; id: string }
  ) => Promise<boolean>;
  sendVoice: (
    userId: string,
    partnerId: string,
    blob: Blob,
    durationSeconds: number,
    context?: { type: MessageContextType; id: string }
  ) => Promise<boolean>;
  retry: (tempId: string, userId: string) => Promise<boolean>;
  discard: (tempId: string) => void;
  markRead: (userId: string, partnerId: string) => Promise<void>;
  getAudioUrl: (path: string) => Promise<string | null>;
  reset: () => void;
}

function rowToMessage(row: Record<string, unknown>): ConversationMessage {
  return {
    id: row.id as string,
    from_user_id: row.from_user_id as string,
    to_user_id: row.to_user_id as string,
    content: (row.content as string) ?? "",
    kind: ((row.kind as string) ?? "text") as MessageKind,
    audio_path: (row.audio_path as string) ?? null,
    audio_duration_seconds: (row.audio_duration_seconds as number) ?? null,
    is_read: Boolean(row.is_read),
    read_at: (row.read_at as string) ?? null,
    context_type: (row.context_type as MessageContextType) ?? null,
    context_id: (row.context_id as string) ?? null,
    created_at: row.created_at as string,
  };
}

function sortByTime(a: ConversationMessage, b: ConversationMessage) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

async function notifyRecipient(partnerId: string, preview: string) {
  try {
    await supabase.functions.invoke("notify-user", {
      body: { type: "message", recipientId: partnerId, preview },
    });
  } catch {
    // Push is best-effort — never block or fail a message on notification errors.
  }
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  partnerId: null,
  messages: [],
  isLoading: false,
  error: null,
  outbox: {},
  signedAudio: {},

  reset: () => set({ partnerId: null, messages: [], outbox: {}, error: null }),

  load: async (userId, partnerId) => {
    set({ isLoading: true, error: null, partnerId });
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(from_user_id.eq.${userId},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }

    const pending = get().messages.filter((m) => m.pending || m.failed);
    set({
      messages: [...(data ?? []).map(rowToMessage), ...pending],
      isLoading: false,
    });
  },

  subscribe: (userId, partnerId) => {
    const channel = supabase
      .channel(`dm:${[userId, partnerId].sort().join(":")}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, unknown> | null;
          if (!row) return;
          const from = row.from_user_id as string;
          const to = row.to_user_id as string;
          const inThread =
            (from === userId && to === partnerId) || (from === partnerId && to === userId);
          if (!inThread) return;

          if (payload.eventType === "DELETE") {
            set((s) => ({ messages: s.messages.filter((m) => m.id !== row.id) }));
            return;
          }

          const msg = rowToMessage(row);
          set((s) => {
            const exists = s.messages.some((m) => m.id === msg.id);
            const messages = exists
              ? s.messages.map((m) => (m.id === msg.id ? { ...m, ...msg } : m))
              : [...s.messages, msg];
            return { messages: messages.sort(sortByTime) };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  sendText: async (userId, partnerId, content, context) => {
    const trimmed = content.trim();
    if (!trimmed) return false;
    const tempId = `tmp-${crypto.randomUUID()}`;
    const item: OutboxItem = {
      tempId,
      partnerId,
      content: trimmed,
      kind: "text",
      audioPath: null,
      audioDuration: null,
      contextType: context?.type ?? null,
      contextId: context?.id ?? null,
    };
    set((s) => ({
      outbox: { ...s.outbox, [tempId]: item },
      messages: [
        ...s.messages,
        {
          id: tempId,
          from_user_id: userId,
          to_user_id: partnerId,
          content: trimmed,
          kind: "text",
          audio_path: null,
          audio_duration_seconds: null,
          is_read: false,
          read_at: null,
          context_type: item.contextType,
          context_id: item.contextId,
          created_at: new Date().toISOString(),
          pending: true,
        },
      ],
    }));
    return get().retry(tempId, userId);
  },

  sendVoice: async (userId, partnerId, blob, durationSeconds, context) => {
    const tempId = `tmp-${crypto.randomUUID()}`;
    const localUrl = URL.createObjectURL(blob);
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: tempId,
          from_user_id: userId,
          to_user_id: partnerId,
          content: "Voice note",
          kind: "voice",
          audio_path: null,
          audio_duration_seconds: Math.max(1, Math.round(durationSeconds)),
          is_read: false,
          read_at: null,
          context_type: context?.type ?? null,
          context_id: context?.id ?? null,
          created_at: new Date().toISOString(),
          pending: true,
          localAudioUrl: localUrl,
        },
      ],
    }));

    // Voice notes live in the private `voice-notes` bucket under the sender's folder.
    const path = `${userId}/${crypto.randomUUID()}.webm`;
    const { error: upErr } = await supabase.storage
      .from("voice-notes")
      .upload(path, blob, { contentType: blob.type || "audio/webm", upsert: false });

    if (upErr) {
      set((s) => ({
        error: upErr.message,
        messages: s.messages.map((m) =>
          m.id === tempId ? { ...m, pending: false, failed: true } : m
        ),
      }));
      return false;
    }

    const item: OutboxItem = {
      tempId,
      partnerId,
      content: "Voice note",
      kind: "voice",
      audioPath: path,
      audioDuration: Math.max(1, Math.round(durationSeconds)),
      contextType: context?.type ?? null,
      contextId: context?.id ?? null,
    };
    set((s) => ({ outbox: { ...s.outbox, [tempId]: item } }));
    return get().retry(tempId, userId);
  },

  retry: async (tempId, userId) => {
    const item = get().outbox[tempId];
    if (!item) return false;

    set((s) => ({
      error: null,
      messages: s.messages.map((m) =>
        m.id === tempId ? { ...m, pending: true, failed: false } : m
      ),
    }));

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        from_user_id: userId,
        to_user_id: item.partnerId,
        content: item.content,
        kind: item.kind,
        audio_path: item.audioPath,
        audio_duration_seconds: item.audioDuration,
        context_type: item.contextType,
        context_id: item.contextId,
      })
      .select()
      .single();

    if (error || !data) {
      set((s) => ({
        error: error?.message ?? "Message failed to send",
        messages: s.messages.map((m) =>
          m.id === tempId ? { ...m, pending: false, failed: true } : m
        ),
      }));
      return false;
    }

    const saved = rowToMessage(data as Record<string, unknown>);
    set((s) => {
      const { [tempId]: _removed, ...rest } = s.outbox;
      const withoutTemp = s.messages.filter((m) => m.id !== tempId && m.id !== saved.id);
      return { outbox: rest, messages: [...withoutTemp, saved].sort(sortByTime) };
    });

    void notifyRecipient(item.partnerId, item.kind === "voice" ? "Voice note" : item.content);
    return true;
  },

  discard: (tempId) =>
    set((s) => {
      const { [tempId]: _removed, ...rest } = s.outbox;
      return { outbox: rest, messages: s.messages.filter((m) => m.id !== tempId) };
    }),

  markRead: async (userId, partnerId) => {
    const unread = get().messages.filter(
      (m) => m.to_user_id === userId && m.from_user_id === partnerId && !m.is_read && !m.pending
    );
    if (unread.length === 0) return;
    const now = new Date().toISOString();
    set((s) => ({
      messages: s.messages.map((m) =>
        m.to_user_id === userId && m.from_user_id === partnerId
          ? { ...m, is_read: true, read_at: m.read_at ?? now }
          : m
      ),
    }));
    await supabase
      .from("direct_messages")
      .update({ is_read: true, read_at: now })
      .eq("to_user_id", userId)
      .eq("from_user_id", partnerId)
      .eq("is_read", false);
  },

  getAudioUrl: async (path) => {
    const cached = get().signedAudio[path];
    if (cached) return cached;
    const { data, error } = await supabase.storage.from("voice-notes").createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return null;
    set((s) => ({ signedAudio: { ...s.signedAudio, [path]: data.signedUrl } }));
    return data.signedUrl;
  },
}));

/** Unread messages received by this user, optionally from one partner. */
export async function fetchUnreadCount(userId: string, fromUserId?: string): Promise<number> {
  let q = supabase
    .from("direct_messages")
    .select("id", { count: "exact", head: true })
    .eq("to_user_id", userId)
    .eq("is_read", false);
  if (fromUserId) q = q.eq("from_user_id", fromUserId);
  const { count } = await q;
  return count ?? 0;
}
