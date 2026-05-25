import React from 'react';
import { View } from 'react-native';

import {
  AsyncBoundary,
  Card,
  CategoryDot,
  MoneyDisplay,
  ProgressBar,
  Screen,
  SectionLabel,
  Txt,
} from '../../components/ui';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { fmtMoney, fmtMoneyShort } from '../../lib/money';
import { useTheme } from '../../theme';
import { ModalHeader } from '../shared/ModalHeader';
import { TxRow } from '../shared/TxRow';
import { useCategories } from '../shared/useCategories';

// Category detail (spec §11.6): spent vs remaining, progress, top merchants,
// recent transactions — explain WHY a category is high, not just that it is.
export function CategoryDetailScreen({ slug }: { slug: string }) {
  const { colors, radius } = useTheme();
  const repos = useRepositories();
  const { bySlug } = useCategories();
  const cat = bySlug[slug];
  const now = new Date();

  const { data, loading, error } = useAsync(async () => {
    const [budgets, txs] = await Promise.all([
      repos.budget.listCategoryBudgets(now.getFullYear(), now.getMonth() + 1),
      cat ? repos.transactions.list({ categoryId: cat.id, hidden: false }) : Promise.resolve([]),
    ]);
    return { budget: budgets.find((b) => b.categorySlug === slug), txs };
  }, [slug, cat?.id]);

  // Top merchants by spend within the category.
  const merchants = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of data?.txs ?? []) if (t.amountCents > 0) m[t.merchant] = (m[t.merchant] ?? 0) + t.amountCents;
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [data]);

  return (
    <Screen tail={40}>
      <ModalHeader backLabel="Plan" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingBottom: 16 }}>
        <CategoryDot name={cat?.name ?? slug} tintKey={cat?.tint ?? 'muted'} size={44} />
        <View>
          <Txt variant="display" style={{ fontSize: 26, letterSpacing: -0.3 }}>
            {cat?.name ?? slug}
          </Txt>
          <Txt color={colors.muted} style={{ fontSize: 12.5, marginTop: 2 }}>
            {(data?.txs ?? []).length} transactions this month
          </Txt>
        </View>
      </View>

      <AsyncBoundary loading={loading} error={error}>
        {data ? (() => {
          const spent = data.budget?.spentCents ?? 0;
          const limit = data.budget?.limitCents ?? 0;
          const pct = limit > 0 ? (spent / limit) * 100 : 0;
          const remaining = limit - spent;
          return (
            <>
              <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                <Card style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <Txt variant="medium" color={colors.muted} style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>
                        Spent so far
                      </Txt>
                      <MoneyDisplay cents={spent} size={40} />
                    </View>
                    {limit > 0 ? (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Txt variant="medium" color={colors.muted} style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>
                          Remaining
                        </Txt>
                        <Txt variant="display" color={remaining > 0 ? colors.sageInk : colors.roseInk} style={{ fontSize: 22 }}>
                          {fmtMoneyShort(Math.abs(remaining))}
                        </Txt>
                      </View>
                    ) : null}
                  </View>
                  {limit > 0 ? (
                    <View style={{ marginTop: 16 }}>
                      <ProgressBar pct={pct} tone={pct >= 90 ? 'rose' : pct >= 70 ? 'accent' : 'sage'} height={6} />
                    </View>
                  ) : null}
                </Card>
              </View>

              {merchants.length > 0 ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                  <SectionLabel>Where it went</SectionLabel>
                  <Card padded={false}>
                    {merchants.map(([name, amount], i) => {
                      const p = (amount / merchants[0][1]) * 100;
                      return (
                        <View key={name} style={{ padding: 14, borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: colors.hairline }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
                            <Txt style={{ fontSize: 13.5 }}>{name}</Txt>
                            <Txt variant="mono" style={{ fontSize: 13 }}>{fmtMoney(amount)}</Txt>
                          </View>
                          <View style={{ height: 3, borderRadius: 2, backgroundColor: colors.track }}>
                            <View style={{ width: `${p}%`, height: '100%', borderRadius: 2, backgroundColor: colors.accent }} />
                          </View>
                        </View>
                      );
                    })}
                  </Card>
                </View>
              ) : null}

              {(data.txs ?? []).length > 0 ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
                  <SectionLabel>Recent</SectionLabel>
                  <Card padded={false}>
                    {data.txs.slice(0, 5).map((t, i) => (
                      <TxRow key={t.id} tx={t} category={cat} isLast={i === Math.min(5, data.txs.length) - 1} />
                    ))}
                  </Card>
                </View>
              ) : null}
            </>
          );
        })() : null}
      </AsyncBoundary>
    </Screen>
  );
}
