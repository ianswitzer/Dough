// Recurring detection (spec §13.4). Groups transactions by normalized merchant
// + similar amount, looks for a repeating interval, and proposes a candidate
// cadence. Candidates require user confirmation before counting toward
// safe-to-spend as high confidence (spec §13.4). Pure + backend-agnostic.

import type { Transaction } from '../data/types';

export type RecurringCandidate = {
  merchant: string;
  cadence: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | 'irregular';
  expectedAmountCents: number;
  amountVarianceCents: number;
  nextExpectedDate: string;
  occurrences: number;
  categoryId: string | null;
};

const DAY = 86400000;
const days = (a: string, b: string) =>
  Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / DAY);

// Map a median gap (in days) to the nearest known cadence, within tolerance.
function classifyCadence(gap: number): RecurringCandidate['cadence'] {
  const buckets: [number, RecurringCandidate['cadence']][] = [
    [7, 'weekly'],
    [14, 'biweekly'],
    [30, 'monthly'],
    [91, 'quarterly'],
    [365, 'annual'],
  ];
  for (const [d, name] of buckets) {
    if (Math.abs(gap - d) <= d * 0.2) return name;
  }
  return 'irregular';
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export function detectRecurring(transactions: Transaction[]): RecurringCandidate[] {
  // Group by merchant name (already normalized to display name).
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.amountCents === 0) continue;
    const key = t.merchant.toLowerCase().trim();
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(t);
  }

  const candidates: RecurringCandidate[] = [];
  for (const [, txs] of groups) {
    if (txs.length < 3) continue; // need a few hits to call it a pattern
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) gaps.push(days(sorted[i - 1].date, sorted[i].date));
    const gap = median(gaps);
    const cadence = classifyCadence(gap);
    if (cadence === 'irregular') continue;

    const amounts = sorted.map((t) => t.amountCents);
    const expected = Math.round(median(amounts));
    const variance = Math.max(...amounts.map((a) => Math.abs(a - expected)));
    const last = sorted[sorted.length - 1];
    const nextExpectedDate = new Date(new Date(last.date + 'T12:00:00').getTime() + gap * DAY)
      .toISOString()
      .slice(0, 10);

    candidates.push({
      merchant: last.merchant,
      cadence,
      expectedAmountCents: expected,
      amountVarianceCents: variance,
      nextExpectedDate,
      occurrences: sorted.length,
      categoryId: last.categoryId,
    });
  }
  return candidates.sort((a, b) => b.occurrences - a.occurrences);
}
