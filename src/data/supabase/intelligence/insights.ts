import type { SupabaseClient } from '@supabase/supabase-js';

import { fmtDateShort } from '../../../lib/date';
import { fmtMoney, fmtMoneyShort } from '../../../lib/money';
import type { RecurringCandidate } from '../../../services/recurringDetection';
import { computeCategoryDrift } from '../../../services/insights';
import {
  buildMonthlySummary,
  directionLabel,
  expenseBySlug,
  GENERATED_INSIGHT_KINDS,
  sameDayWindow,
  titleCase,
  unwrap,
  type TransactionWithSlug,
} from './shared';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function refreshInsights(
  sb: SupabaseClient,
  uid: string,
  input: {
    transactions: TransactionWithSlug[];
    currentTransactions: TransactionWithSlug[];
    unusual: TransactionWithSlug[];
    recurring: Array<RecurringCandidate & { id: string }>;
    currentStart: string;
    periodEnd: string;
    today: Date;
  },
) {
  const currentByCat = expenseBySlug(input.currentTransactions);
  const baselineByCat = buildBaselineByCategory(input.transactions, input.today);
  const monthsOfData = countMonthsWithExpense(input.transactions, input.today);
  const drifts = computeCategoryDrift(currentByCat, baselineByCat, monthsOfData);
  const materialDrifts = drifts.filter((drift) => drift.material).slice(0, 3);
  const currentTotal = Object.values(currentByCat).reduce((sum, cents) => sum + cents, 0);
  const summary = buildMonthlySummary(currentTotal, materialDrifts[0]);

  unwrap(
    await sb
      .from('insights')
      .delete()
      .eq('user_id', uid)
      .gte('period_start', input.currentStart)
      .lte('period_end', input.periodEnd)
      .in('kind', [...GENERATED_INSIGHT_KINDS])
      .select('id'),
  );

  const rows: any[] = [
    {
      user_id: uid,
      kind: 'monthly_summary',
      period_start: input.currentStart,
      period_end: input.periodEnd,
      title: summary.title,
      summary: summary.summary,
      delta_cents: null,
      direction: materialDrifts[0]?.direction ?? 'flat',
      category_slug: materialDrifts[0]?.slug ?? null,
      confidence: materialDrifts[0]?.confidence ?? 'medium',
    },
  ];

  for (const drift of materialDrifts) {
    const cat = titleCase(drift.slug);
    rows.push({
      user_id: uid,
      kind: 'spending_drift',
      period_start: input.currentStart,
      period_end: input.periodEnd,
      title: `${cat} is ${directionLabel(drift.direction)}`,
      summary: `You spent ${fmtMoneyShort(drift.currentCents)} on ${cat.toLowerCase()} so far, versus ${fmtMoneyShort(drift.baselineCents)} at this point in a usual month.`,
      current_value_cents: drift.currentCents,
      comparison_value_cents: drift.baselineCents,
      delta_cents: drift.deltaCents,
      direction: drift.direction,
      category_slug: drift.slug,
      confidence: drift.confidence,
    });
  }

  for (const tx of input.unusual.slice(0, 2)) {
    rows.push({
      user_id: uid,
      kind: 'unusual_transaction',
      period_start: input.currentStart,
      period_end: input.periodEnd,
      title: `Unusual ${tx.merchant} charge`,
      summary: `${fmtMoney(tx.amountCents)} on ${fmtDateShort(tx.date)} stands out from your recent activity.`,
      current_value_cents: tx.amountCents,
      delta_cents: tx.amountCents,
      direction: 'up',
      category_slug: null,
      confidence: tx.flag === 'unusual' ? 'high' : 'medium',
    });
  }

  for (const recurring of recurringChanges(input.recurring).slice(0, 2)) {
    rows.push({
      user_id: uid,
      kind: 'recurring_change',
      period_start: input.currentStart,
      period_end: input.periodEnd,
      title: `${recurring.merchant} changed`,
      summary: `${recurring.merchant} has varied by ${fmtMoneyShort(recurring.amountVarianceCents)} across recent ${recurring.cadence} charges.`,
      current_value_cents: recurring.expectedAmountCents,
      delta_cents: recurring.amountVarianceCents,
      direction: 'up',
      category_slug: null,
      confidence: recurring.occurrences >= 4 ? 'high' : 'medium',
    });
  }

  const inserted = unwrap(await sb.from('insights').insert(rows).select('id')) as any[];
  return inserted.length;
}

function buildBaselineByCategory(transactions: TransactionWithSlug[], today: Date) {
  const totals: Record<string, number> = {};
  const monthsOfData = Math.max(countMonthsWithExpense(transactions, today), 1);
  for (const offset of [-1, -2, -3]) {
    const { start, end } = sameDayWindow(today, offset);
    const spend = expenseBySlug(transactions.filter((tx) => tx.date >= start && tx.date < end));
    for (const [slug, cents] of Object.entries(spend)) {
      totals[slug] = (totals[slug] ?? 0) + cents;
    }
  }
  return Object.fromEntries(
    Object.entries(totals).map(([slug, cents]) => [slug, Math.round(cents / monthsOfData)]),
  );
}

function countMonthsWithExpense(transactions: TransactionWithSlug[], today: Date) {
  return [-1, -2, -3].filter((offset) => {
    const { start, end } = sameDayWindow(today, offset);
    return transactions.some((tx) => tx.date >= start && tx.date < end && tx.amountCents > 0);
  }).length;
}

const recurringChanges = (items: Array<RecurringCandidate & { id: string }>) =>
  items.filter((item) => item.amountVarianceCents >= Math.max(500, Math.abs(item.expectedAmountCents) * 0.15));
