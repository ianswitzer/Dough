import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import {
  AsyncBoundary,
  Card,
  CategoryDot,
  Chip,
  Header,
  IconButton,
  Icons,
  MoneyDisplay,
  Screen,
  SectionLabel,
  Txt,
} from '../../components/ui';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';
import { fmtMoney, fmtMoneyShort } from '../../lib/money';
import { fmtRelativeDate } from '../../lib/date';
import { computeSafeToSpend } from '../../services/safeToSpend';
import { useTheme } from '../../theme';
import { InsightCard } from '../shared/InsightCard';
import { ReviewBadge } from '../shared/ReviewBadge';
import { useCategories } from '../shared/useCategories';

export function TodayScreen() {
  const { colors, radius } = useTheme();
  const router = useRouter();
  const repos = useRepositories();
  const { bySlug } = useCategories();

  const now = new Date();
  const { data, loading, error } = useAsync(async () => {
    const [profile, accounts, recurring, budgetMonth, review, insights] = await Promise.all([
      repos.profile.getCurrent(),
      repos.accounts.list(),
      repos.recurring.list(),
      repos.budget.getMonth(now.getFullYear(), now.getMonth() + 1),
      repos.review.listOpen(),
      repos.insights.list(),
    ]);
    return { profile, accounts, recurring, budgetMonth, review, insights };
  }, []);

  const firstName = data?.profile?.displayName?.split(' ')[0] ?? 'there';

  return (
    <Screen>
      <Header
        subtitle={now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        title={`Morning, ${firstName}`}
        action={
          <IconButton onPress={() => router.push('/review')}>
            <Icons.bell color={colors.ink2} />
          </IconButton>
        }
      />

      <AsyncBoundary loading={loading} error={error}>
        {data ? (() => {
          const sts = computeSafeToSpend({
            accounts: data.accounts,
            recurring: data.recurring,
            budgetMonth: data.budgetMonth,
            today: now,
          });
          const confTint = sts.confidence === 'high' ? 'sage' : sts.confidence === 'medium' ? 'accent' : 'rose';
          return (
          <>
            <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
              <View style={{ backgroundColor: colors.accentSoft, borderRadius: radius.hero, padding: 22 }}>
                <Txt variant="medium" color={colors.accentInk} style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                  Safe to spend
                </Txt>
                <View style={{ marginTop: 8 }}>
                  <MoneyDisplay cents={Math.max(0, sts.safeToSpendCents)} size={64} />
                </View>
                <Txt color={colors.ink2} style={{ fontSize: 13.5, lineHeight: 20, marginTop: 10, maxWidth: 280 }}>
                  {sts.explanation}
                </Txt>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                  <Chip tintKey={confTint}>{sts.confidence} confidence</Chip>
                  <Chip tintKey="accent">{sts.billsCounted} bills counted</Chip>
                  <Chip tintKey="muted">{sts.daysLeft} days left</Chip>
                </View>
              </View>
            </View>

            {/* Two pulse cards */}
            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 14 }}>
              <Card padded={false} style={{ flex: 1, padding: 14 }}>
                <Txt variant="medium" color={colors.muted} style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  Before payday
                </Txt>
                <Txt variant="display" style={{ fontSize: 26, marginTop: 6 }}>
                  {fmtMoneyShort(sts.upcomingBillsCents)}
                </Txt>
                <Txt color={colors.muted} style={{ fontSize: 12, marginTop: 6 }}>
                  in upcoming bills
                </Txt>
              </Card>
              <Card padded={false} style={{ flex: 1, padding: 14 }} onPress={() => router.push('/review')}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt variant="medium" color={colors.muted} style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                    To review
                  </Txt>
                  <Icons.chev color={colors.muted} opacity={0.5} />
                </View>
                <Txt variant="display" style={{ fontSize: 26, marginTop: 6 }}>
                  {data.review.length}
                </Txt>
                <Txt color={colors.muted} style={{ fontSize: 12, marginTop: 6 }}>
                  quick taps to clear
                </Txt>
              </Card>
            </View>

            {/* Review preview */}
            {data.review.length > 0 ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 14, paddingTop: 6 }}>
                <SectionLabel right="Open inbox →" onPressRight={() => router.push('/review')}>
                  Needs a glance
                </SectionLabel>
                <Card padded={false}>
                  {data.review.slice(0, 3).map((r, i) => (
                    <View
                      key={r.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 14,
                        borderTopWidth: i === 0 ? 0 : 0.5,
                        borderTopColor: colors.hairline,
                      }}
                    >
                      <ReviewBadge kind={r.kind} />
                      <View style={{ flex: 1 }}>
                        <Txt variant="medium" style={{ fontSize: 14.5 }}>
                          {r.title}
                        </Txt>
                        <Txt color={colors.muted} style={{ fontSize: 12.5, marginTop: 2 }}>
                          {r.body}
                        </Txt>
                      </View>
                      <Icons.chev color={colors.muted} opacity={0.4} />
                    </View>
                  ))}
                </Card>
              </View>
            ) : null}

            {/* Insight preview */}
            {data.insights.length > 0 ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 14, paddingTop: 6 }}>
                <SectionLabel right="See all →" onPressRight={() => router.push('/(tabs)/insights')}>
                  This month so far
                </SectionLabel>
                <View style={{ gap: 10 }}>
                  {data.insights.slice(0, 2).map((ins) => (
                    <InsightCard key={ins.id} insight={ins} compact />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Upcoming bills */}
            {data.recurring.length > 0 ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 14, paddingTop: 6 }}>
                <SectionLabel right="All bills →" onPressRight={() => router.push('/recurring')}>
                  Coming up
                </SectionLabel>
                <Card padded={false}>
                  {data.recurring.slice(0, 3).map((b, i) => (
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
                        <Txt variant="medium" style={{ fontSize: 14.5 }}>
                          {b.name}
                        </Txt>
                        <Txt color={colors.muted} style={{ fontSize: 12.5, marginTop: 2 }}>
                          {fmtRelativeDate(b.nextExpectedDate, now)} · {b.cadence}
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
            ) : null}
          </>
          );
        })() : null}
      </AsyncBoundary>
    </Screen>
  );
}
