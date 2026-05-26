// Core transaction-sync routine, shared by plaid-exchange-public-token (first
// sync right after linking) and plaid-sync-transactions (incremental refresh).
//
// Uses Plaid's cursor-based /transactions/sync: each call returns added/
// modified/removed since the stored cursor. We upsert added+modified into
// `transactions` (deduped by the (account_id, external_transaction_id) unique
// index), delete removed, then persist the new cursor so the next run resumes.
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { PlaidApi } from 'npm:plaid@^38.1.0';

import { transactionRow } from './plaid.ts';

type ItemRow = {
  id: string;
  user_id: string;
  access_token: string;
  cursor: string | null;
};

export type SyncResult = { added: number; modified: number; removed: number };

export async function syncItemTransactions(
  admin: SupabaseClient,
  plaid: PlaidApi,
  item: ItemRow,
): Promise<SyncResult> {
  // Map this Item's Plaid account ids → Dough account uuids up front.
  const { data: accounts, error: accErr } = await admin
    .from('accounts')
    .select('id, external_account_id')
    .eq('user_id', item.user_id)
    .eq('sync_provider', 'plaid');
  if (accErr) throw new Error(accErr.message);
  const accountIdByExternal = new Map<string, string>(
    (accounts ?? []).map((a) => [a.external_account_id as string, a.id as string]),
  );

  let cursor = item.cursor ?? undefined;
  let hasMore = true;
  const result: SyncResult = { added: 0, modified: 0, removed: 0 };

  while (hasMore) {
    const resp = await plaid.transactionsSync({ access_token: item.access_token, cursor });
    const { added, modified, removed, has_more, next_cursor } = resp.data;

    const upserts = [...added, ...modified]
      .map((t) => {
        const accountId = accountIdByExternal.get(t.account_id);
        return accountId ? transactionRow(item.user_id, accountId, t) : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (upserts.length) {
      // onConflict matches the (account_id, external_transaction_id) unique index.
      const { error } = await admin
        .from('transactions')
        .upsert(upserts, { onConflict: 'account_id,external_transaction_id', ignoreDuplicates: false });
      if (error) throw new Error(error.message);
    }

    if (removed.length) {
      const ids = removed.map((r) => r.transaction_id).filter(Boolean) as string[];
      if (ids.length) {
        const { error } = await admin
          .from('transactions')
          .delete()
          .eq('user_id', item.user_id)
          .in('external_transaction_id', ids);
        if (error) throw new Error(error.message);
      }
    }

    result.added += added.length;
    result.modified += modified.length;
    result.removed += removed.length;
    cursor = next_cursor;
    hasMore = has_more;
  }

  const { error: updErr } = await admin
    .from('plaid_items')
    .update({ cursor, last_synced_at: new Date().toISOString() })
    .eq('id', item.id);
  if (updErr) throw new Error(updErr.message);

  return result;
}
