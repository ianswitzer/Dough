# 🍞 Dough

A soft, calm **money-pulse** app for people who hate budgeting. Dough answers a
few emotionally important questions instead of drowning you in dashboards:

> How much can I safely spend? What changed this month? What needs my attention?

Built from the [product spec](docs/budget_app_mvp_spec.docx) and a Claude Design
handoff (see [docs/DESIGN.md](docs/DESIGN.md)).

- **App:** Expo / React Native + TypeScript (iOS-first, Android-compatible)
- **Backend:** Supabase (Postgres, Auth, Row Level Security)
- **Routing:** `expo-router`

## Status

Early MVP scaffold. See [TODO.md](TODO.md) for what's done and what's next.

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
