# TODO

Living checklist. Update after every work session (per CLAUDE.md).

## Done

- [x] Initialize git repo (main branch).
- [x] Scaffold Expo + TypeScript project (`package.json`, `app.json`,
      `tsconfig.json`, `babel.config.js`).
- [x] Project docs: `CLAUDE.md`, `README.md`, `docs/DESIGN.md`, this file.
- [x] `.gitignore` + `.env.example` with secret-handling guidance.

## In progress / next

- [ ] Theme system: light + dark color tokens, typography, `ThemeProvider`
      with persisted dark-mode toggle.
- [ ] Supabase migrations: full schema, RLS policies, default category/tag/view
      seed; Supabase client wired to `EXPO_PUBLIC_*` env.
- [ ] Data layer: domain types, repository interfaces, Supabase implementations,
      composition root + React context injection.
- [ ] Domain services: safe-to-spend, spending drift / insights, recurring
      detection (per spec §13).
- [ ] UI primitives: `Card`, `Chip`, `CategoryDot`, `MoneyDisplay`,
      `ProgressBar`, `SectionLabel`, `Header`, `IconButton`, `Toggle`, `Icons`.
- [ ] Auth flow (email/password) + session persistence.
- [ ] Onboarding (3 steps): welcome, import method, payday cadence.
- [ ] Tabs wired to live data: Today, Transactions, Plan, Insights, Settings.
- [ ] Settings → Appearance dark-mode toggle.
- [ ] Overlays: Transaction detail, Category detail, Review inbox, Recurring.

## Backlog (post-MVP / stretch, per spec §5)

- [ ] CSV import flow + `ImportJob` processing.
- [ ] Merchant rule creation from corrections (§14).
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
