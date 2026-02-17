// JGI University Boardroom - Unified Theme System
// Brand Colors: Navy Blue (#001c54) & Gold (#c9a227)
// Design Philosophy: Same brand, different ambiance - Matching web app exactly

// ============================================
// LIGHT MODE - Warm, professional, inviting
// ============================================
export const lightColors = {
  // Backgrounds - Warm off-white with subtle warmth
  background: '#FAFAFA',
  backgroundSecondary: '#F5F5F0',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0EDE8',

  // Cards - Clean white with subtle depth
  card: '#FFFFFF',
  cardForeground: '#111827',

  // Text Hierarchy - JGI Navy based
  text: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',

  // Primary - JGI Prussian Blue (#001c54)
  primary: '#001c54',
  primaryHover: '#002366',
  primaryForeground: '#FFF9E6',
  primaryLight: '#E6EAF3',

  // Secondary - Subtle navy tint
  secondary: '#E5E7EB',
  secondaryForeground: '#111827',

  // Muted - Warm gray
  muted: '#F3F0EB',
  mutedForeground: '#6B7280',

  // Accent - JGI Gold (#c9a227)
  accent: '#c9a227',
  accentSubtle: '#FDF6E3',
  accentForeground: '#111827',

  // Secondary Accent - Warm orange
  accentOrange: '#F97316',
  accentOrangeSubtle: '#FFF7ED',

  // Semantic Colors - Vibrant but harmonious
  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
  destructiveLight: '#FEE2E2',
  // Aliases for backward compatibility
  error: '#DC2626',
  errorLight: '#FEE2E2',

  success: '#059669',
  successBg: '#ECFDF5',
  successForeground: '#FFFFFF',
  successLight: '#ECFDF5',

  warning: '#D97706',
  warningBg: '#FFFBEB',
  warningForeground: '#111827',
  warningLight: '#FFFBEB',

  // UI Elements
  border: '#E5E7EB',
  borderFocused: '#001c54',
  input: '#E5E7EB',
  ring: '#001c54',

  // Tab Bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  tabBarInactive: '#9CA3AF',

  // Status
  statusConfirmed: '#059669',
  statusCancelled: '#DC2626',
  statusPending: '#D97706',
  statusWaiting: '#7C3AED',

  // JGI Brand
  jgiBlue: '#001c54',
  jgiBlueLight: '#002d80',
  jgiBlueDark: '#001040',
  jgiGold: '#c9a227',
  jgiGoldLight: '#d4b03a',
  jgiGoldDark: '#a68820',

  // Shadows
  shadowColor: 'rgba(0, 28, 84, 0.1)',
  shadowSoft: '0 1px 2px rgba(0, 28, 84, 0.05), 0 2px 4px rgba(0, 28, 84, 0.05)',
  shadowMedium: '0 2px 4px rgba(0, 28, 84, 0.05), 0 4px 8px rgba(0, 28, 84, 0.08)',
  shadowLarge: '0 4px 8px rgba(0, 28, 84, 0.05), 0 8px 16px rgba(0, 28, 84, 0.1)',
  shadowGold: '0 4px 14px rgba(201, 162, 39, 0.25)',
};

// ============================================
// DARK MODE - Deep, sophisticated, same brand identity
// Key: Use JGI Navy as base, Gold as highlights
// ============================================
export const darkColors = {
  // Backgrounds - Deep JGI Navy Blue
  background: '#0A1628',
  backgroundSecondary: '#0F1D32',
  surface: '#132037',
  surfaceSecondary: '#1A2B47',

  // Cards - Elevated navy surfaces
  card: '#132037',
  cardForeground: '#F9FAFB',

  // Text Hierarchy - Warm whites
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',

  // Primary - JGI Gold becomes primary action in dark
  primary: '#d4b03a',
  primaryHover: '#e3c44a',
  primaryForeground: '#0A1628',
  primaryLight: '#1E3A5F',

  // Secondary - Lighter navy
  secondary: '#1A2B47',
  secondaryForeground: '#F9FAFB',

  // Muted - Deep navy
  muted: '#1A2B47',
  mutedForeground: '#9CA3AF',

  // Accent - Lighter blue for visibility
  accent: '#60A5FA',
  accentSubtle: '#1E3A5F',
  accentForeground: '#F9FAFB',

  // Secondary Accent
  accentOrange: '#FB923C',
  accentOrangeSubtle: '#431407',

  // Semantic Colors - Adjusted for dark backgrounds
  destructive: '#F87171',
  destructiveForeground: '#FFFFFF',
  destructiveLight: '#450A0A',
  // Aliases for backward compatibility
  error: '#F87171',
  errorLight: '#450A0A',

  success: '#34D399',
  successBg: '#052E16',
  successForeground: '#FFFFFF',
  successLight: '#052E16',

  warning: '#FBBF24',
  warningBg: '#451A03',
  warningForeground: '#F9FAFB',
  warningLight: '#451A03',

  // UI Elements
  border: '#1E3A5F',
  borderFocused: '#d4b03a',
  input: '#1E3A5F',
  ring: '#d4b03a',

  // Tab Bar
  tabBar: '#0F1D32',
  tabBarBorder: '#1E3A5F',
  tabBarInactive: '#6B7280',

  // Status
  statusConfirmed: '#34D399',
  statusCancelled: '#F87171',
  statusPending: '#FBBF24',
  statusWaiting: '#A78BFA',

  // JGI Brand
  jgiBlue: '#001c54',
  jgiBlueLight: '#60A5FA',
  jgiBlueDark: '#001040',
  jgiGold: '#d4b03a',
  jgiGoldLight: '#e3c44a',
  jgiGoldDark: '#c9a227',

  // Shadows
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  shadowSoft: '0 1px 2px rgba(0, 0, 0, 0.2)',
  shadowMedium: '0 2px 4px rgba(0, 0, 0, 0.25)',
  shadowLarge: '0 4px 8px rgba(0, 0, 0, 0.3)',
  shadowGold: '0 4px 14px rgba(212, 176, 58, 0.3)',
};

export type ColorScheme = typeof lightColors;

// ============================================
// ROOM COLORS - For visual distinction in calendar
// ============================================
export const roomColors = [
  { bg: '#3B82F6', border: '#2563EB', light: '#DBEAFE', text: '#1D4ED8' },     // Blue
  { bg: '#10B981', border: '#059669', light: '#D1FAE5', text: '#047857' },      // Emerald
  { bg: '#8B5CF6', border: '#7C3AED', light: '#EDE9FE', text: '#6D28D9' },     // Violet
  { bg: '#F59E0B', border: '#D97706', light: '#FEF3C7', text: '#B45309' },      // Amber
  { bg: '#EF4444', border: '#DC2626', light: '#FEE2E2', text: '#BE123C' },      // Rose
  { bg: '#06B6D4', border: '#0891B2', light: '#CFFAFE', text: '#0E7490' },     // Cyan
];
