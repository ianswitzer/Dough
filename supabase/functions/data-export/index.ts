import { serviceClient } from '../_shared/admin.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

const TABLES = [
  'profiles',
  'accounts',
  'categories',
  'tags',
  'transactions',
  'transaction_tags',
  'merchant_rules',
  'budget_months',
  'category_budgets',
  'recurring_transactions',
  'review_items',
  'insights',
  'saved_views',
  'import_jobs',
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const user = await requireUser(req);
    const admin = serviceClient();
    const data: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
    };

    for (const table of TABLES) {
      const idColumn = table === 'profiles' ? 'id' : 'user_id';
      const { data: rows, error } = await admin.from(table).select('*').eq(idColumn, user.id);
      if (error) throw error;
      data[table] = rows ?? [];
    }

    return json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not export data';
    return json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
});
