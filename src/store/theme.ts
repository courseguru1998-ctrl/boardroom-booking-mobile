import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appearance } from 'react-native';
import { zustandAsyncStorage } from '../utils/storage';
import { lightColors, darkColors, type ColorScheme } from '../constants/colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  getEffectiveTheme: () => 'light' | 'dark';
  getColors: () => ColorScheme;
}

const getSystemTheme = (): 'light' | 'dark' => {
  return Appearance.getColorScheme() || 'light';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',

      setMode: (mode) => set({ mode }),

      getEffectiveTheme: () => {
        const { mode } = get();
        if (mode === 'system') {
          return getSystemTheme();
        }
        return mode;
      },

      getColors: () => {
        const effectiveTheme = get().getEffectiveTheme();
        return effectiveTheme === 'dark' ? darkColors : lightColors;
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => zustandAsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
