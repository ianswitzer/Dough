import type { SupabaseClient } from '@supabase/supabase-js';

import type { RecurringCandidate } from '../../../services/recurringDetection';
import { detectRecurring } from '../../../services/recurringDetection';
import { unwrap, type TransactionWithSlug } from './shared';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function refreshRecurringCandidates(
  sb: SupabaseClient,
  uid: string,
  transactions: TransactionWithSlug[],
) {
  const candidates = detectRecurring(transactions);
  const existing = unwrap(
    await sb
      .from('recurring_transactions')
      .select('id, name, status')
      .eq('user_id', uid),
  ) as any[];
  const byName = new Map(existing.map((row) => [String(row.name).toLowerCase(), row]));

  let created = 0;
  const rows: Array<RecurringCandidate & { id: string }> = [];
  for (const candidate of candidates) {
    const current = byName.get(candidate.merchant.toLowerCase());
    if (current && current.status !== 'candidate') continue;

    if (current) {
      const updated = unwrap(
        await sb
          .from('recurring_transactions')
          .update({
            category_id: candidate.categoryId,
            cadence: candidate.cadence,
            expected_amount_cents: candidate.expectedAmountCents,
            amount_variance_cents: candidate.amountVarianceCents,
            next_expected_date: candidate.nextExpectedDate,
            is_income: candidate.expectedAmountCents < 0,
          })
          .eq('id', current.id)
          .select('id')
          .single(),
      ) as any;
      rows.push({ ...candidate, id: updated.id });
    } else {
      const inserted = unwrap(
        await sb
          .from('recurring_transactions')
          .insert({
            user_id: uid,
            category_id: candidate.categoryId,
            name: candidate.merchant,
            cadence: candidate.cadence,
            expected_amount_cents: candidate.expectedAmountCents,
            amount_variance_cents: candidate.amountVarianceCents,
            next_expected_date: candidate.nextExpectedDate,
            status: 'candidate',
            is_income: candidate.expectedAmountCents < 0,
          })
          .select('id')
          .single(),
      ) as any;
      created += 1;
      rows.push({ ...candidate, id: inserted.id });
    }

    unwrap(
      await sb
        .from('transactions')
        .update({ is_recurring_candidate: true })
        .eq('user_id', uid)
        .eq('description_clean', candidate.merchant)
        .select('id'),
    );
  }

  return { created, candidates: rows };
}
