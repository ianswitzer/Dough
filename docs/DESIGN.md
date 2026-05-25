# Design notes (from the Claude Design handoff)

The visual language is **"Dough" — a soft, warm money-pulse app**. These tokens
and screen notes are extracted from the design bundle so the implementation can
stay faithful without keeping the prototype around.

## Aesthetic

Calm, warm, unhurried. Cream/oat "paper" backgrounds, deep warm ink text, a
single warm caramel **accent** with **sage** (positive/calm) and **rose**
(attention) supports. Generous whitespace, rounded cards (radii 18–28),
hairline borders instead of harsh dividers.

## Type

- **Display:** Instrument Serif — safe-to-spend numbers, screen titles, insight
  headlines. (Light italic flourishes on a few words.)
- **UI:** Geist → substituted with **Inter** in RN.
- **Numerics:** Geist Mono → substituted with **Space Mono**. Tabular figures
  for all money amounts.

## Palette (design source is OKLCH; RN uses hex approximations in `src/theme/colors.ts`)

| Token          | Role                                  |
|----------------|---------------------------------------|
| `paper`        | screen background (warm cream)        |
| `paper2`       | sunken/inset background               |
| `surface`      | card background (near-white warm)     |
| `ink`          | primary text (deep warm brown)        |
| `ink2`         | secondary text                        |
| `muted`        | tertiary text / captions              |
| `hairline`     | 0.5px dividers                        |
| `accent`       | caramel accent fill                   |
| `accentInk`    | accent text/icon                      |
| `accentSoft`   | accent tint background (chips)        |
| `sage`/`sageSoft`/`sageInk` | positive, "on pace", income |
| `rose`/`roseSoft`/`roseInk` | attention, unusual, over    |
| `sky`, `plum`  | category tints                        |

A **dark mode** token set mirrors these (deep warm-charcoal paper, lifted
surfaces, softened accents). Toggle lives in Settings → Appearance.

## Components (→ `src/components/ui/`)

`Card`, `Chip` (tinted pill), `CategoryDot` (round category glyph),
`MoneyDisplay` (serif amount w/ dimmed sign + cents), `ProgressBar`,
`SectionLabel` (uppercase caption + optional right action), `Header`
(serif title + subtitle + action), `IconButton`, `Toggle`, line `Icons`.

## Screens (5 tabs + overlays)

- **Today** — safe-to-spend hero card (amount, plain-English explanation,
  confidence + counts chips); two pulse cards (before payday / to review);
  review preview (top 3); insight preview (top 2); upcoming bills.
- **Transactions** — filter chips (All / Needs review / Recurring / Household /
  Hidden), month summary strip, date-grouped feed; rows show category dot,
  merchant, recurring/unusual badges, tags, signed amount.
- **Plan** — monthly budget summary w/ progress + on-pace note; per-category
  budget rows w/ progress; income (payday); buffer picker.
- **Insights** — narrative monthly summary + category bar strip; plain-English
  insight cards (drift / merchant / bill / unusual); saved views list.
- **Settings** — profile; accounts; money (categories, tags, rules, recurring);
  safe-to-spend tuning; notifications; **Appearance (dark mode toggle)**; data
  export/delete; version footer.

### Overlays
- **Transaction detail** — hero (category dot, merchant, amount, date/account);
  unusual callout; editable fields (category picker, tags, date, account,
  notes); "apply to future like this" teach prompt; track-as-recurring / split
  / hide; collapsible raw description.
- **Category detail** — spent vs remaining, progress, pace note, top merchants,
  recent transactions.
- **Review inbox** — review cards w/ one-tap approve / snooze / dismiss; empty
  "All clear" state.
- **Recurring bills** — committed-monthly hero; bills grouped by month.

### Onboarding (3 steps)
1. Welcome — concentric "dough" mark, one-sentence promise.
2. Find your money — CSV (recommended) / connect bank (soon) / manual.
3. Payday cadence — every two weeks / twice a month / monthly / variable.
