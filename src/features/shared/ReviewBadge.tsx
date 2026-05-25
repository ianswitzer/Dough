import React from 'react';
import { View } from 'react-native';

import { Txt } from '../../components/ui';
import { tint } from '../../components/ui/tints';
import type { ReviewKind } from '../../data/types';
import { useTheme } from '../../theme';

// Square tinted badge with a glyph per review-item kind.
const MAP: Record<string, { tint: string; glyph: string }> = {
  unusual_charge: { tint: 'rose', glyph: '!' },
  duplicate_possible: { tint: 'rose', glyph: '⌘' },
  recurring_candidate: { tint: 'accent', glyph: '↻' },
  subscription_increase: { tint: 'accent', glyph: '↑' },
  uncategorized_transaction: { tint: 'sage', glyph: '◐' },
  budget_drift: { tint: 'sky', glyph: '∿' },
  rule_suggestion: { tint: 'sky', glyph: '✸' },
};

export function ReviewBadge({ kind }: { kind: ReviewKind }) {
  const { colors } = useTheme();
  const m = MAP[kind] ?? MAP.uncategorized_transaction;
  const t = tint(colors, m.tint);
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 11,
        backgroundColor: t.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt color={t.fg} style={{ fontSize: 16 }}>
        {m.glyph}
      </Txt>
    </View>
  );
}
