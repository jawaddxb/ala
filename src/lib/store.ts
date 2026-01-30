import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Perspective, Intensity } from './prompts';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  neutralAnswer?: string;
  reflection?: string;
  perspectiveUsed?: Perspective;
  intensityUsed?: Intensity;
  timestamp: number;
}

interface AlaStore {
  // Preferences
  perspective: Perspective;
  intensity: Intensity;
  setPerspective: (p: Perspective) => void;
  setIntensity: (i: Intensity) => void;
  
  // Messages
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAlaStore = create<AlaStore>()(
  persist(
    (set) => ({
      // Default preferences
      perspective: 'none',
      intensity: 0,
      
      setPerspective: (perspective) => set({ perspective }),
      setIntensity: (intensity) => set({ intensity }),
      
      // Messages
      messages: [],
      addMessage: (msg) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...msg,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            },
          ],
        })),
      clearMessages: () => set({ messages: [] }),
      
      // UI
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'ala-store',
      partialize: (state) => ({
        perspective: state.perspective,
        intensity: state.intensity,
        // Don't persist messages for now
      }),
    }
  )
);
