import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'npm:plaid@^38.1.0';

import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const user = await requireUser(req);
    const client = plaidClient();
    const androidPackageName = Deno.env.get('PLAID_ANDROID_PACKAGE_NAME') || undefined;
    // Required only for OAuth institutions on iOS. Must be a Universal Link that
    // is also registered in the Plaid dashboard (Team Settings → API → Allowed
    // redirect URIs). Leave unset to use non-OAuth institutions (e.g. sandbox
    // testing) — passing an empty/unregistered value makes Plaid reject Link.
    const redirectUri = Deno.env.get('PLAID_REDIRECT_URI') || undefined;
    const response = await client.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: 'Dough',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
      android_package_name: androidPackageName,
      redirect_uri: redirectUri,
    });

    return json({ link_token: response.data.link_token, expiration: response.data.expiration });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not create Plaid link token';
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
