import { Configuration, PlaidApi, PlaidEnvironments } from 'npm:plaid@^38.1.0';

import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    await requireUser(req);
    const { public_token: publicToken } = await req.json();
    if (!publicToken || typeof publicToken !== 'string') {
      return json({ error: 'Missing public_token' }, { status: 400 });
    }

    const response = await plaidClient().itemPublicTokenExchange({ public_token: publicToken });

    // TODO: Persist encrypted access_token + item_id server-side, then map Plaid
    // accounts into `accounts` and enqueue the first transactions sync.
    return json({ item_id: response.data.item_id, request_id: response.data.request_id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not exchange Plaid public token';
    return json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
});

function plaidClient() {
  const clientId = Deno.env.get('PLAID_CLIENT_ID');
  const secret = Deno.env.get('PLAID_SECRET');
  const env = Deno.env.get('PLAID_ENV') ?? 'sandbox';
  if (!clientId || !secret) throw new Error('Missing Plaid secrets');

  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    }),
  );
}
