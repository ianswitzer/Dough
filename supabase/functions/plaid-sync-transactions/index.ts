// Incremental refresh: sync every active Plaid Item for the calling user from
// its stored cursor. Called from the app (pull-to-refresh / "Sync now") and
// safe to call repeatedly — /transactions/sync is idempotent via the cursor.
import { serviceClient } from '../_shared/admin.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, json } from '../_shared/cors.ts';
import { plaidClient } from '../_shared/plaid.ts';
import { syncItemTransactions, type SyncResult } from '../_shared/plaid-sync.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const user = await requireUser(req);
    const plaid = plaidClient();
    const admin = serviceClient();

    const { data: items, error } = await admin
      .from('plaid_items')
      .select('id, user_id, access_token, cursor')
      .eq('user_id', user.id)
      .eq('status', 'active');
    if (error) throw new Error(error.message);

    const totals: SyncResult = { added: 0, modified: 0, removed: 0 };
    for (const item of items ?? []) {
      const r = await syncItemTransactions(admin, plaid, item);
      totals.added += r.added;
      totals.modified += r.modified;
      totals.removed += r.removed;
    }

    return json({ items: items?.length ?? 0, synced: totals });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not sync Plaid transactions';
    return json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
});
