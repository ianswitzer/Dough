-- Opinionated defaults (spec §2 "Opinionated defaults beat blank setup").
-- On sign-up we create the profile, the 10 default categories (§4.1), the
-- standard tags, the default saved views (Appendix B), and the current
-- budget month — so the user lands on a useful Today without a setup form.

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := new.id;
  y int := extract(year from now())::int;
  m int := extract(month from now())::int;
begin
  insert into profiles (id, email) values (uid, new.email)
    on conflict (id) do nothing;

  -- Default categories (slug drives UI tint/glyph). Order matches spec §4.1.
  insert into categories (user_id, name, slug, type, tint, sort_order, is_default) values
    (uid, 'Groceries',             'groceries',   'expense', 'sage',   1, true),
    (uid, 'Restaurants & Coffee',  'restaurants', 'expense', 'accent', 2, true),
    (uid, 'Shopping',              'shopping',    'expense', 'sky',    3, true),
    (uid, 'Home',                  'home',        'expense', 'sage',   4, true),
    (uid, 'Transportation',        'transport',   'expense', 'accent', 5, true),
    (uid, 'Entertainment',         'entertain',   'expense', 'plum',   6, true),
    (uid, 'Health',                'health',      'expense', 'sage',   7, true),
    (uid, 'Pets',                  'pets',        'expense', 'accent', 8, true),
    (uid, 'Bills & Subscriptions', 'bills',       'expense', 'sky',    9, true),
    (uid, 'Other',                 'other',       'expense', 'muted', 10, true);

  -- Standard tags.
  insert into tags (user_id, name, tag_type) values
    (uid, 'Household',    'household'),
    (uid, 'Personal',     'custom'),
    (uid, 'Reimbursable', 'reimbursement'),
    (uid, 'Trip',         'trip'),
    (uid, 'Ignore',       'ignore');

  -- Default saved views (Appendix B).
  insert into saved_views (user_id, name, slug, filters_json, sort_order, is_default) values
    (uid, 'All spending',     'all',       '{"hidden":false}',           1, true),
    (uid, 'Household',        'household', '{"tags":["Household"]}',      2, true),
    (uid, 'Personal',         'personal',  '{"tags":["Personal"]}',      3, true),
    (uid, 'Reimbursable',     'reimburse', '{"tags":["Reimbursable"]}',  4, true),
    (uid, 'Subscriptions',    'subs',      '{"category":"bills"}',       5, true),
    (uid, 'Hidden / Ignored', 'hidden',    '{"hidden":true}',            6, true);

  -- Current budget month with a default $200 buffer.
  insert into budget_months (user_id, year, month, buffer_cents)
    values (uid, y, m, 20000)
    on conflict (user_id, year, month) do nothing;

  return new;
end;
$$;

-- Fire after a new auth user is created.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
