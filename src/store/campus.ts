import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../utils/storage';
import type { Campus } from '../types';

interface CampusState {
  selectedCampus: Campus | null;
  setSelectedCampus: (campus: Campus | null) => void;
}

export const useCampusStore = create<CampusState>()(
  persist(
    (set) => ({
      selectedCampus: null,
      setSelectedCampus: (campus) => set({ selectedCampus: campus }),
    }),
    {
      name: 'campus-storage',
      storage: createJSONStorage(() => zustandAsyncStorage),
      partialize: (state) => ({ selectedCampus: state.selectedCampus }),
    }
  )
);
