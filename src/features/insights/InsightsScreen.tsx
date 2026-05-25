import React from 'react';
import { View } from 'react-native';

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
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { useTheme } from '../../theme';
import { InsightCard } from '../shared/InsightCard';
import { useCategories } from '../shared/useCategories';

export function InsightsScreen() {
  const { colors, radius } = useTheme();
  const repos = useRepositories();
  const { bySlug } = useCategories();
  const now = new Date();

  const { data, loading, error } = useAsync(async () => {
    const [insights, budgets, views] = await Promise.all([
      repos.insights.list(),
      repos.budget.listCategoryBudgets(now.getFullYear(), now.getMonth() + 1),
      repos.savedViews.list(),
    ]);
    return { insights, budgets, views };
  }, []);

  return (
    <Screen>
      <Header
        subtitle="What changed"
        title="Insights"
        action={
          <IconButton>
            <Icons.filter color={colors.ink2} />
          </IconButton>
        }
      />

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
                <View style={{ gap: 10 }}>
                  {data.insights.map((ins) => (
                    <InsightCard key={ins.id} insight={ins} />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Saved views */}
            {data.views.length > 0 ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                <SectionLabel right="Edit →">Saved views</SectionLabel>
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
