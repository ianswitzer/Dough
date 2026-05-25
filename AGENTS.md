# AGENTS.md

Entry point for AI agents (Codex, etc.) working on **Dough**.

👉 **Read [CLAUDE.md](CLAUDE.md) first** — it holds the full working agreements,
architecture map, and the dependency rules. They apply to every agent
regardless of vendor; this file just makes sure you find them.

## The short version (do not violate)

1. **SOLID.** UI/services depend on the repository *interfaces* in
   `src/data/repositories/contracts.ts`, never on `@supabase/supabase-js`
   directly. The Supabase impl is injected once at `DataProvider`.
2. **Small, modular files.** One concern per file; split past ~200 lines.
3. **Keep docs in sync.** Update `README.md` and `TODO.md` after any change.
4. **Commit incrementally**, each commit building/typechecking.
5. **Never commit secrets.** Public repo. Only the `EXPO_PUBLIC_*` anon-key
   pattern via gitignored `.env`; never the `service_role` key.

## Before you build anything

Read the **⚑ Handoff notes** at the top of [TODO.md](TODO.md). They list what
looks finished in the UI but is *not actually wired* (notably: insight /
review / recurring generation), the SDK-54 / dependency-pin constraints, and
the suggested order of work. The app compiles clean but had not been verified
end-to-end on a device at handoff — run it first (README §4–5).

## Verify your work

- `npm run typecheck` (tsc, must stay clean)
- `npx expo-doctor` (should stay green)
- Run it: `npx expo start -c`, open in Expo Go (SDK 54 — see CLAUDE.md).
