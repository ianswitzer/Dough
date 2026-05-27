# TODO

Living checklist. Update after every work session (per CLAUDE.md). Project
constraints and gotchas live in [CLAUDE.md](CLAUDE.md), not here.

## Done

- [x] Initialize git repo (main branch).
- [x] Scaffold Expo + TypeScript project (`package.json`, `app.json`,
      `tsconfig.json`, `babel.config.js`); deps installed, `tsc --noEmit` clean.
- [x] Project docs: `CLAUDE.md`, `README.md`, `docs/DESIGN.md`, this file.
- [x] `.gitignore` + `.env.example` with secret-handling guidance.
- [x] Theme system: light + dark color tokens, typography, `ThemeProvider`
      with persisted system/light/dark preference.
- [x] Supabase migrations: full schema, RLS on every table, default category/
      tag/saved-view seed via sign-up trigger; client wired to `EXPO_PUBLIC_*`.
- [x] Data layer: domain types, repository interfaces (`contracts.ts`), Supabase
      implementations, `DataProvider` composition root + context injection.
- [x] Domain services: safe-to-spend (§13.1), spending drift (§13.2), recurring
      detection (§13.4) — pure functions.
- [x] UI primitives: Card, Chip, CategoryDot, MoneyDisplay, ProgressBar,
      SectionLabel, Header, IconButton, Toggle, Icons, Txt, PrimaryButton,
      Screen, AsyncBoundary.
- [x] Auth flow (email/password) + session persistence + route guard.
- [x] Onboarding (3 steps): welcome, import method, payday cadence.
- [x] Tabs wired to live data: Today, Transactions, Plan, Insights, Settings.
- [x] Settings → Appearance dark-mode toggle (mirrors to profile).
- [x] Overlays: Transaction detail, Category detail, Review inbox, Recurring.
- [x] Pull-to-refresh on all five tabs; Transactions/Settings refetch on focus.
- [x] Account create / edit / deactivate UI.
- [x] Add Transaction UI (merchant, amount, type, account, category).
- [x] Notes + tags editing in Transaction detail.
- [x] Profile edit UI (display name).
- [x] Category-centric budget editing; Plan `+` creates a category.
- [x] Categories / Tags / Rules settings screens with basic edit flows.
- [x] Category detail rows open transaction detail.
- [x] Rules edit UI (human labels, editable category/hidden outcomes).
- [x] Saved views edit UI (rename + filter JSON editing).
- [x] Merchant rule creation from corrections (§14): "apply to future" creates a
      `merchant_rules` row and re-categorizes other un-reviewed same-merchant charges.
- [x] Client intelligence generator: refreshes monthly insights, review inbox
      items, recurring candidates, and recurring flags from live transactions
      when Today/Insights/Review/Recurring load.
- [x] Safe-to-spend amount with confidence label (Today).
- [x] Monthly spend by category + total (Plan, computed from live transactions).
- [x] Verified against a live Supabase project (migrations, sign up, RLS + seed
      trigger, tapped through screens on a simulator/device).
- [x] Data export + account deletion (UI + `data-export` / `account-delete` Edge
      Functions, deployed).
- [x] Plaid bank sync, full Link flow: `plaid_items` table (service-role only),
      `plaid-exchange-public-token` (persist Item + map accounts + first sync),
      `plaid-sync-transactions` (incremental cursor sync), `PlaidRepository`
      interface + impl, working PlaidConnectScreen, `react-native-plaid-link-sdk`
      + prebuilt iOS. All three Edge Functions deployed with `PLAID_*` secrets.
- [x] Transaction search: header search toggle filters the feed by merchant name
      (`TransactionQuery.search` → `ilike` on clean/raw description), respecting
      the active filter chip.
- [x] Rename merchant from Transaction detail: editable "Name" row writes
      `descriptionClean`, saved alongside the other corrections.
- [x] Insights filter: header filter toggle reveals friendly buckets (Spending,
      Merchants, Unusual, Recurring) that filter the plain-English list by
      insight kind; only buckets with matching insights are offered.

## Remaining

- [ ] Transaction detail: editable account, "track as recurring", and split
      affordances (account is currently fixed at create time).
- [ ] Wire the static Settings controls to persist: recurring + notification
      toggles and the Buffer / Period / Confidence settings.
- [ ] Optimistic cache so edits reflect instantly without a refetch round-trip.
- [ ] Move intelligence generation to a scheduled/server-side job (it currently
      runs as a client refresh and can race in real use).
- [ ] Add `react-native-web` deps if a web target is desired (typecheck is clean
      but web export needs them).
- [ ] Plaid OAuth support (REQUIRED for production — most major banks use OAuth):
      register a `redirect_uri` in the Plaid dashboard, host an
      `apple-app-site-association` file on that domain, add the associated-domains
      entitlement / Universal Link to the iOS app, and set `PLAID_REDIRECT_URI`
      (function support already wired). Sandbox/non-OAuth banks work without it.

## Backlog (post-MVP / stretch, per spec §5)

- [ ] CSV import flow + `ImportJob` processing (unlocks "create account + import CSV").
- [ ] Bulk edit on the transaction feed.
- [ ] Friendly custom saved-view builder (rename + filter-JSON editing exist;
      polished builder controls still TODO).
- [ ] Notifications: weekly pulse, bill increase, unusual charge.
- [ ] Household sharing, settle-up, before-you-buy, budget autopilot, receipts.
