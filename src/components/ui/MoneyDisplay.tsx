import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { fmtMoneyParts } from '../../lib/money';

// Serif money amount with a dimmed sign/$ and dimmed cents — the "Safe to
// spend" hero treatment from the design.
export function MoneyDisplay({ cents, size = 56, dim = false }: { cents: number; size?: number; dim?: boolean }) {
  const { colors, fonts } = useTheme();
  const { sign, whole, frac } = fmtMoneyParts(cents);
  const main = dim ? colors.muted : colors.ink;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.5, color: main, opacity: 0.7, marginTop: size * 0.08 }}>
        {sign}$
      </Text>
      <Text style={{ fontFamily: fonts.display, fontSize: size, color: main, lineHeight: size }}>{whole}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.5, color: main, opacity: 0.45, marginTop: size * 0.08 }}>
        .{frac}
      </Text>
    </View>
  );
}
