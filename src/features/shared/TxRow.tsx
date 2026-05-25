import React from 'react';
import { Pressable, View } from 'react-native';

import { CategoryDot, Icons, Txt } from '../../components/ui';
import type { Category, Transaction } from '../../data/types';
import { fmtMoney } from '../../lib/money';
import { useTheme } from '../../theme';

// One transaction row: category dot, merchant + badges + tags, signed amount.
// Income (negative cents) renders sage with a leading +.
export function TxRow({
  tx,
  category,
  isLast,
  onPress,
}: {
  tx: Transaction;
  category?: Category;
  isLast: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const isIncome = tx.amountCents < 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: colors.hairline,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <CategoryDot name={category?.name ?? 'Other'} tintKey={category?.tint ?? 'muted'} size={34} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt variant="medium" style={{ fontSize: 14.5 }} numberOfLines={1}>
            {tx.merchant}
          </Txt>
          {tx.isRecurringCandidate ? <Icons.recurring color={colors.muted} /> : null}
          {tx.flag === 'unusual' ? (
            <View style={{ backgroundColor: colors.roseSoft, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Txt variant="semibold" color={colors.roseInk} style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                unusual
              </Txt>
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Txt color={colors.muted} style={{ fontSize: 12 }}>
            {category?.name ?? 'Uncategorized'}
          </Txt>
          {tx.tagNames.map((tag) => (
            <View key={tag} style={{ backgroundColor: colors.mutedSoft, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 }}>
              <Txt color={colors.ink2} style={{ fontSize: 10.5 }}>
                {tag}
              </Txt>
            </View>
          ))}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt variant="mono" color={isIncome ? colors.sageInk : colors.ink} style={{ fontSize: 14.5 }}>
          {isIncome ? '+' : ''}
          {fmtMoney(Math.abs(tx.amountCents))}
        </Txt>
        {tx.reviewStatus === 'needs_review' ? (
          <Txt variant="medium" color={colors.accentInk} style={{ fontSize: 10.5, marginTop: 3 }}>
            review
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}
