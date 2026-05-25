import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  IntelligenceGenerationResult,
  IntelligenceRepository,
} from '../../repositories/contracts';
import { toTransaction } from '../mappers';
import { refreshInsights } from './insights';
import { refreshRecurringCandidates } from './recurring';
import { refreshReviewItems } from './review';
import {
  findUnusualTransactions,
  iso,
  monthStart,
  sameDayWindow,
  TX_SELECT,
  unwrap,
  type TransactionWithSlug,
} from './shared';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function createSupabaseIntelligenceRepository(sb: SupabaseClient): IntelligenceRepository {
  return {
    async generate(): Promise<IntelligenceGenerationResult> {
      const { data: auth } = await sb.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return { insightsCreated: 0, reviewItemsCreated: 0, recurringCandidatesCreated: 0 };

      const today = new Date();
      const todayStr = iso(today);
      const currentStart = monthStart(today);
      const historyStart = sameDayWindow(today, -3).start;

      const transactions = await listTransactionsForGeneration(sb, uid, historyStart, todayStr);
      const currentTransactions = transactions.filter((tx) => tx.date >= currentStart);
      const unusual = findUnusualTransactions(transactions, currentStart);
      const recurringResult = await refreshRecurringCandidates(sb, uid, transactions);

      const reviewItemsCreated = await refreshReviewItems(sb, uid, {
        transactions: currentTransactions,
        unusual,
        recurring: recurringResult.candidates,
      });
      const insightsCreated = await refreshInsights(sb, uid, {
        transactions,
        currentTransactions,
        unusual,
        recurring: recurringResult.candidates,
        currentStart,
        periodEnd: todayStr,
        today,
      });

      return {
        insightsCreated,
        reviewItemsCreated,
        recurringCandidatesCreated: recurringResult.created,
      };
    },
  };
}

async function listTransactionsForGeneration(
  sb: SupabaseClient,
  uid: string,
  start: string,
  end: string,
) {
  const rows = unwrap(
    await sb
      .from('transactions')
      .select(TX_SELECT)
      .eq('user_id', uid)
      .eq('is_hidden_from_budget', false)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true }),
  );

  return (rows as any[]).map((row): TransactionWithSlug => ({
    ...toTransaction(row),
    categorySlug: row.categories?.slug ?? null,
  }));
}
