import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import {
  AsyncBoundary,
  Card,
  CategoryDot,
  Header,
  IconButton,
  Icons,
  ProgressBar,
  Screen,
  SectionLabel,
  Txt,
} from '../../components/ui';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { fmtMoneyShort } from '../../lib/money';
import { useTheme } from '../../theme';
import { useCategories } from '../shared/useCategories';

export function PlanScreen() {
  const { colors, radius } = useTheme();
  const router = useRouter();
  const repos = useRepositories();
  const { bySlug } = useCategories();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  const { data, loading, error, refetch } = useAsync(async () => {
    const [month, budgets, recurring] = await Promise.all([
      repos.budget.getMonth(y, m),
      repos.budget.listCategoryBudgets(y, m),
      repos.recurring.list(),
    ]);
    return { month, budgets, recurring };
  }, []);

  const income = data?.recurring.find((r) => r.isIncome);

  return (
    <Screen onRefresh={refetch}>
      <Header
        subtitle={`${now.toLocaleDateString('en-US', { month: 'long' })} plan · day ${now.getDate()}`}
        title="Plan"
        action={
          <IconButton>
            <Icons.plus color={colors.ink2} />
          </IconButton>
        }
      />

      <AsyncBoundary loading={loading} error={error}>
        {data ? (() => {
          const totalLimit = data.budgets.reduce((s, b) => s + b.limitCents, 0);
          const totalSpent = data.budgets.reduce((s, b) => s + b.spentCents, 0);
          const pct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
          return (
            <>
              {/* Monthly summary */}
              <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                <Card style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <Txt variant="medium" color={colors.muted} style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                      Monthly budget
                    </Txt>
                    <Txt variant="mono" color={colors.muted} style={{ fontSize: 12 }}>
                      {Math.round(pct)}% used
                    </Txt>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Txt variant="display" style={{ fontSize: 32 }}>
                      {fmtMoneyShort(totalSpent)}
                    </Txt>
                    <Txt color={colors.muted} style={{ fontSize: 14 }}>
                      of {fmtMoneyShort(totalLimit)}
                    </Txt>
                  </View>
                  <View style={{ marginTop: 14 }}>
                    <ProgressBar pct={pct} tone="accent" height={8} />
                  </View>
                  {totalLimit > 0 ? (
                    <View
                      style={{
                        marginTop: 14,
                        padding: 10,
                        backgroundColor: colors.sageSoft,
                        borderRadius: radius.md,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sageInk }} />
                      <Txt color={colors.sageInk} style={{ fontSize: 12.5 }}>
                        On pace to land near {fmtMoneyShort(totalLimit * 0.92)} by month end.
                      </Txt>
                    </View>
                  ) : null}
                </Card>
              </View>

              {/* Categories */}
              {data.budgets.length > 0 ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                  <SectionLabel>Categories</SectionLabel>
                  <Card padded={false}>
                    {data.budgets.map((b, i) => {
                      const cat = bySlug[b.categorySlug];
                      const p = b.limitCents > 0 ? (b.spentCents / b.limitCents) * 100 : 0;
                      const tone = p >= 95 ? 'rose' : p >= 80 ? 'accent' : 'sage';
                      return (
                        <Pressable
                          key={b.id}
                          onPress={() => router.push(`/category/${b.categorySlug}`)}
                          style={{ padding: 14, borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: colors.hairline }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <CategoryDot name={cat?.name ?? b.categorySlug} tintKey={cat?.tint ?? 'muted'} size={30} />
                            <Txt variant="medium" style={{ flex: 1, fontSize: 14.5 }}>
                              {cat?.name ?? b.categorySlug}
                            </Txt>
                            <Txt variant="mono" style={{ fontSize: 13 }}>
                              {fmtMoneyShort(b.spentCents)}
                              <Txt variant="mono" color={colors.muted} style={{ fontSize: 13 }}>
                                {' / '}
                                {fmtMoneyShort(b.limitCents)}
                              </Txt>
                            </Txt>
                          </View>
                          <ProgressBar pct={p} tone={tone} height={4} />
                        </Pressable>
                      );
                    })}
                  </Card>
                </View>
              ) : null}

              {/* Income */}
              {income ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                  <SectionLabel>Income</SectionLabel>
                  <Card padded={false}>
                    <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' }}>
                        <Txt color={colors.sageInk} style={{ fontSize: 14 }}>+</Txt>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Txt variant="medium" style={{ fontSize: 14.5 }}>{income.name}</Txt>
                        <Txt color={colors.muted} style={{ fontSize: 12, marginTop: 2 }}>
                          Next: {income.nextExpectedDate}
                        </Txt>
                      </View>
                      <Txt variant="mono" color={colors.sageInk} style={{ fontSize: 14 }}>
                        +{fmtMoneyShort(Math.abs(income.expectedAmountCents))}
                      </Txt>
                    </View>
                  </Card>
                </View>
              ) : null}

              {/* Buffer */}
              <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                <SectionLabel>Buffer</SectionLabel>
                <BufferCard
                  monthId={data.month?.id}
                  bufferCents={data.month?.bufferCents ?? 20000}
                />
              </View>
            </>
          );
        })() : null}
      </AsyncBoundary>
    </Screen>
  );
}

// Buffer picker — persists the chosen reserve to the current budget month.
function BufferCard({ monthId, bufferCents }: { monthId?: string; bufferCents: number }) {
  const { colors, radius } = useTheme();
  const repos = useRepositories();
  const [value, setValue] = React.useState(Math.round(bufferCents / 100));

  const pick = async (dollars: number) => {
    setValue(dollars);
    if (monthId) await repos.budget.setBuffer(monthId, dollars * 100).catch(() => {});
  };

  return (
    <Card>
      <Txt color={colors.ink2} style={{ fontSize: 13, lineHeight: 20 }}>
        We hold{' '}
        <Txt variant="mono" style={{ fontSize: 13 }}>
          ${value}
        </Txt>{' '}
        aside before calculating safe-to-spend. Tap to adjust.
      </Txt>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
        {[100, 200, 350, 500].map((v) => {
          const on = v === value;
          return (
            <Pressable
              key={v}
              onPress={() => pick(v)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: radius.md,
                alignItems: 'center',
                backgroundColor: on ? colors.ink : colors.paper2,
              }}
            >
              <Txt variant="medium" color={on ? colors.onInk : colors.ink2} style={{ fontSize: 13 }}>
                ${v}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
