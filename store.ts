import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, PromptSFL } from './types';

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      prompts: [],
      activePromptId: null,
      theme: 'light',
      addPrompt: (prompt) => set((state) => ({ prompts: [prompt, ...state.prompts] })),
      updatePrompt: (id, updates) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        })),
      setActivePrompt: (id) => set({ activePromptId: id }),
      deletePrompt: (id) =>
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
          activePromptId: state.activePromptId === id ? null : state.activePromptId,
        })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'sfl-narrative-storage',
    }
  )
);