import { create } from "zustand";

type AIState = {
  isOpen: boolean;
  isExpanded: boolean;
  conversationId: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
  setConversationId: (id: string | null) => void;
};

export const useAIStore = create<AIState>((set) => ({
  isOpen: false,
  isExpanded: false,
  conversationId: null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, isExpanded: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  expand: () => set({ isExpanded: true }),
  collapse: () => set({ isExpanded: false }),
  setConversationId: (id) => set({ conversationId: id }),
}));
