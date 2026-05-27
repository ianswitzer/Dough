import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AsyncBoundary,
  Card,
  Chip,
  Header,
  IconButton,
  Icons,
  Screen,
  SectionLabel,
  Txt,
} from '../../components/ui';
import type { InsightKind } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { InsightCard } from '../shared/InsightCard';
import { useCategories } from '../shared/useCategories';

// Insight filters group the raw kinds into friendly buckets. `all` shows
// everything; each other bucket maps to the kinds it covers.
type InsightFilter = 'all' | 'spending' | 'merchants' | 'unusual' | 'recurring';

const INSIGHT_FILTERS: { id: InsightFilter; label: string; kinds: InsightKind[] }[] = [
  { id: 'all', label: 'All', kinds: [] },
  { id: 'spending', label: 'Spending', kinds: ['spending_drift', 'category_delta', 'monthly_summary'] },
  { id: 'merchants', label: 'Merchants', kinds: ['merchant_delta'] },
  { id: 'unusual', label: 'Unusual', kinds: ['unusual_transaction'] },
  { id: 'recurring', label: 'Recurring', kinds: ['recurring_change'] },
];

export function InsightsScreen() {
  const { colors, radius } = useTheme();
  const router = useRouter();
  const repos = useRepositories();
  const { bySlug } = useCategories();
  const now = new Date();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<InsightFilter>('all');

  const { data, loading, error, refetch } = useAsync(async () => {
    await repos.intelligence.generate();
    const [insights, budgets, views] = await Promise.all([
      repos.insights.list(),
      repos.budget.listCategoryBudgets(now.getFullYear(), now.getMonth() + 1),
      repos.savedViews.list(),
    ]);
    return { insights, budgets, views };
  }, []);

  // Apply the active filter to the plain-English list. `all` keeps every kind.
  const visibleInsights = useMemo(() => {
    const insights = data?.insights ?? [];
    if (filter === 'all') return insights;
    const kinds = INSIGHT_FILTERS.find((f) => f.id === filter)!.kinds;
    return insights.filter((i) => kinds.includes(i.kind));
  }, [data, filter]);

  // Only offer a filter chip when there's an insight of that kind to show.
  const availableFilters = useMemo(() => {
    const present = new Set((data?.insights ?? []).map((i) => i.kind));
    return INSIGHT_FILTERS.filter((f) => f.id === 'all' || f.kinds.some((k) => present.has(k)));
  }, [data]);

  return (
    <Screen onRefresh={refetch}>
      <Header
        subtitle="What changed"
        title="Insights"
        action={
          <IconButton onPress={() => setFilterOpen((s) => !s)}>
            <Icons.filter color={filterOpen || filter !== 'all' ? colors.accentInk : colors.ink2} />
          </IconButton>
        }
      />

      {/* Filter chips (toggled from the header) */}
      {filterOpen ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingHorizontal: 18, paddingBottom: 14 }}
        >
          {availableFilters.map((f) => {
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
      ) : null}

      <AsyncBoundary loading={loading} error={error}>
        {data ? (
          <>
            {/* Monthly summary + category bar strip */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
              <Card style={{ padding: 20 }}>
                <Txt variant="medium" color={colors.muted} style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>
                  {now.toLocaleDateString('en-US', { month: 'long' })} so far
                </Txt>
                <Txt variant="display" style={{ fontSize: 22, lineHeight: 29, letterSpacing: -0.2 }}>
                  {data.insights.find((i) => i.kind === 'monthly_summary')?.summary ??
                    'Your spending is tracking close to a normal month.'}
                </Txt>

                {data.budgets.length > 0 ? (
                  <>
                    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: 56, marginTop: 18 }}>
                      {data.budgets.map((b) => {
                        const max = Math.max(...data.budgets.map((x) => x.spentCents), 1);
                        const h = Math.max(8, (b.spentCents / max) * 100);
                        return (
                          <View
                            key={b.id}
                            style={{ flex: 1, height: `${h}%`, backgroundColor: colors.accent, opacity: 0.55, borderRadius: 4 }}
                          />
                        );
                      })}
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 6 }}>
                      {data.budgets.map((b) => (
                        <Txt key={b.id} color={colors.muted} style={{ flex: 1, fontSize: 9, textAlign: 'center' }}>
                          {(bySlug[b.categorySlug]?.name ?? b.categorySlug).charAt(0)}
                        </Txt>
                      ))}
                    </View>
                  </>
                ) : null}
              </Card>
            </View>

            {/* Plain-English insights */}
            {data.insights.length > 0 ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                <SectionLabel>In plain English</SectionLabel>
                {visibleInsights.length > 0 ? (
                  <View style={{ gap: 10 }}>
                    {visibleInsights.map((ins) => (
                      <InsightCard key={ins.id} insight={ins} />
                    ))}
                  </View>
                ) : (
                  <Txt color={colors.muted} style={{ fontSize: 13, paddingHorizontal: 4, paddingTop: 4 }}>
                    No {INSIGHT_FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} insights right now.
                  </Txt>
                )}
              </View>
            ) : null}

            {/* Saved views */}
            {data.views.length > 0 ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                <SectionLabel right="Edit →" onPressRight={() => router.push('/views/edit')}>Saved views</SectionLabel>
                <Card padded={false}>
                  {data.views.map((v, i) => (
                    <View
                      key={v.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 14,
                        borderTopWidth: i === 0 ? 0 : 0.5,
                        borderTopColor: colors.hairline,
                      }}
                    >
                      <Txt variant="medium" style={{ flex: 1, fontSize: 14 }}>
                        {v.name}
                      </Txt>
                      {v.isDefault ? <Chip tintKey="muted">default</Chip> : null}
                      <Icons.chev color={colors.muted} opacity={0.4} />
                    </View>
                  ))}
                </Card>
              </View>
            ) : null}
          </>
        ) : null}
      </AsyncBoundary>
    </Screen>
  );
}
