-- Fix Plaid sync upserts failing with "no unique or exclusion constraint
-- matching the ON CONFLICT specification".
--
-- The Edge Functions upsert synced rows via PostgREST, which emits a bare
-- `ON CONFLICT (cols)` with no WHERE clause. Postgres will NOT infer a PARTIAL
-- unique index for that, so the original partial indexes (… where col is not
-- null) can't be used as the conflict target and the upsert errors out.
--
-- Replace them with full unique indexes on the same columns. This is safe:
-- a plain unique index treats NULLs as DISTINCT, so the many manual rows whose
-- external id is NULL still coexist freely — only non-null ids are deduped.

drop index if exists transactions_external_uidx;
create unique index transactions_external_uidx
  on transactions(account_id, external_transaction_id);

-- Added in 0004 (also partial) for re-link dedup — same fix.
drop index if exists accounts_external_uidx;
create unique index accounts_external_uidx
  on accounts(user_id, external_account_id);
