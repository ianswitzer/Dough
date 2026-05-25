import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../theme';
import { Txt } from './Txt';
import { tint } from './tints';

// Small tinted pill used for confidence labels, counts, trends.
export function Chip({ children, tintKey = 'muted' }: { children: React.ReactNode; tintKey?: string }) {
  const { colors, radius } = useTheme();
  const t = tint(colors, tintKey);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingVertical: 3,
        paddingHorizontal: 9,
        borderRadius: radius.pill,
        backgroundColor: t.bg,
      }}
    >
      <Txt variant="medium" color={t.fg} style={{ fontSize: 11.5, letterSpacing: 0.1 }}>
        {children}
      </Txt>
    </View>
  );
}
