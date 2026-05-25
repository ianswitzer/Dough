-- ─────────────────────────────────────────────────────────────────────────
-- OPTIONAL sample data for local testing / demos. NOT a migration — run it by
-- hand in the Supabase SQL editor AFTER you've signed up in the app (so your
-- auth user + seeded categories exist).
--
-- 1. Sign up in the app with your email.
-- 2. Set v_email below to that email.
-- 3. Paste this whole file into the Supabase SQL editor and run it.
--
-- Safe to re-run: it deletes this user's accounts/recurring/review/insights
-- first (transactions cascade from accounts), then re-inserts. It does NOT
-- touch auth or the default categories/tags/views.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  v_email text := 'ian@switzer.club';   -- ← set to your sign-up email
  v_uid uuid;
  v_chase uuid;
  v_amex uuid;
  v_bm uuid;
  d date := current_date;
begin
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    raise exception 'No auth user for %, sign up in the app first', v_email;
  end if;

  -- Clean prior sample rows for an idempotent re-run.
  delete from accounts where user_id = v_uid;
  delete from recurring_transactions where user_id = v_uid;
  delete from review_items where user_id = v_uid;
  delete from insights where user_id = v_uid;
  delete from category_budgets where user_id = v_uid;

  -- Give the profile a name so Today greets you.
  update profiles set display_name = coalesce(display_name, 'Ada Singh'), onboarded = true
    where id = v_uid;

  -- Accounts.
  insert into accounts (user_id, name, type, current_balance_cents, sync_provider)
    values (v_uid, 'Chase Checking', 'checking', 426712, 'csv') returning id into v_chase;
  insert into accounts (user_id, name, type, current_balance_cents, sync_provider)
    values (v_uid, 'Amex Gold', 'credit_card', -82430, 'csv') returning id into v_amex;
  insert into accounts (user_id, name, type, current_balance_cents, sync_provider)
    values (v_uid, 'Ally Savings', 'savings', 1240500, 'manual');

  -- Helper: category id by slug for this user.
  -- (inline subqueries below)

  -- Transactions (expense positive, income negative). Dates anchored to today.
  insert into transactions
    (user_id, account_id, category_id, date, description_raw, description_clean,
     amount_cents, type, review_status, is_recurring_candidate, flag)
  values
    (v_uid, v_chase, (select id from categories where user_id=v_uid and slug='restaurants'), d,        'BLUEBOTTLE COFFEE #318',  'Blue Bottle Coffee', 612,    'expense', 'needs_review', false, null),
    (v_uid, v_chase, (select id from categories where user_id=v_uid and slug='groceries'),   d,        'TRADER JOES #455',        'Trader Joe''s',      4287,   'expense', 'reviewed', false, null),
    (v_uid, v_amex,  (select id from categories where user_id=v_uid and slug='transport'),   d - 1,    'LYFT *RIDE',              'Lyft',               1820,   'expense', 'reviewed', false, null),
    (v_uid, v_amex,  (select id from categories where user_id=v_uid and slug='shopping'),    d - 1,    'AMZN MKTP US*Z14H9',      'Amazon',             6499,   'expense', 'needs_review', false, 'unusual'),
    (v_uid, v_chase, (select id from categories where user_id=v_uid and slug='groceries'),   d - 2,    'COSTCO WHSE #1021',       'Costco',             18712,  'expense', 'reviewed', false, 'split-suggested'),
    (v_uid, v_amex,  (select id from categories where user_id=v_uid and slug='bills'),       d - 2,    'SPOTIFY P0A1B2',          'Spotify',            1099,   'expense', 'reviewed', true,  null),
    (v_uid, v_chase, (select id from categories where user_id=v_uid and slug='bills'),       d - 3,    'DUKE ENERGY BILLPAY',     'Duke Energy',        11455,  'expense', 'reviewed', true,  null),
    (v_uid, v_chase, (select id from categories where user_id=v_uid and slug='other'),       d - 3,    'PAYROLL DEPOSIT',         'Bi-Weekly Payroll',  -284500,'income',  'reviewed', true,  null),
    (v_uid, v_amex,  (select id from categories where user_id=v_uid and slug='transport'),   d - 4,    'SHELL OIL 574',           'Shell',              4732,   'expense', 'reviewed', false, null),
    (v_uid, v_amex,  (select id from categories where user_id=v_uid and slug='restaurants'), d - 4,    'DOORDASH*LOCAL',          'DoorDash',           3290,   'expense', 'reviewed', false, null),
    (v_uid, v_chase, (select id from categories where user_id=v_uid and slug='groceries'),   d - 5,    'HARRIS TEETER 882',       'Harris Teeter',      5612,   'expense', 'reviewed', false, null),
    (v_uid, v_chase, (select id from categories where user_id=v_uid and slug='health'),      d - 5,    'CVS/PHARMACY 0421',       'CVS Pharmacy',       2284,   'expense', 'reviewed', false, null),
    (v_uid, v_chase, (select id from categories where user_id=v_uid and slug='pets'),        d - 6,    'CHEWY.COM',               'Chewy',              6188,   'expense', 'reviewed', false, null),
    (v_uid, v_amex,  (select id from categories where user_id=v_uid and slug='restaurants'), d - 7,    'STARBUCKS 0991',          'Starbucks',          689,    'expense', 'reviewed', false, null),
    (v_uid, v_amex,  (select id from categories where user_id=v_uid and slug='restaurants'), d - 7,    'LOCAL ITALIAN',           'Local Italian',      7245,   'expense', 'needs_review', false, null),
    (v_uid, v_chase, (select id from categories where user_id=v_uid and slug='home'),        d - 8,    'HOME DEPOT 4412',         'Home Depot',         8434,   'expense', 'reviewed', false, null),
    (v_uid, v_amex,  (select id from categories where user_id=v_uid and slug='bills'),       d - 9,    'NETFLIX.COM',             'Netflix',            1599,   'expense', 'reviewed', true,  null);

  -- Tag a few as Household / Personal.
  insert into transaction_tags (transaction_id, tag_id, user_id)
  select t.id, (select id from tags where user_id=v_uid and name='Household'), v_uid
    from transactions t
   where t.user_id=v_uid and t.description_clean in ('Trader Joe''s','Costco','Duke Energy','Harris Teeter','Chewy','Home Depot');
  insert into transaction_tags (transaction_id, tag_id, user_id)
  select t.id, (select id from tags where user_id=v_uid and name='Personal'), v_uid
    from transactions t
   where t.user_id=v_uid and t.description_clean in ('Blue Bottle Coffee','DoorDash','Starbucks');

  -- Recurring bills + income.
  insert into recurring_transactions
    (user_id, category_id, name, cadence, expected_amount_cents, amount_variance_cents, next_expected_date, status, is_income)
  values
    (v_uid, (select id from categories where user_id=v_uid and slug='home'),      'Rent',          'monthly',  220000, 0,    date_trunc('month', d)::date + interval '1 month', 'confirmed', false),
    (v_uid, (select id from categories where user_id=v_uid and slug='bills'),     'Internet',      'monthly',  7999,   0,    d + 10, 'confirmed', false),
    (v_uid, (select id from categories where user_id=v_uid and slug='other'),     'Payroll',       'biweekly', -284500,0,    d + 11, 'confirmed', true),
    (v_uid, (select id from categories where user_id=v_uid and slug='health'),    'Gym',           'monthly',  4900,   0,    d + 13, 'confirmed', false),
    (v_uid, (select id from categories where user_id=v_uid and slug='transport'), 'Car Insurance', 'monthly',  14200,  0,    d + 18, 'confirmed', false),
    (v_uid, (select id from categories where user_id=v_uid and slug='bills'),     'Netflix',       'monthly',  1599,   0,    d + 22, 'confirmed', false),
    (v_uid, (select id from categories where user_id=v_uid and slug='bills'),     'Duke Energy',   'monthly',  11455,  1400, d + 25, 'confirmed', false),
    (v_uid, (select id from categories where user_id=v_uid and slug='bills'),     'Spotify',       'monthly',  1099,   0,    d + 29, 'confirmed', false);

  -- Review inbox items.
  insert into review_items (user_id, kind, severity, title, body) values
    (v_uid, 'unusual_charge',        'warning', 'Big charge at Amazon',          '$64.99 · much larger than usual'),
    (v_uid, 'recurring_candidate',   'info',    'Looks like a new subscription', 'Notion · $10/mo · seen 3 months'),
    (v_uid, 'duplicate_possible',    'info',    'Two Shell charges, same day',   'Tap to compare · $47.32 each'),
    (v_uid, 'uncategorized_transaction','info', 'Categorize Local Italian',      '$72.45 · Restaurants suggested');

  -- Insights.
  insert into insights (user_id, kind, period_start, period_end, title, summary, delta_cents, direction, category_slug, confidence) values
    (v_uid, 'monthly_summary', date_trunc('month', d)::date, d, 'A normal month', 'A normal month, but you''re leaning into restaurants and easing off Amazon.', null, 'flat', null, 'medium'),
    (v_uid, 'spending_drift',  date_trunc('month', d)::date, d, 'Restaurants are up $86', 'You spent $432 on restaurants so far this month, vs your usual $346 by now. Most of it is DoorDash and Local Italian.', 8600, 'up', 'restaurants', 'high'),
    (v_uid, 'recurring_change',date_trunc('month', d)::date, d, 'Duke Energy went up $8', 'Your power bill bumped from $107 to $115. Still within normal seasonal range.', 800, 'up', 'bills', 'high'),
    (v_uid, 'merchant_delta',  date_trunc('month', d)::date, d, 'You bought less at Amazon', 'Three Amazon charges this month vs an average of seven. Net difference: -$142.', -14200, 'down', 'shopping', 'medium');

  -- Category budgets for the current budget month (Plan + Insights bars).
  select id into v_bm from budget_months
    where user_id=v_uid and year=extract(year from d)::int and month=extract(month from d)::int;
  if v_bm is not null then
    insert into category_budgets (user_id, budget_month_id, category_id, limit_cents)
    select v_uid, v_bm, c.id, x.limit_cents
      from (values
        ('groceries',75000),('restaurants',50000),('shopping',30000),('transport',30000),
        ('home',25000),('bills',40000),('entertain',12000),('health',15000)
      ) as x(slug, limit_cents)
      join categories c on c.user_id=v_uid and c.slug=x.slug;
  end if;

  raise notice 'Sample data loaded for %', v_email;
end $$;
