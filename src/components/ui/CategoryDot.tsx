import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../theme';
import { Txt } from './Txt';
import { tint } from './tints';

// Round category glyph: tinted circle with the category's first initial.
export function CategoryDot({ name, tintKey, size = 32 }: { name: string; tintKey: string; size?: number }) {
  const { colors } = useTheme();
  const t = tint(colors, tintKey);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt variant="mono" color={t.fg} style={{ fontSize: size * 0.45 }}>
        {name.charAt(0).toUpperCase()}
      </Txt>
    </View>
  );
}
