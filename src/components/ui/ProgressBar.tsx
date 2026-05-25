import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../theme';
import { tint } from './tints';

// Calm progress bar. `tone` picks the fill tint (sage / accent / rose).
export function ProgressBar({ pct, tone = 'accent', height = 6 }: { pct: number; tone?: string; height?: number }) {
  const { colors } = useTheme();
  const fill = tint(colors, tone).fg;
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <View style={{ height, borderRadius: 999, backgroundColor: colors.track, overflow: 'hidden' }}>
      <View style={{ width: `${clamped}%`, height: '100%', borderRadius: 999, backgroundColor: fill, opacity: 0.9 }} />
    </View>
  );
}
