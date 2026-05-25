// Money formatting. All amounts are integer cents. Convention: expenses are
// positive, income negative (signed ledger). Format only at the display edge.

export function fmtMoney(cents: number, opts: { sign?: boolean } = {}): string {
  const dollars = Math.abs(cents) / 100;
  const s = dollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (opts.sign) return (cents >= 0 ? '+' : '−') + '$' + s;
  return (cents < 0 ? '−$' : '$') + s;
}

// Compact form for cards: $1.3k, $420.
export function fmtMoneyShort(cents: number): string {
  const v = Math.abs(cents) / 100;
  const neg = cents < 0 ? '−' : '';
  if (v >= 1000) return neg + '$' + (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return neg + '$' + Math.round(v);
}

// Split into pieces so a MoneyDisplay can dim the sign + cents independently.
export function fmtMoneyParts(cents: number): { sign: string; whole: string; frac: string } {
  const v = Math.abs(cents) / 100;
  const whole = Math.floor(v).toLocaleString('en-US');
  const frac = (v - Math.floor(v)).toFixed(2).slice(2);
  return { sign: cents < 0 ? '−' : '', whole, frac };
}
