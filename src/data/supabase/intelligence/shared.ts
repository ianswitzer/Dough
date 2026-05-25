import type { Transaction } from '../../types';
import { fmtMoneyShort } from '../../../lib/money';
import type { CategoryDrift } from '../../../services/insights';

export const TX_SELECT = '*, categories(slug), transaction_tags(tags(name))';

export const GENERATED_REVIEW_KINDS = [
  'uncategorized_transaction',
  'unusual_charge',
  'subscription_increase',
  'recurring_candidate',
] as const;

export const GENERATED_INSIGHT_KINDS = [
  'monthly_summary',
  'spending_drift',
  'category_delta',
  'unusual_transaction',
  'recurring_change',
] as const;

export type TransactionWithSlug = Transaction & { categorySlug: string | null };

export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const iso = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (date: string, days: number) => {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return iso(d);
};

export const monthStart = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

export const sameDayWindow = (today: Date, offset: number) => {
  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1, 12);
  const endDay = Math.min(today.getDate(), new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate());
  const end = new Date(month.getFullYear(), month.getMonth(), endDay, 12);
  return { start: monthStart(month), end: addDays(iso(end), 1) };
};

export const titleCase = (slug: string) =>
  slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const directionLabel = (direction: CategoryDrift['direction']) =>
  direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'flat';

export const objectKey = (kind: string, type: string, id: string) => `${kind}:${type}:${id}`;
export const transactionKey = (kind: string, tx: Transaction) => objectKey(kind, 'transaction', tx.id);
export const recurringKey = (kind: string, id: string) => objectKey(kind, 'recurring_transaction', id);

export const expenseBySlug = (txs: TransactionWithSlug[]) =>
  txs.reduce<Record<string, number>>((out, tx) => {
    if (tx.amountCents <= 0 || tx.isHiddenFromBudget) return out;
    const slug = tx.categorySlug ?? 'other';
    out[slug] = (out[slug] ?? 0) + tx.amountCents;
    return out;
  }, {});

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
};

export function findUnusualTransactions(
  transactions: TransactionWithSlug[],
  currentStart: string,
): TransactionWithSlug[] {
  const byMerchant = new Map<string, TransactionWithSlug[]>();
  for (const tx of transactions) {
    if (tx.amountCents <= 0 || tx.isHiddenFromBudget) continue;
    const key = tx.merchant.toLowerCase();
    byMerchant.set(key, [...(byMerchant.get(key) ?? []), tx]);
  }

  const unusual: TransactionWithSlug[] = [];
  for (const tx of transactions) {
    if (tx.date < currentStart || tx.amountCents <= 0 || tx.isHiddenFromBudget) continue;
    if (tx.flag === 'unusual') {
      unusual.push(tx);
      continue;
    }
    const history = (byMerchant.get(tx.merchant.toLowerCase()) ?? [])
      .filter((other) => other.date < tx.date)
      .map((other) => other.amountCents);
    if (history.length < 3) continue;
    const usual = median(history);
    if (usual > 0 && tx.amountCents - usual >= 3000 && tx.amountCents >= usual * 1.8) {
      unusual.push(tx);
    }
  }
  return unusual.sort((a, b) => b.amountCents - a.amountCents).slice(0, 5);
}

export function buildMonthlySummary(currentTotal: number, topDrift?: CategoryDrift) {
  if (!topDrift) {
    return {
      title: 'This month so far',
      summary: `You have spent ${fmtMoneyShort(currentTotal)} so far this month. Nothing is far outside your recent pattern yet.`,
    };
  }
  const cat = titleCase(topDrift.slug);
  return {
    title: `${cat} is ${directionLabel(topDrift.direction)}`,
    summary: `${cat} is ${fmtMoneyShort(Math.abs(topDrift.deltaCents))} ${directionLabel(topDrift.direction)} against your usual pace for this point in the month.`,
  };
}
