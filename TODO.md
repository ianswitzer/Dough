# TODO

Living checklist. Update after every work session (per CLAUDE.md).

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

## Next (to make it fully usable end-to-end)

- [x] Verify against a live Supabase project (migrations run, sign up, RLS +
      seed trigger fire, tapped through screens on a simulator/device).
- [ ] Add `react-native-web` deps if web target is desired (typecheck is clean
      but web export needs them).
- [x] Pull-to-refresh on all five tabs; Transactions/Settings also refetch on
      focus so created/edited items appear on return.
- [x] Account create UI (Settings → Add account → form). Edit/deactivate still
      TODO.
- [x] Add Transaction UI (Transactions → + → form: merchant, amount, type,
      account, category).
- [x] Notes editing in Transaction detail (inline TextInput, persists on save).
- [x] Tags editing in Transaction detail (tag picker, persists via setTags).
- [x] Client intelligence generator: refreshes monthly insights, review inbox
      items, recurring candidates, and recurring transaction flags from live
      transactions when Today/Insights/Review/Recurring load.
- [x] Profile edit UI (Settings → profile card → display-name form).
- [x] Account edit / deactivate UI.
- [x] Category-centric budget editing (Plan → category → edit name + monthly
      budget; Plan `+` creates a new category).
- [x] Categories / Tags / Rules settings screens with basic edit flows.
- [x] Category detail transaction rows open transaction detail.
- [x] Rules edit UI uses human labels and editable category/hidden outcomes.
- [x] Saved views edit UI (rename + filter JSON editing).
- [x] Plaid connection starter screen documenting the required Link-token /
      public-token backend boundary.
- [x] Plaid full Link flow: `plaid_items` table (service-role only),
      `plaid-exchange-public-token` now persists the Item + maps accounts + runs
      the first sync, `plaid-sync-transactions` for incremental cursor sync,
      `PlaidRepository` interface + impl, and a working PlaidConnectScreen.
      Added `react-native-plaid-link-sdk` + prebuilt iOS (needs a dev build, not
      Expo Go). **Still needs:** run `0004_plaid.sql`, set `PLAID_*` secrets, and
      deploy the three functions (README §6), then verify end-to-end on device.
- [ ] Plaid OAuth support (REQUIRED for production — most major banks use OAuth):
      register a `redirect_uri` in the Plaid dashboard, host an
      `apple-app-site-association` file on that domain, add the associated-domains
      entitlement / Universal Link to the iOS app, and set `PLAID_REDIRECT_URI`
      (function support already wired). Sandbox/non-OAuth banks work without it.
- [x] Data export + account deletion UI and Edge Functions (deployed).
- [ ] Optimistic cache so edits reflect instantly without a refetch round-trip.

## Backlog (post-MVP / stretch, per spec §5)

- [ ] CSV import flow + `ImportJob` processing.
- [x] Merchant rule creation from corrections (§14) — the detail screen's
      "apply to future" toggle now creates a `merchant_rules` row and
      re-categorizes other un-reviewed charges from the same merchant.
- [ ] Bulk edit on the transaction feed.
- [~] Custom saved-view builder (basic saved-view rename/filter JSON editing is
      wired; polished builder controls still TODO).
- [ ] Notifications: weekly pulse, bill increase, unusual charge.
- [x] Data export + account deletion (§16 acceptance criteria) — UI + functions deployed.
- [~] Stretch: bank sync (Plaid) — built (see above), pending deploy + verify.
      Household sharing, settle-up, before-you-buy, budget autopilot, receipts
      still backlog.

## ⚑ Handoff notes (read first — written 2026-05-25)

Status snapshot for the next agent. The client is feature-built, `tsc`/
`expo-doctor` are clean, and the app has been run against a live Supabase
project on a simulator/device. **Plaid bank sync is the main unverified piece**:
the code + iOS dev build are in place, but the three `plaid-*` Edge Functions
still need to be deployed with `PLAID_*` secrets and exercised end-to-end (see
README §6). Everything Plaid needs a custom dev build (`npx expo run:ios`), not
Expo Go.

### Looks done but is NOT wired (don't be fooled by the UI)
- **Insight/review/recurring generation is now wired as a client refresh job,**
  not as a background Edge Function. `repos.intelligence.generate()` calls
  `computeCategoryDrift` and `detectRecurring`, refreshes current-month
  `insights`, creates open `review_items`, upserts candidate
  `recurring_transactions`, and marks matching transactions as recurring
  candidates before Today/Insights/Review/Recurring read. This still needs
  live Supabase/device verification and may later move server-side for
  scheduled/background generation.
- **Settings rows are mostly static.** Categories, Tags, Rules, the recurring/
  notification toggles, and Buffer/Period/Confidence don't navigate or persist.
  Categories/Tags/Rules now have basic edit screens; the toggles still render
  fixed state.
- **Header search + Insights "filter"** are decorative; no search/filter
  behavior yet. Saved views can be renamed and edited as filter JSON, but the
  friendly builder UI is still TODO.
- **Transaction detail "Account" and "Track as recurring / Split" affordances**
  from the design were not carried over; account is fixed at create time.
- **Plaid is scaffolded, not fully integrated.** The app has a Plaid starter
  screen and Supabase Edge Function stubs for creating Link tokens and
  exchanging public tokens, but no client SDK/Link launch, encrypted token
  persistence, account mapping, or transaction sync yet. Keep Plaid secrets
  server-side only.

### Gotchas / constraints
- **Stuck on SDK 54 for Expo Go**, not the npm-latest 56 — see CLAUDE.md for
  why. Don't bump `expo` without a matching Expo Go release; always
  `npx expo install --fix` after.
- `react` is pinned to 19.2.6 via `expo.install.exclude` (react-dom peer). Don't
  "fix" it.
- Incremental `npm install` after dep edits sometimes ERESOLVE-fails on a stale
  tree; a clean `rm -rf node_modules package-lock.json && npm install` resolves.
- Auth: Supabase email confirmation must be OFF for sign-up to yield a session
  locally (README). RLS is the only access control — preserve it on any new
  table/policy.
- Money is integer cents everywhere; expenses positive, income negative.

### Suggested next order of work
1. Deploy + verify the three `plaid-*` Edge Functions end-to-end (link a sandbox
   bank, confirm accounts + transactions land); see README §6.
2. CSV import (`ImportJob`) — unlocks "create account + import CSV".
3. Move intelligence generation to a scheduled/server-side job if client
   refresh proves too slow or too easy to race in real use.

## Acceptance criteria to verify before "MVP done" (spec §19)

- [~] Create account (done, manual) + import a CSV (CSV not built).
- [~] Transactions appear in a feed (done); searchable (search not built).
- [~] Categorize / tag / hide / mark reviewed (done); rename merchant (not in UI).
- [x] Create a rule from a correction; applied to future imports.
- [x] Monthly spend by category + total (Plan, computed from live transactions).
- [x] Basic recurring detection (client generator writes candidate rows and
      marks matching transactions; confirming from review marks the series
      confirmed).
- [x] Safe-to-spend amount with confidence label (Today).
- [x] Review items for uncategorized / recurring / unusual / subscription up.
- [x] ≥3 insight types (monthly summary, spending drift, unusual transaction,
      recurring change; rows depend on available transaction history).
- [x] Data export + account deletion (UI + `data-export` / `account-delete` Edge
      Functions deployed 2026-05-25; tap-through verification still nice to have).
