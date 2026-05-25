import type { SupabaseClient } from '@supabase/supabase-js';

import { fmtDateShort } from '../../../lib/date';
import { fmtMoney, fmtMoneyShort } from '../../../lib/money';
import type { RecurringCandidate } from '../../../services/recurringDetection';
import {
  GENERATED_REVIEW_KINDS,
  recurringKey,
  transactionKey,
  unwrap,
  type TransactionWithSlug,
} from './shared';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function refreshReviewItems(
  sb: SupabaseClient,
  uid: string,
  input: {
    transactions: TransactionWithSlug[];
    unusual: TransactionWithSlug[];
    recurring: Array<RecurringCandidate & { id: string }>;
  },
) {
  const existing = unwrap(
    await sb
      .from('review_items')
      .select('kind, related_object_type, related_object_id, status')
      .eq('user_id', uid)
      .in('kind', [...GENERATED_REVIEW_KINDS]),
  ) as any[];
  const closed = new Set(
    existing
      .filter((row) => row.status !== 'open' && row.related_object_id)
      .map((row) => `${row.kind}:${row.related_object_type}:${row.related_object_id}`),
  );

  unwrap(
    await sb
      .from('review_items')
      .delete()
      .eq('user_id', uid)
      .eq('status', 'open')
      .in('kind', [...GENERATED_REVIEW_KINDS])
      .select('id'),
  );

  const rows: any[] = [];
  for (const tx of input.transactions.filter((t) => !t.categoryId && t.reviewStatus !== 'reviewed').slice(0, 8)) {
    if (closed.has(transactionKey('uncategorized_transaction', tx))) continue;
    rows.push({
      user_id: uid,
      kind: 'uncategorized_transaction',
      severity: 'info',
      title: `Categorize ${tx.merchant}`,
      body: `${fmtMoney(tx.amountCents)} on ${fmtDateShort(tx.date)}`,
      related_object_type: 'transaction',
      related_object_id: tx.id,
    });
  }

  for (const tx of input.unusual.slice(0, 5)) {
    if (closed.has(transactionKey('unusual_charge', tx))) continue;
    rows.push({
      user_id: uid,
      kind: 'unusual_charge',
      severity: 'warning',
      title: `Check ${tx.merchant}`,
      body: `${fmtMoney(tx.amountCents)} is larger than your usual charge here.`,
      related_object_type: 'transaction',
      related_object_id: tx.id,
    });
  }

  for (const recurring of input.recurring.slice(0, 6)) {
    if (closed.has(recurringKey('recurring_candidate', recurring.id))) continue;
    rows.push({
      user_id: uid,
      kind: 'recurring_candidate',
      severity: 'info',
      title: `Track ${recurring.merchant}?`,
      body: `${fmtMoney(Math.abs(recurring.expectedAmountCents))} · ${recurring.cadence} · seen ${recurring.occurrences} times`,
      related_object_type: 'recurring_transaction',
      related_object_id: recurring.id,
    });

    if (recurring.amountVarianceCents >= Math.max(500, Math.abs(recurring.expectedAmountCents) * 0.15)) {
      if (closed.has(recurringKey('subscription_increase', recurring.id))) continue;
      rows.push({
        user_id: uid,
        kind: 'subscription_increase',
        severity: 'warning',
        title: `${recurring.merchant} changed`,
        body: `Recent charges vary by ${fmtMoneyShort(recurring.amountVarianceCents)}.`,
        related_object_type: 'recurring_transaction',
        related_object_id: recurring.id,
      });
    }
  }

  if (!rows.length) return 0;
  const inserted = unwrap(await sb.from('review_items').insert(rows).select('id')) as any[];
  return inserted.length;
}
