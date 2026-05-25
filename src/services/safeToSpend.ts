// Safe-to-spend engine (spec §13.1, flow §12.4). Pure function over domain
// objects so it's trivially testable and backend-agnostic.
//
//   safeToSpend = eligibleCash
//               + expectedIncomeBeforePeriodEnd
//               - upcomingBillsBeforePeriodEnd
//               - budgetReserve            (omitted in MVP → lowers confidence)
//               - userBuffer
//
// MVP omits debt/credit-card payment modeling and savings goals; when inputs
// are sparse we DOWNGRADE the confidence label rather than guess (spec §19.2:
// clearly distinguish confirmed facts from estimates).

import type { Account, BudgetMonth, Confidence, RecurringTransaction } from '../data/types';

export type SafeToSpendInput = {
  accounts: Account[];
  recurring: RecurringTransaction[];
  budgetMonth: BudgetMonth | null;
  today?: Date;
};

export type SafeToSpendResult = {
  safeToSpendCents: number;
  periodEndIso: string;
  upcomingBillsCents: number;
  expectedIncomeCents: number;
  bufferCents: number;
  billsCounted: number;
  daysLeft: number;
  confidence: Confidence;
  /** Plain-English note of which assumptions are soft. */
  explanation: string;
};

const CASH_TYPES = new Set<Account['type']>(['checking', 'savings', 'cash', 'manual']);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

export function computeSafeToSpend(input: SafeToSpendInput): SafeToSpendResult {
  const today = input.today ?? new Date();
  const todayIso = iso(today);

  // Eligible cash = positive balances on cash-like accounts.
  const eligibleCash = input.accounts
    .filter((a) => CASH_TYPES.has(a.type))
    .reduce((s, a) => s + Math.max(0, a.currentBalanceCents ?? 0), 0);

  // Period end = next confirmed income date, else end of this month.
  const incomeDates = input.recurring
    .filter((r) => r.isIncome && r.nextExpectedDate >= todayIso)
    .map((r) => r.nextExpectedDate)
    .sort();
  const periodEndIso = incomeDates[0] ?? iso(monthEnd(today));

  const upcoming = input.recurring.filter(
    (r) => r.nextExpectedDate >= todayIso && r.nextExpectedDate <= periodEndIso,
  );
  const upcomingBillsCents = upcoming
    .filter((r) => !r.isIncome)
    .reduce((s, r) => s + Math.abs(r.expectedAmountCents), 0);
  const expectedIncomeCents = upcoming
    .filter((r) => r.isIncome)
    .reduce((s, r) => s + Math.abs(r.expectedAmountCents), 0);

  const bufferCents = input.budgetMonth?.bufferCents ?? 0;

  const safeToSpendCents =
    eligibleCash + expectedIncomeCents - upcomingBillsCents - bufferCents;

  const daysLeft = Math.max(
    0,
    Math.round((new Date(periodEndIso + 'T12:00:00').getTime() - new Date(todayIso + 'T12:00:00').getTime()) / 86400000),
  );

  // Confidence: high when we have cash balances AND confirmed bills; medium if
  // one is missing; low if we're mostly guessing.
  const hasCash = eligibleCash > 0;
  const hasBills = input.recurring.some((r) => r.status === 'confirmed' && !r.isIncome);
  const confidence: Confidence = hasCash && hasBills ? 'high' : hasCash || hasBills ? 'medium' : 'low';

  const billsCounted = upcoming.filter((r) => !r.isIncome).length;
  const explanation =
    confidence === 'high'
      ? `Through ${periodEndIso}, after bills and a ${fmtBuf(bufferCents)} buffer.`
      : confidence === 'medium'
        ? `Estimate — add account balances and confirm bills to sharpen this.`
        : `Rough estimate. Import transactions and confirm bills for a real number.`;

  return {
    safeToSpendCents,
    periodEndIso,
    upcomingBillsCents,
    expectedIncomeCents,
    bufferCents,
    billsCounted,
    daysLeft,
    confidence,
    explanation,
  };
}

const fmtBuf = (cents: number) => '$' + Math.round(cents / 100);
