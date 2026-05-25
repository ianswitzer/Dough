-- Dough — core schema (spec §8–§9, Appendix A).
-- Money is stored as integer cents. Amount sign convention: expenses positive,
-- income negative (signed ledger). All user-scoped tables carry user_id ->
-- auth.users so RLS (0002_rls.sql) can gate every row.

-- ── Enums ──────────────────────────────────────────────────────────────────
create type account_type as enum ('checking','savings','credit_card','cash','loan','investment','manual');
create type sync_provider as enum ('csv','plaid','mx','teller','manual');
create type txn_type as enum ('expense','income','transfer','refund','adjustment');
create type txn_status as enum ('pending','posted','excluded','deleted');
create type review_status as enum ('needs_review','reviewed','ignored');
create type txn_source as enum ('csv','plaid','manual','api');
create type category_type as enum ('expense','income','transfer');
create type tag_type as enum ('system','custom','trip','household','reimbursement','ignore');
create type rule_match_type as enum ('merchant_id','raw_description_contains','exact_description','amount_range','account_id');
create type cadence as enum ('weekly','biweekly','semimonthly','monthly','quarterly','annual','one_time','irregular');
create type recurring_status as enum ('candidate','confirmed','ignored','ended');
create type confidence as enum ('low','medium','high');
create type review_kind as enum ('uncategorized_transaction','unusual_charge','subscription_increase','recurring_candidate','budget_drift','duplicate_possible','rule_suggestion');
create type severity as enum ('info','warning','urgent');
create type review_item_status as enum ('open','completed','dismissed','snoozed');
create type insight_kind as enum ('spending_drift','merchant_delta','category_delta','unusual_transaction','recurring_change','monthly_summary');
create type import_status as enum ('pending','processing','completed','failed','needs_mapping');

-- ── Identity (spec §9.1–§9.3) ───────────────────────────────────────────────
-- The "User" entity. Mirrors auth.users; 0003 auto-creates a row on sign-up.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  timezone text not null default 'America/New_York',
  currency text not null default 'USD',
  dark_mode text not null default 'system', -- 'system' | 'light' | 'dark'
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  default_currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',   -- owner | member | viewer
  status text not null default 'active', -- active | invited | removed
  joined_at timestamptz default now(),
  unique (household_id, user_id)
);

-- ── Accounts (spec §9.4) ────────────────────────────────────────────────────
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete set null,
  name text not null,
  institution_name text,
  type account_type not null default 'checking',
  sync_provider sync_provider default 'manual',
  external_account_id text,
  current_balance_cents bigint,
  available_balance_cents bigint,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index accounts_user_idx on accounts(user_id);

-- ── Merchants (spec §9.6) ───────────────────────────────────────────────────
create table merchants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  canonical_name text not null,
  display_name text not null,
  merchant_type text, -- grocery | restaurant | retail | utility | income | transfer | unknown
  created_at timestamptz not null default now()
);
create index merchants_user_idx on merchants(user_id);

-- ── Categories (spec §9.7) ──────────────────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete set null,
  name text not null,
  slug text not null, -- stable key used for UI tint/glyph mapping
  type category_type not null default 'expense',
  tint text not null default 'muted',
  sort_order int not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  unique (user_id, slug)
);
create index categories_user_idx on categories(user_id);

-- ── Tags (spec §9.8) + join (§9.9) ──────────────────────────────────────────
create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete set null,
  name text not null,
  tag_type tag_type not null default 'custom',
  color text,
  is_active boolean not null default true,
  unique (user_id, name)
);
create index tags_user_idx on tags(user_id);

-- ── Transactions (spec §9.5) ────────────────────────────────────────────────
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete set null,
  account_id uuid not null references accounts(id) on delete cascade,
  merchant_id uuid references merchants(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  date date not null,
  posted_date date,
  description_raw text not null,
  description_clean text,
  amount_cents bigint not null, -- expense positive, income negative
  currency text not null default 'USD',
  type txn_type not null default 'expense',
  status txn_status not null default 'posted',
  is_hidden_from_budget boolean not null default false,
  is_recurring_candidate boolean not null default false,
  review_status review_status not null default 'reviewed',
  flag text, -- 'unusual' | 'split-suggested' | null (UI hint)
  source txn_source not null default 'manual',
  external_transaction_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transactions_user_date_idx on transactions(user_id, date desc);
create index transactions_account_idx on transactions(account_id);
create index transactions_category_idx on transactions(category_id);
-- Dedup synced rows when a provider id exists.
create unique index transactions_external_uidx
  on transactions(account_id, external_transaction_id)
  where external_transaction_id is not null;

create table transaction_tags (
  transaction_id uuid not null references transactions(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (transaction_id, tag_id)
);

-- ── Transaction splits (spec §9.10) ─────────────────────────────────────────
create table transaction_splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null references transactions(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  amount_cents bigint not null,
  description text,
  created_at timestamptz not null default now()
);

-- ── Merchant rules (spec §9.11) ─────────────────────────────────────────────
create table merchant_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete set null,
  match_type rule_match_type not null,
  match_value text not null,
  priority int not null default 0,
  set_category_id uuid references categories(id) on delete set null,
  add_tag_ids uuid[] default '{}',
  set_hidden_from_budget boolean,
  rename_to text,
  is_active boolean not null default true,
  created_from_transaction_id uuid references transactions(id) on delete set null,
  created_at timestamptz not null default now()
);
create index merchant_rules_user_idx on merchant_rules(user_id);

-- ── Budgets (spec §9.12–§9.13) ──────────────────────────────────────────────
create table budget_months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete set null,
  year int not null,
  month int not null,
  income_expected_cents bigint,
  buffer_cents bigint not null default 20000,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, year, month)
);

create table category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_month_id uuid not null references budget_months(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  limit_cents bigint not null,
  rollover_mode text default 'none',
  is_active boolean not null default true,
  unique (budget_month_id, category_id)
);

-- ── Recurring (spec §9.14–§9.16) ────────────────────────────────────────────
create table recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete set null,
  merchant_id uuid references merchants(id) on delete set null,
  account_id uuid references accounts(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  cadence cadence not null default 'monthly',
  expected_amount_cents bigint not null, -- expense positive, income negative
  amount_variance_cents bigint default 0,
  next_expected_date date not null,
  last_seen_date date,
  status recurring_status not null default 'confirmed',
  is_income boolean not null default false,
  created_at timestamptz not null default now()
);
create index recurring_user_idx on recurring_transactions(user_id);

create table recurring_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recurring_transaction_id uuid not null references recurring_transactions(id) on delete cascade,
  transaction_id uuid not null references transactions(id) on delete cascade,
  confidence numeric not null default 1,
  matched_at timestamptz not null default now()
);

create table income_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  source_name text not null,
  expected_date date not null,
  expected_amount_cents bigint not null,
  actual_transaction_id uuid references transactions(id) on delete set null,
  cadence cadence default 'biweekly'
);

-- ── Review inbox + insights (spec §9.18–§9.19) ──────────────────────────────
create table review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind review_kind not null,
  severity severity not null default 'info',
  title text not null,
  body text not null,
  related_object_type text, -- transaction | recurring_transaction | category_budget | insight | merchant_rule
  related_object_id uuid,
  status review_item_status not null default 'open',
  due_date date,
  created_at timestamptz not null default now()
);
create index review_items_user_idx on review_items(user_id, status);

create table insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind insight_kind not null,
  period_start date not null,
  period_end date not null,
  title text not null,
  summary text not null,
  metric_name text,
  current_value_cents bigint,
  comparison_value_cents bigint,
  delta_cents bigint,
  direction text, -- 'up' | 'down' | 'flat'
  category_slug text,
  confidence confidence not null default 'medium',
  created_at timestamptz not null default now()
);
create index insights_user_idx on insights(user_id);

-- ── Saved views + imports (spec §9.20–§9.21) ────────────────────────────────
create table saved_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete set null,
  name text not null,
  slug text not null,
  filters_json jsonb not null default '{}',
  sort_order int not null default 0,
  is_default boolean not null default false,
  unique (user_id, slug)
);

create table import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  source txn_source not null default 'csv',
  status import_status not null default 'pending',
  file_name text,
  rows_seen int,
  transactions_created int,
  transactions_skipped int,
  error_message text,
  created_at timestamptz not null default now()
);

-- ── updated_at trigger for the two mutable-heavy tables ─────────────────────
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger transactions_updated_at before update on transactions
  for each row execute function set_updated_at();
