# 🍞 Dough

A soft, calm **money-pulse** app for people who hate budgeting. Dough answers a
few emotionally important questions instead of drowning you in dashboards:

> How much can I safely spend? What changed this month? What needs my attention?

Built from the [product spec](docs/budget_app_mvp_spec.docx) and a Claude Design
handoff (see [docs/DESIGN.md](docs/DESIGN.md)).

- **App:** Expo SDK 54 / React Native + TypeScript (iOS-first; Expo Go for most
  screens, custom dev build required for Plaid Link)
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
`tsc --noEmit` and `expo-doctor` are clean, and the app has been run against a
live Supabase project on a simulator/device. Plaid bank sync is built but still
needs its functions deployed + an end-to-end pass — see [TODO.md](TODO.md).

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
npx expo run:ios  # builds the custom dev client (required for Plaid Link)
```

> **Dev build vs Expo Go.** Adding Plaid Link pulled in a native module, so the
> app now needs a custom dev build — `npx expo run:ios` builds and installs it.
> `npm run ios` (Expo Go) still works for everything *except* the Plaid Link
> screen, which needs the native module.

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

### 6. Plaid bank sync (real data)

The full Link flow is wired: tap **Settings → Connect bank with Plaid**, log in
through Plaid's secure flow, and the linked accounts + transactions sync into
Dough. Three Edge Functions broker it server-side so the Plaid secret and the
long-lived access token never reach the app:

- `plaid-create-link-token` — mints the Link token the client opens.
- `plaid-exchange-public-token` — exchanges the public token, stores the Item in
  `plaid_items` (service-role only), maps accounts, and runs the first sync.
- `plaid-sync-transactions` — incremental cursor-based `/transactions/sync`.

> **Requires a custom dev build.** The native Plaid Link module does not run in
> Expo Go. The repo is prebuilt for iOS (`expo prebuild`); run with
> `npx expo run:ios` (not `npm run ios`). `ios/` and `android/` are gitignored —
> regenerate with `npx expo prebuild` if needed.

**One-time backend setup** (your Plaid secret stays in your own terminal — never
paste it into the app, `.env`, or a chat):

```bash
# 1. Apply the Plaid migration. Either run supabase/migrations/0004_plaid.sql in
#    the SQL editor (consistent with how 0001–0003 were applied), or `db push`.

# 2. Set Plaid secrets on the project (server-side only).
supabase login                         # opens browser for a personal access token
supabase link --project-ref <your-ref> # ref is in the project's dashboard URL
supabase secrets set PLAID_CLIENT_ID=... PLAID_SECRET=... PLAID_ENV=sandbox
# optional, for Android OAuth institutions:
supabase secrets set PLAID_ANDROID_PACKAGE_NAME=co.dough.app

# 3. Deploy the functions.
supabase functions deploy plaid-create-link-token
supabase functions deploy plaid-exchange-public-token
supabase functions deploy plaid-sync-transactions
```

`PLAID_ENV` is `sandbox` for test data, `production` for real banks. `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected into deployed
functions automatically by Supabase — no need to set them.

**Sandbox testing:** pick a **non-OAuth** institution in Link (e.g. "First
Platypus Bank") and log in with `user_good` / `pass_good`. OAuth institutions
require a `redirect_uri` that is registered in the Plaid dashboard **and** backed
by an iOS Universal Link (associated-domains entitlement + a hosted
`apple-app-site-association` file). When you have that, set
`supabase secrets set PLAID_REDIRECT_URI=https://yourdomain/plaid-oauth`; until
then, leave it unset and use non-OAuth banks.

### 7. (Optional) Data export / account deletion functions

The Data & account screen calls the `data-export` and `account-delete` Supabase
Edge Functions (both **deployed**). They're independent of Plaid; redeploy with:

```bash
supabase functions deploy data-export
supabase functions deploy account-delete
```

`account-delete` uses the service-role key to delete the authenticated Supabase
user. You don't set it: Supabase **injects `SUPABASE_SERVICE_ROLE_KEY` into
deployed functions automatically** (reserved `SUPABASE_*` secrets can't be set
manually). Never expose that key through `EXPO_PUBLIC_*` variables or the app
bundle.

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
