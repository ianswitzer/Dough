// Spending-drift detection (spec §13.2). Compares current month-to-date spend
// per category against a same-day-of-month baseline (prior complete months).
// Only surfaces a drift that is BOTH materially large and proportionally
// meaningful, and labels low confidence when data is thin — so we explain
// deltas without crying wolf (spec principle: "give me confidence, not guilt").

import type { Confidence, Direction } from '../data/types';

export type DriftThresholds = {
  minAbsCents: number; // default $50
  minPct: number; // default 0.25
};

export const DEFAULT_THRESHOLDS: DriftThresholds = { minAbsCents: 5000, minPct: 0.25 };

export type CategoryDrift = {
  slug: string;
  currentCents: number;
  baselineCents: number;
  deltaCents: number;
  direction: Direction;
  confidence: Confidence;
  /** True when the drift clears thresholds and is worth surfacing. */
  material: boolean;
};

export function computeCategoryDrift(
  currentByCat: Record<string, number>,
  baselineByCat: Record<string, number>,
  monthsOfData: number,
  thresholds: DriftThresholds = DEFAULT_THRESHOLDS,
): CategoryDrift[] {
  const slugs = new Set([...Object.keys(currentByCat), ...Object.keys(baselineByCat)]);
  const out: CategoryDrift[] = [];
  for (const slug of slugs) {
    const current = currentByCat[slug] ?? 0;
    const baseline = baselineByCat[slug] ?? 0;
    const delta = current - baseline;
    const pct = baseline > 0 ? Math.abs(delta) / baseline : current > 0 ? 1 : 0;
    const direction: Direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    // < 2 months of history → spec says low confidence or suppress.
    const confidence: Confidence = monthsOfData >= 3 ? 'high' : monthsOfData >= 2 ? 'medium' : 'low';
    const material =
      confidence !== 'low' &&
      Math.abs(delta) >= thresholds.minAbsCents &&
      pct >= thresholds.minPct;
    out.push({ slug, currentCents: current, baselineCents: baseline, deltaCents: delta, direction, confidence, material });
  }
  return out.sort((a, b) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents));
}
