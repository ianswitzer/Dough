// Step 2 of Plaid Link: exchange the short-lived public_token (returned by the
// client after the user finishes Link) for a long-lived access_token, persist
// the Item server-side, map its accounts into `accounts`, and run the first
// transaction sync. The access_token is stored in `plaid_items` (service-role
// only) and never returned to the client.
import { serviceClient } from '../_shared/admin.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, json } from '../_shared/cors.ts';
import { accountRow, plaidClient } from '../_shared/plaid.ts';
import { syncItemTransactions } from '../_shared/plaid-sync.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const user = await requireUser(req);
    const body = await req.json();
    const publicToken: unknown = body?.public_token;
    if (!publicToken || typeof publicToken !== 'string') {
      return json({ error: 'Missing public_token' }, { status: 400 });
    }
    // Institution name/id come from Plaid Link's onSuccess metadata (optional).
    const institutionName: string | null = body?.institution?.name ?? null;
    const institutionId: string | null = body?.institution?.id ?? null;

    const plaid = plaidClient();
    const admin = serviceClient();

    const exchange = await plaid.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    // Persist the Item (access_token is a server-only secret). Upsert on item_id
    // so re-linking the same institution updates rather than duplicates.
    const { data: itemRow, error: itemErr } = await admin
      .from('plaid_items')
      .upsert(
        {
          user_id: user.id,
          item_id: itemId,
          access_token: accessToken,
          institution_id: institutionId,
          institution_name: institutionName,
          status: 'active',
        },
        { onConflict: 'item_id' },
      )
      .select('id, user_id, access_token, cursor')
      .single();
    if (itemErr) throw new Error(itemErr.message);

    // Map Plaid accounts → `accounts` (deduped on external_account_id per user).
    const accountsResp = await plaid.accountsGet({ access_token: accessToken });
    const rows = accountsResp.data.accounts.map((a) => accountRow(user.id, a, institutionName));
    if (rows.length) {
      const { error: accErr } = await admin
        .from('accounts')
        .upsert(rows, { onConflict: 'user_id,external_account_id', ignoreDuplicates: false });
      if (accErr) throw new Error(accErr.message);
    }

    const synced = await syncItemTransactions(admin, plaid, itemRow);

    return json({ item_id: itemId, accounts: rows.length, synced });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not exchange Plaid public token';
    return json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
});
