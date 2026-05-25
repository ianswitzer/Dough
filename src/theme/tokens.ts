// Non-color design tokens: font families, radii, spacing. Single source of
// truth so components don't sprinkle magic numbers.

// Font family keys map to the names registered in app/_layout.tsx via expo-font.
// Geist (design) is substituted with Inter; Geist Mono with Space Mono. See
// docs/DESIGN.md.
export const fonts = {
  display: 'InstrumentSerif', // serif moments: amounts, titles, headlines
  displayItalic: 'InstrumentSerif-Italic',
  ui: 'Inter', // body / UI
  uiMedium: 'Inter-Medium',
  uiSemibold: 'Inter-SemiBold',
  mono: 'SpaceMono', // tabular money
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  card: 22,
  hero: 28,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
} as const;
