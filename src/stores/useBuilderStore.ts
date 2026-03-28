import { create } from "zustand";

interface BuilderState {
  generatedHtml: string;
  htmlHistory: string[];
  historyIndex: number;
  selectedElement: HTMLElement | null;
  mode: "idle" | "edit-generated" | "preview";
  chatMessages: { id: string; role: string; content: string; timestamp: Date }[];
  
  setGeneratedHtml: (html: string) => void;
  pushHistory: (html: string) => void;
  undo: () => void;
  redo: () => void;
  setSelectedElement: (el: HTMLElement | null) => void;
  setMode: (mode: BuilderState["mode"]) => void;
  addChatMessage: (msg: Omit<BuilderState["chatMessages"][0], "id" | "timestamp">) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  generatedHtml: "",
  htmlHistory: [""],
  historyIndex: 0,
  selectedElement: null,
  mode: "idle",
  chatMessages: [],

  setGeneratedHtml: (html) => set({ generatedHtml: html }),
  
  pushHistory: (html) => {
    const { htmlHistory, historyIndex } = get();
    const newHistory = [...htmlHistory.slice(0, historyIndex + 1), html];
    set({ htmlHistory: newHistory, historyIndex: newHistory.length - 1, generatedHtml: html });
  },

  undo: () => {
    const { htmlHistory, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({ historyIndex: newIndex, generatedHtml: htmlHistory[newIndex] });
    }
  },

  redo: () => {
    const { htmlHistory, historyIndex } = get();
    if (historyIndex < htmlHistory.length - 1) {
      const newIndex = historyIndex + 1;
      set({ historyIndex: newIndex, generatedHtml: htmlHistory[newIndex] });
    }
  },

  setSelectedElement: (el) => set({ selectedElement: el }),
  setMode: (mode) => set({ mode }),
  
  addChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages, { ...msg, id: Date.now().toString(), timestamp: new Date() }],
  })),

  reset: () => set({
    generatedHtml: "",
    htmlHistory: [""],
    historyIndex: 0,
    selectedElement: null,
    mode: "idle",
    chatMessages: [],
  }),
}));
