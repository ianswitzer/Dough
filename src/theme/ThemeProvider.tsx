import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type Palette } from './colors';
import { fonts, radius, space } from './tokens';

// Three-way preference: follow the OS, or pin light/dark. Persisted so the
// choice survives restarts. The Settings → Appearance toggle drives this.
export type ThemePreference = 'system' | 'light' | 'dark';

export type Theme = {
  colors: Palette;
  fonts: typeof fonts;
  radius: typeof radius;
  space: typeof space;
  isDark: boolean;
};

type ThemeContextValue = Theme & {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

const STORAGE_KEY = 'dough.theme.preference';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme(); // 'light' | 'dark' | null
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Hydrate the saved preference once.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
      })
      .catch(() => {});
  }, []);

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
  };

  const isDark = preference === 'system' ? system === 'dark' : preference === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkPalette : lightPalette,
      fonts,
      radius,
      space,
      isDark,
      preference,
      setPreference,
    }),
    [isDark, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
