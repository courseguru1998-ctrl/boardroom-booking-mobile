import { useThemeStore } from '../store/theme';
import type { ColorScheme } from '../constants/colors';

export function useTheme() {
  const mode = useThemeStore((state) => state.mode);
  const getEffectiveTheme = useThemeStore((state) => state.getEffectiveTheme);
  const getColors = useThemeStore((state) => state.getColors);
  const setMode = useThemeStore((state) => state.setMode);

  const colors = getColors();
  const effectiveTheme = getEffectiveTheme();
  const isDark = effectiveTheme === 'dark';

  return {
    mode,
    setMode,
    colors,
    isDark,
  };
}

export type { ColorScheme };
