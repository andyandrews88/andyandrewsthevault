import { create } from "zustand";
import type { MessageContextType } from "./conversationStore";

/**
 * Holds the one workout / food entry an athlete (or coach) tapped "Ask about this"
 * on, so the coaching conversation can open with that context attached.
 * Deliberately tiny — contextual comments are part of the private conversation,
 * not a separate comment system.
 */
export interface ComposeContext {
  type: MessageContextType;
  id: string;
  label: string;
}

interface ComposeContextState {
  context: ComposeContext | null;
  setContext: (context: ComposeContext) => void;
  clearContext: () => void;
}

export const useComposeContextStore = create<ComposeContextState>((set) => ({
  context: null,
  setContext: (context) => set({ context }),
  clearContext: () => set({ context: null }),
}));
