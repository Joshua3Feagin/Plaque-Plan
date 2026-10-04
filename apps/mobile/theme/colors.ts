// Lincoln Financial brand tokens for Plaque & Plan.
// Single source of truth — see .kiro/steering/brand.md.
// Components must read colors from the Paper theme, not hard-code hex values.

import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

/** Raw brand color tokens. */
export const brand = {
  primary: '#650030', // Lincoln burgundy
  onPrimary: '#FFFFFF',
  primaryContainer: '#8A1F4F',
  onPrimaryContainer: '#FFFFFF',
  secondary: '#B88A00', // warm gold accent
  onSecondary: '#FFFFFF',
  accent: '#E0531F', // bright orange — active tab, primary CTAs, chips (per mockups)
  onAccent: '#FFFFFF',
  accentContainer: '#FDE8DD', // soft orange pill background
  background: '#FBF8F4', // warm off-white
  surface: '#FFFFFF',
  surfaceVariant: '#F1EAE2',
  onSurface: '#1F1A1C',
  onSurfaceVariant: '#5C5257',
  outline: '#D9CEC6',
  success: '#2E7D32',
  warning: '#B26A00',
  error: '#B3261E',
} as const;

/** Member accent colors, assigned to household members in order. */
export const memberColors = [
  '#650030', // burgundy
  '#1C6E8C', // teal
  '#9C4722', // terracotta
  '#4A6C2F', // olive
  '#5E4B8B', // violet
  '#A61E4D', // magenta
] as const;

/** Pick a stable member color by index (wraps around). */
export function memberColor(index: number): string {
  return memberColors[((index % memberColors.length) + memberColors.length) % memberColors.length];
}

/** React Native Paper (MD3) theme wired to the Lincoln Financial tokens. */
export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brand.primary,
    onPrimary: brand.onPrimary,
    primaryContainer: brand.primaryContainer,
    onPrimaryContainer: brand.onPrimaryContainer,
    secondary: brand.secondary,
    onSecondary: brand.onSecondary,
    background: brand.background,
    surface: brand.surface,
    surfaceVariant: brand.surfaceVariant,
    onSurface: brand.onSurface,
    onSurfaceVariant: brand.onSurfaceVariant,
    outline: brand.outline,
    error: brand.error,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: brand.surface,
      level2: brand.surface,
    },
  },
};

export type { MD3Theme };
