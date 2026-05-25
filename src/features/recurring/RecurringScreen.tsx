import React from 'react';
import { View } from 'react-native';

import {
  AsyncBoundary,
  Card,
  CategoryDot,
  Header,
  MoneyDisplay,
  Screen,
  SectionLabel,
  Txt,
} from '../../components/ui';
import type { RecurringTransaction } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { fmtDate, fmtRelativeDate } from '../../lib/date';
import { fmtMoney } from '../../lib/money';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';
import { useCategories } from '../shared/useCategories';

// Recurring bills (spec §11.7): committed-monthly hero, then bills grouped by
// the month they next land in.
export function RecurringScreen() {
  const { colors, radius } = useTheme();
  const repos = useRepositories();
  const { bySlug } = useCategories();
  const now = new Date();

  const { data, loading, error } = useAsync(async () => {
    await repos.intelligence.generate();
    return repos.recurring.list();
  }, []);

  const committed = (data ?? [])
    .filter((b) => !b.isIncome)
    .reduce((s, b) => s + Math.abs(b.expectedAmountCents), 0);

  // Group by "Month Year" of next expected date.
  const groups = React.useMemo(() => {
    const map = new Map<string, RecurringTransaction[]>();
    for (const b of data ?? []) {
      const key = fmtDate(b.nextExpectedDate, { month: 'long', year: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return [...map.entries()];
  }, [data]);

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Today" />
      <Header subtitle={`${(data ?? []).filter((b) => !b.isIncome).length} tracked and candidate series`} title="Recurring bills" />

      <AsyncBoundary loading={loading} error={error}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <Card style={{ backgroundColor: colors.accentSoft, borderRadius: radius.card }}>
            <Txt variant="medium" color={colors.accentInk} style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Committed each month
            </Txt>
            <MoneyDisplay cents={committed} size={44} />
          </Card>
        </View>

        {groups.map(([month, items]) => (
          <View key={month} style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <SectionLabel>{month}</SectionLabel>
            <Card padded={false}>
              {items.map((b, i) => (
                <View
                  key={b.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderTopWidth: i === 0 ? 0 : 0.5,
                    borderTopColor: colors.hairline,
                  }}
                >
                  <CategoryDot name={bySlug[b.categorySlug ?? '']?.name ?? b.name} tintKey={bySlug[b.categorySlug ?? '']?.tint ?? 'muted'} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="medium" style={{ fontSize: 14.5 }}>{b.name}</Txt>
                    <Txt color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
                      {fmtRelativeDate(b.nextExpectedDate, now)} · {b.cadence}
                      {b.confidence === 'medium' ? '  ·  medium confidence' : ''}
                    </Txt>
                  </View>
                  <Txt variant="mono" color={b.isIncome ? colors.sageInk : colors.ink} style={{ fontSize: 14 }}>
                    {b.isIncome ? '+' : ''}
                    {fmtMoney(Math.abs(b.expectedAmountCents))}
                  </Txt>
                </View>
              ))}
            </Card>
          </View>
        ))}
      </AsyncBoundary>
    </Screen>
  );
}
