/**
 * MYM Design System — Centralised theme tokens.
 * All screens import from here so the entire app is consistent.
 */

export const Colors = {
  // Backgrounds
  bg: '#0D0D1A',
  surface: '#141428',
  card: '#1C1C38',
  cardBorder: 'rgba(255,255,255,0.07)',

  // Accent
  primary: '#7C6EF8',       // violet
  primaryDark: '#5B4ECC',
  success: '#34D399',       // emerald green
  danger: '#F87171',        // soft red
  warning: '#FBBF24',       // amber

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9898B3',
  textMuted: '#5C5C78',

  // Utility
  separator: 'rgba(255,255,255,0.06)',
};

export const Gradients = {
  background: ['#0D0D1A', '#141428'] as const,
  card: ['#1C1C38', '#141428'] as const,
  primary: ['#9D8FF9', '#7C6EF8'] as const,
  income: ['#34D399', '#059669'] as const,
  expense: ['#F87171', '#EF4444'] as const,
  balanceCard: ['#2A2060', '#7C6EF8'] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};
