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

- [ ] Verify against a live Supabase project (run migrations, sign up, confirm
      RLS + seed trigger fire, tap through every screen on a simulator).
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
- [ ] Optimistic cache so edits reflect instantly without a refetch round-trip.
- [ ] Account edit / deactivate UI.

## Backlog (post-MVP / stretch, per spec §5)

- [ ] CSV import flow + `ImportJob` processing.
- [x] Merchant rule creation from corrections (§14) — the detail screen's
      "apply to future" toggle now creates a `merchant_rules` row and
      re-categorizes other un-reviewed charges from the same merchant.
- [ ] Bulk edit on the transaction feed.
- [ ] Custom saved-view builder.
- [ ] Notifications: weekly pulse, bill increase, unusual charge.
- [ ] Data export + account deletion (§16 acceptance criteria).
- [ ] Stretch: bank sync (Plaid), household sharing, settle-up, before-you-buy,
      budget autopilot, receipts.

## ⚑ Handoff notes (read first — written 2026-05-25)

Status snapshot for the next agent. The client is feature-built and `tsc`/
`expo-doctor` are clean, but **the app has not been verified end-to-end against
a live Supabase project on a device** — the human tester was driving that and
hit a usage limit. Assume runtime bugs are still possible; the safest first
move is to run it (see README §4–5) and tap through before building more.

### Looks done but is NOT wired (don't be fooled by the UI)
- **Insights & recurring are read-only from the DB.** `services/insights.ts`
  (`computeCategoryDrift`) and `services/recurringDetection.ts`
  (`detectRecurring`) are written and unit-shaped but have **zero callers** —
  nothing generates `insights`, `review_items`, or `recurring_transactions`
  rows. Today/Insights only show what the seed (or a future generator) put
  there. Wiring a generator (client job or Supabase Edge Function) is the main
  remaining "intelligence loop" work (spec §13, Phase 3). `computeSafeToSpend`
  IS wired (Today).
- **Settings rows are mostly static.** Categories, Tags, Rules, the recurring/
  notification toggles, and Buffer/Period/Confidence don't navigate or persist
  (except Appearance, which works, and Add account, which works). The toggles
  render fixed state.
- **Header search + Insights "filter" + saved-views "Edit"** are decorative;
  no search/filter/saved-view-builder behavior yet.
- **Transaction detail "Account" and "Track as recurring / Split" affordances**
  from the design were not carried over; account is fixed at create time.

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
1. Run + verify against live Supabase; fix any runtime issues found.
2. Insight/review/recurring generator (wires the two dormant services) — biggest
   product gap and covers 3 acceptance criteria at once.
3. Data export + account deletion (last hard acceptance criterion, §16).
4. CSV import (`ImportJob`) — unlocks "create account + import CSV".
5. Make the static Settings rows real (categories/tags/rules screens).

## Acceptance criteria to verify before "MVP done" (spec §19)

- [~] Create account (done, manual) + import a CSV (CSV not built).
- [~] Transactions appear in a feed (done); searchable (search not built).
- [~] Categorize / tag / hide / mark reviewed (done); rename merchant (not in UI).
- [x] Create a rule from a correction; applied to future imports.
- [x] Monthly spend by category + total (Plan, computed from live transactions).
- [ ] Basic recurring detection (algorithm in services/, NOT wired to write rows).
- [x] Safe-to-spend amount with confidence label (Today).
- [ ] Review items for uncategorized / recurring / unusual / subscription up
      (display done; nothing generates them — see Handoff notes).
- [ ] ≥3 insight types (display done; computeCategoryDrift unwired, no generator).
- [ ] Data export + account deletion.
