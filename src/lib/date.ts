// Date helpers. Transaction dates are ISO 'YYYY-MM-DD' strings; we anchor to
// local noon to avoid timezone-induced off-by-one days.

const at = (iso: string) => new Date(iso + 'T12:00:00');

export function fmtDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' },
): string {
  return at(iso).toLocaleDateString('en-US', opts);
}

export const fmtDateShort = (iso: string) => fmtDate(iso, { month: 'short', day: 'numeric' });

// "Today" / "Yesterday" / "In 3 days" relative to a reference date (defaults
// to now). Falls back to a short date beyond a week out.
export function fmtRelativeDate(iso: string, today: Date = new Date()): string {
  const d = at(iso);
  const ref = at(today.toISOString().slice(0, 10));
  const diff = Math.round((d.getTime() - ref.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return 'In ' + diff + ' days';
  if (diff < 0 && diff > -7) return -diff + ' days ago';
  return fmtDateShort(iso);
}

export const todayIso = () => new Date().toISOString().slice(0, 10);
