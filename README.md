# 🍞 Dough

A soft, calm **money-pulse** app for people who hate budgeting. Dough answers a
few emotionally important questions instead of drowning you in dashboards:

> How much can I safely spend? What changed this month? What needs my attention?

Built from the [product spec](docs/budget_app_mvp_spec.docx) and a Claude Design
handoff (see [docs/DESIGN.md](docs/DESIGN.md)).

- **App:** Expo SDK 54 / React Native + TypeScript (iOS-first, runs in Expo Go)
- **Backend:** Supabase (Postgres, Auth, Row Level Security)
- **Routing:** `expo-router`

## Status

MVP feature-complete on the client: auth + onboarding, all five tabs (Today,
Transactions, Plan, Insights, Settings) and the detail overlays are built and
wired to Supabase through the repository layer; dark mode ships. The client now
also refreshes generated insights, review items, and recurring candidates from
transaction history when the relevant screens load. Profile, financial account,
category detail owns category name/budget edits, Plan `+` creates a category,
and tag/rule/saved-view/data export/account deletion screens are in place.
`tsc --noEmit` and `expo-doctor` are clean. Next step is
verifying against a live Supabase project on a simulator/device — see
[TODO.md](TODO.md).

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure Supabase

Create a project at [supabase.com](https://supabase.com), then:

```bash
cp .env.example .env
# edit .env and paste your Project URL + anon/public key
```

> **Security:** The anon key is public *by design* — it's gated by Row Level
> Security. Never put the `service_role` key in `.env` or anywhere in this repo.
> See [CLAUDE.md → Secrets](CLAUDE.md#secrets--how-to-use-supabase-keys-safely).

### 3. Apply the database schema

Using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <your-ref>
supabase db push          # applies everything in supabase/migrations/
```

Or paste the files in `supabase/migrations/` into the Supabase SQL editor in
order.

### 4. Run

```bash
npm run ios       # or: npm run android / npm run web
```

> **Auth for local testing:** Supabase requires email confirmation on sign-up by
> default, so a new account has no session until the email link is clicked. For
> fast local testing, turn it off: Supabase Dashboard → **Authentication →
> Sign In / Providers → Email → disable "Confirm email"**. Then sign-up logs you
> straight into onboarding.

### 5. (Optional) Load sample data

The schema seeds default categories/tags/views but no transactions, so the
screens start empty. To make the app look like the design, sign up first, then
run [`supabase/seed_sample_data.sql`](supabase/seed_sample_data.sql) in the
Supabase SQL editor (set `v_email` to your sign-up email at the top). It's
idempotent — safe to re-run.

### 6. (Optional) Plaid sync scaffold

The app has a Plaid starter screen and Supabase Edge Function scaffolds for
`plaid-create-link-token` and `plaid-exchange-public-token`. Before enabling
the client button, deploy those functions and set secrets in Supabase, not in
Expo `.env`:

```bash
supabase secrets set PLAID_CLIENT_ID=... PLAID_SECRET=... PLAID_ENV=sandbox
# optional for Android OAuth institutions:
supabase secrets set PLAID_ANDROID_PACKAGE_NAME=com.yourcompany.dough
```

The current scaffold creates a Link token and exchanges a public token; durable
Plaid item storage, encrypted access-token storage, account mapping, and
transaction sync are still TODO.

### 7. (Optional) Data export / account deletion functions

The Data & account screen calls `data-export` and `account-delete` Supabase Edge
Functions. `account-delete` requires a server-side service role key so it can
delete the authenticated Supabase user:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

Never expose that key through `EXPO_PUBLIC_*` variables or the app bundle.

## Project layout

```
app/            expo-router routes (auth, onboarding, tabs)
src/
  theme/        design tokens (light + dark), typography, ThemeProvider
  components/   reusable UI primitives
  features/     screen composition
  data/         domain types + repository interfaces + Supabase impls
  services/     domain logic (safe-to-spend, insights, recurring detection)
  lib/          formatters & small utilities
supabase/
  migrations/   SQL schema + RLS policies + default seed
docs/           product spec + design notes
```

Architecture and contribution rules live in [CLAUDE.md](CLAUDE.md) — read it
before contributing. In short: SOLID, small modular files, depend on repository
interfaces (not Supabase directly), keep docs in sync, commit incrementally, and
never commit secrets.

## Scripts

| Command            | What it does                 |
|--------------------|------------------------------|
| `npm start`        | Expo dev server              |
| `npm run ios`      | Run on iOS simulator         |
| `npm run android`  | Run on Android emulator      |
| `npm run web`      | Run in browser               |
| `npm run typecheck`| `tsc --noEmit`               |
