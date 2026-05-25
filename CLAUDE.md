# CLAUDE.md — Notes for future agent sessions

This file is the working memory for any AI agent (or human) picking up the
**Dough** codebase. Read it before making changes.

## What this is

Dough is a soft, calm personal-finance "money pulse" app. It answers a few
emotionally important questions: *How much can I safely spend? What changed
this month? What needs my attention?* The full product spec lives in
[`docs/budget_app_mvp_spec.docx`](docs/budget_app_mvp_spec.docx) — read it for
data models, screens, and acceptance criteria. The visual design comes from a
Claude Design handoff bundle (warm cream paper, Instrument Serif display, calm
rounded cards). See [`docs/DESIGN.md`](docs/DESIGN.md) for the design tokens and
screen breakdown extracted from that bundle.

- **Platform:** Expo / React Native (TypeScript), iOS-first, Android-compatible.
- **Backend:** Supabase (Postgres + Auth + Row Level Security).
- **Routing:** `expo-router` (file-based, in [`app/`](app/)).

## Working agreements (DO NOT VIOLATE)

1. **SOLID always.** When adding or extending features, conform to SOLID
   principles. In particular, depend on abstractions: screens talk to
   repository *interfaces* (`src/data/repositories/*.ts`), never to the
   Supabase client directly. Swapping the backend should not touch UI code.
2. **Small, modular pieces.** Prefer many small files and small classes/
   functions over large ones. One component or concern per file. If a file is
   growing past ~200 lines, look for a split.
3. **Keep docs in sync.** After working on anything, update `README.md` and
   `TODO.md` to reflect the new state. This is not optional.
4. **Commit incrementally.** Make small, logically-scoped commits as you go —
   never one giant commit at the end. Each commit should build/typecheck.
5. **Never commit secrets.** This repo is public. No `.env`, no Supabase
   `service_role` key, no access tokens, no real user data. Only the
   `EXPO_PUBLIC_*` anon key pattern is allowed, and only via gitignored `.env`.
   See "Secrets" below.

## Architecture map

```
app/                      expo-router routes (thin — delegate to src/features)
  (auth)/                 sign-in / sign-up
  (onboarding)/           3-step first-run flow
  (tabs)/                 Today, Transactions, Plan, Insights, Settings
  _layout.tsx             root providers (theme, auth, fonts)
src/
  theme/                  design tokens (light + dark), typography, ThemeProvider
  components/ui/          presentational primitives (Card, Chip, MoneyDisplay…)
  features/<screen>/      screen-level composition + screen-specific components
  data/
    types.ts              domain types mirroring the spec data model
    repositories/         interface per aggregate + Supabase implementation
    supabase/             client + generated-ish row mappers
  services/               domain logic (safe-to-spend, insights, recurring)
  lib/                    formatters, hooks, small utilities
supabase/
  migrations/             SQL schema + RLS policies + default seed data
```

### Dependency rule
`app/` → `src/features` → `src/components` + `src/services` + `src/data (interfaces)`.
The Supabase implementation is wired once at the composition root
(`src/data/index.ts`) and injected via React context. Services and UI never
import `@supabase/supabase-js` directly.

## Secrets — how to use Supabase keys safely

- Copy `.env.example` → `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`. `.env` is gitignored.
- The **anon key is public by design** and safe in the client bundle; it is
  gated entirely by Row Level Security. That is why our RLS policies (in
  `supabase/migrations/`) are load-bearing security, not a nicety.
- The **`service_role` key bypasses RLS** — it must never appear in this repo
  or in any `EXPO_PUBLIC_*` variable. Use it only in trusted server contexts
  (e.g. Supabase Edge Functions secrets), never in the app.
- To run migrations, use the Supabase CLI with a personal access token kept in
  your shell environment, not in the repo.

## Conventions

- Money is stored and passed around as **integer cents** (`amountCents`), never
  floats. Format only at the display edge via `src/lib/money.ts`.
- Amount sign convention (matches spec recommendation): **expenses positive,
  income negative**, stored as a signed ledger value.
- Colors: the design uses OKLCH. React Native cannot parse `oklch()`, so tokens
  in `src/theme/colors.ts` are pre-converted hex/rgb approximations. Keep the
  light and dark token sets structurally identical.
- Fonts: design specifies Geist (UI) + Instrument Serif (display) + Geist Mono.
  Geist is not reliably on `@expo-google-fonts`, so UI uses **Inter** (closest
  geometric grotesque) and numerics use **Space Mono**. Display stays
  **Instrument Serif**. If Geist webfonts become available, swap in
  `src/theme/typography.ts` only.

## Don't

- Don't add the design-canvas / iOS-frame prototype scaffolding from the
  handoff bundle — that's design tooling, not app code.
- Don't introduce a state-management library for cross-cutting state until
  there's a real need; React context + hooks are sufficient for the MVP.
