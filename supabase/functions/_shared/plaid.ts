// Shared Plaid wiring for the Edge Functions. Keeps the client factory and the
// Plaid→Dough mappers in one place so the link/exchange/sync functions stay
// thin and consistent. Secrets are read from function env (set via
// `supabase secrets set`), never from anything EXPO_PUBLIC_*.
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  type AccountBase,
  type Transaction as PlaidTxn,
} from 'npm:plaid@^38.1.0';

export function plaidClient(): PlaidApi {
  const clientId = Deno.env.get('PLAID_CLIENT_ID');
  const secret = Deno.env.get('PLAID_SECRET');
  const env = Deno.env.get('PLAID_ENV') ?? 'sandbox';
  if (!clientId || !secret) throw new Error('Missing Plaid secrets');

  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox,
      baseOptions: { headers: { 'PLAID-CLIENT-ID': clientId, 'PLAID-SECRET': secret } },
    }),
  );
}

// Plaid amounts are positive-dollar floats where a positive value means money
// leaving the account (a debit/expense). Dough stores signed integer cents with
// the SAME sign convention (expense positive, income negative), so we just
// convert dollars→cents and round. See CLAUDE.md "Amount sign convention".
export const toAmountCents = (amount: number): number => Math.round(amount * 100);

// Map a Plaid account type to the Dough `account_type` enum.
export function toAccountType(type: string | null | undefined, subtype: string | null | undefined): string {
  if (type === 'credit') return 'credit_card';
  if (type === 'loan') return 'loan';
  if (type === 'investment') return 'investment';
  if (subtype === 'savings') return 'savings';
  if (type === 'depository') return 'checking';
  return 'manual';
}

// A Plaid account → an `accounts` upsert row (keyed on user + external id).
export function accountRow(user_id: string, a: AccountBase, institutionName: string | null) {
  return {
    user_id,
    name: a.name ?? a.official_name ?? 'Account',
    institution_name: institutionName,
    type: toAccountType(a.type, a.subtype),
    sync_provider: 'plaid',
    external_account_id: a.account_id,
    current_balance_cents: a.balances?.current != null ? toAmountCents(a.balances.current) : null,
    available_balance_cents: a.balances?.available != null ? toAmountCents(a.balances.available) : null,
    is_active: true,
  };
}

// A Plaid transaction → a `transactions` upsert row. `account_id` is the Dough
// (uuid) account id resolved from the Plaid account_id by the caller.
export function transactionRow(user_id: string, account_id: string, t: PlaidTxn) {
  const isIncome = t.amount < 0; // Plaid: negative = money in
  return {
    user_id,
    account_id,
    date: t.date,
    posted_date: t.authorized_date ?? t.date,
    description_raw: t.name,
    description_clean: t.merchant_name ?? t.name,
    amount_cents: toAmountCents(t.amount),
    currency: t.iso_currency_code ?? 'USD',
    type: isIncome ? 'income' : 'expense',
    status: t.pending ? 'pending' : 'posted',
    source: 'plaid',
    external_transaction_id: t.transaction_id,
    review_status: 'needs_review',
  };
}
