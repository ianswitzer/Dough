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
- [ ] Pull-to-refresh + optimistic cache so edits reflect without a manual
      reload across screens.
- [ ] Account create / edit UI (repo method exists; no screen yet).
- [ ] Tags + Notes editing in Transaction detail (currently read-only rows).

## Backlog (post-MVP / stretch, per spec §5)

- [ ] CSV import flow + `ImportJob` processing.
- [ ] Merchant rule creation from corrections (§14) — wire the detail screen's
      "apply to future" toggle to actually create a `merchant_rules` row.
- [ ] Bulk edit on the transaction feed.
- [ ] Custom saved-view builder.
- [ ] Notifications: weekly pulse, bill increase, unusual charge.
- [ ] Data export + account deletion (§16 acceptance criteria).
- [ ] Stretch: bank sync (Plaid), household sharing, settle-up, before-you-buy,
      budget autopilot, receipts.

## Acceptance criteria to verify before "MVP done" (spec §19)

- [ ] Create account + import a CSV.
- [ ] Transactions appear in a searchable feed.
- [ ] Categorize / tag / hide / rename / mark reviewed.
- [ ] Create a rule from a correction; applied to future imports.
- [ ] Monthly spend by category + total.
- [ ] Basic recurring detection.
- [ ] Safe-to-spend amount with confidence label.
- [ ] Review items for uncategorized / recurring / unusual / subscription up.
- [ ] ≥3 insight types: spending drift, merchant delta, unusual transaction.
- [ ] Data export + account deletion.
