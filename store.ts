import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, PromptSFL } from './types';

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      prompts: [],
      activePromptId: null,
      theme: 'light',
      // Defaulting to gemini-3-pro-preview as requested for Primary
      // Defaulting to gemini-3-pro-preview for Persona (mapping 2.5-pro request to latest Pro)
      primaryModel: 'gemini-3-pro-preview',
      personaModel: 'gemini-3-pro-preview',
      availableModels: [],
      
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
      setPrimaryModel: (model) => set({ primaryModel: model }),
      setPersonaModel: (model) => set({ personaModel: model }),
      setAvailableModels: (models) => set({ availableModels: models }),
    }),
    {
      name: 'sfl-narrative-storage',
      partialize: (state) => ({
        prompts: state.prompts,
        theme: state.theme,
        primaryModel: state.primaryModel,
        personaModel: state.personaModel
      }),
    }
  )
);