import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  AsyncBoundary,
  Card,
  Header,
  IconButton,
  Icons,
  Screen,
  Txt,
} from '../../components/ui';
import type { Transaction } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { fmtRelativeDate } from '../../lib/date';
import { fmtMoney } from '../../lib/money';
import { useTheme } from '../../theme';
import { TxRow } from '../shared/TxRow';
import { useCategories } from '../shared/useCategories';

type Filter = 'all' | 'review' | 'recurring' | 'household' | 'hidden';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'review', label: 'Needs review' },
  { id: 'recurring', label: 'Recurring' },
  { id: 'household', label: 'Household' },
  { id: 'hidden', label: 'Hidden' },
];

export function TransactionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const repos = useRepositories();
  const { byId } = useCategories();
  const [filter, setFilter] = useState<Filter>('all');

  const { data, loading, error } = useAsync(() => {
    const query =
      filter === 'review'
        ? { reviewStatus: 'needs_review' as const }
        : filter === 'recurring'
          ? { recurringOnly: true }
          : filter === 'household'
            ? { tag: 'Household' }
            : filter === 'hidden'
              ? { hidden: true }
              : { hidden: false };
    return repos.transactions.list(query);
  }, [filter]);

  // Group by date, preserving the date-desc order from the query.
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of data ?? []) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return [...map.entries()];
  }, [data]);

  const monthTotal = (data ?? [])
    .filter((t) => t.amountCents > 0)
    .reduce((s, t) => s + t.amountCents, 0);

  return (
    <Screen>
      <Header
        subtitle={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        title="Transactions"
        action={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <IconButton>
              <Icons.search color={colors.ink2} />
            </IconButton>
            <IconButton>
              <Icons.filter color={colors.ink2} />
            </IconButton>
          </View>
        }
      />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingHorizontal: 18, paddingBottom: 14 }}
      >
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 13,
                borderRadius: 999,
                backgroundColor: on ? colors.ink : colors.surface,
                borderWidth: 0.5,
                borderColor: on ? colors.ink : colors.hairline2,
              }}
            >
              <Txt variant="medium" color={on ? colors.onInk : colors.ink2} style={{ fontSize: 12.5 }}>
                {f.label}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Month summary strip */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Card padded={false} style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Txt variant="medium" color={colors.muted} style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Spent this month
            </Txt>
            <Txt variant="display" style={{ fontSize: 26, marginTop: 2 }}>
              {fmtMoney(monthTotal)}
            </Txt>
          </View>
          <Txt color={colors.muted} style={{ fontSize: 12 }}>
            {(data ?? []).length} transactions
          </Txt>
        </Card>
      </View>

      <AsyncBoundary loading={loading} error={error}>
        {groups.length === 0 ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <Txt color={colors.muted}>Nothing here yet.</Txt>
          </View>
        ) : (
          groups.map(([date, items]) => (
            <View key={date} style={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 8 }}>
                <Txt variant="medium" color={colors.muted} style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  {fmtRelativeDate(date)}
                </Txt>
                <Txt variant="mono" color={colors.muted} style={{ fontSize: 12 }}>
                  {fmtMoney(items.reduce((s, t) => s + (t.amountCents > 0 ? t.amountCents : 0), 0))}
                </Txt>
              </View>
              <Card padded={false}>
                {items.map((t, i) => (
                  <TxRow
                    key={t.id}
                    tx={t}
                    category={t.categoryId ? byId[t.categoryId] : undefined}
                    isLast={i === items.length - 1}
                    onPress={() => router.push(`/transaction/${t.id}`)}
                  />
                ))}
              </Card>
            </View>
          ))
        )}
      </AsyncBoundary>
    </Screen>
  );
}
