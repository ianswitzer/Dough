-- Row Level Security (spec §16 "Use row-level authorization checks on every
-- user-scoped resource"). The client ships a PUBLIC anon key, so these policies
-- are the actual access control — not a nicety. Every table is owner-scoped:
-- a row is visible/writable only when its user_id matches the JWT's auth.uid().

-- Helper: enable RLS + a single owner policy (select/insert/update/delete) on a
-- table whose ownership column is user_id.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','households','household_members','accounts','merchants',
    'categories','tags','transactions','transaction_tags','transaction_splits',
    'merchant_rules','budget_months','category_budgets','recurring_transactions',
    'recurring_matches','income_events','review_items','insights','saved_views',
    'import_jobs'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- profiles: id IS the auth user id.
create policy profiles_owner on profiles
  using (auth.uid() = id) with check (auth.uid() = id);

-- households: owner is created_by_user_id.
create policy households_owner on households
  using (auth.uid() = created_by_user_id) with check (auth.uid() = created_by_user_id);

-- Every other table is keyed on user_id with one all-verbs policy each.
do $$
declare t text;
begin
  foreach t in array array[
    'household_members','accounts','merchants','categories','tags',
    'transactions','transaction_tags','transaction_splits','merchant_rules',
    'budget_months','category_budgets','recurring_transactions',
    'recurring_matches','income_events','review_items','insights',
    'saved_views','import_jobs'
  ]
  loop
    execute format(
      'create policy %1$s_owner on %1$I using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;
