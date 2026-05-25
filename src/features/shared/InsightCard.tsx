import React from 'react';
import { View } from 'react-native';

import { Card, Icons, Txt } from '../../components/ui';
import { tint } from '../../components/ui/tints';
import type { Insight } from '../../data/types';
import { useTheme } from '../../theme';

// Plain-English insight card. Direction drives the leading glyph + tone:
// "up" reads attention (rose) unless it's a merchant delta (less = sage).
export function InsightCard({ insight, compact = false }: { insight: Insight; compact?: boolean }) {
  const { colors } = useTheme();
  const Dir = insight.direction === 'up' ? Icons.up : insight.direction === 'down' ? Icons.down : Icons.flat;
  const toneKey =
    insight.direction === 'up'
      ? insight.kind === 'merchant_delta'
        ? 'sage'
        : 'rose'
      : insight.direction === 'down'
        ? 'sage'
        : 'muted';
  const t = tint(colors, toneKey);
  const firstSentence = insight.summary.split('. ')[0] + '.';

  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: t.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Dir color={t.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="display" style={{ fontSize: 19, lineHeight: 23, letterSpacing: -0.2 }}>
            {insight.title}
          </Txt>
          <Txt color={compact ? colors.muted : colors.ink2} style={{ fontSize: compact ? 12.5 : 13.5, lineHeight: 20, marginTop: compact ? 4 : 6 }}>
            {compact ? firstSentence : insight.summary}
          </Txt>
        </View>
      </View>
    </Card>
  );
}
