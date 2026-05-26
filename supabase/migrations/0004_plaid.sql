-- Plaid bank-sync persistence (stretch per spec §5; Link flow added 2026-05).
--
-- A `plaid_items` row holds the long-lived Plaid `access_token` and the
-- `/transactions/sync` cursor for one linked Item (one institution login).
-- The access token is a server-only secret: it must NEVER reach the client
-- bundle. So unlike every other table, this one enables RLS with NO policies —
-- the anon/authenticated key can touch nothing here. Only the Edge Functions,
-- which use the service_role key (and bypass RLS), read or write it.
--
-- Plaid accounts/transactions themselves land in the regular `accounts` /
-- `transactions` tables (already owner-scoped + RLS'd), so the client reads
-- synced data through the normal repositories. It never needs this table.

create table plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null unique,              -- Plaid Item id
  access_token text not null,                -- SERVER-ONLY secret
  institution_id text,
  institution_name text,
  cursor text,                               -- /transactions/sync pagination cursor
  status text not null default 'active',     -- 'active' | 'login_required' | 'revoked'
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index plaid_items_user_idx on plaid_items(user_id);

-- Dedup synced accounts so re-linking an institution upserts instead of
-- duplicating. Partial (provider ids only) mirrors transactions_external_uidx.
create unique index accounts_external_uidx
  on accounts(user_id, external_account_id)
  where external_account_id is not null;

-- Lock the table to service_role only: RLS on, zero policies → the public anon
-- key sees nothing. The access_token never leaves the server.
alter table plaid_items enable row level security;

create trigger plaid_items_updated_at before update on plaid_items
  for each row execute function set_updated_at();
