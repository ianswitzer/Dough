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
  // Instrument Serif's numerals are tall; a lineHeight equal to fontSize clips
  // their tops. Give ~18% headroom and align the parts on the baseline so the
  // smaller sign/cents sit correctly without manual margins. includeFontPadding
  // off prevents extra Android top padding from re-introducing the clip.
  const lineHeight = Math.round(size * 1.18);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.5, color: main, opacity: 0.7, includeFontPadding: false }}>
        {sign}$
      </Text>
      <Text style={{ fontFamily: fonts.display, fontSize: size, lineHeight, color: main, includeFontPadding: false }}>
        {whole}
      </Text>
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.5, color: main, opacity: 0.45, includeFontPadding: false }}>
        .{frac}
      </Text>
    </View>
  );
}
