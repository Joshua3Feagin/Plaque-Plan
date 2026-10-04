// Small formatting helpers shared across the UI.

/** Whole-dollar currency, e.g. 1225 -> "$1,225". */
export function money(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

/** Currency with cents when needed, e.g. 76.5 -> "$76.50", 120 -> "$120". */
export function moneyCents(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded)
    ? `$${rounded.toLocaleString('en-US')}`
    : `$${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** First initial for an avatar. */
export function initial(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}

/** Human relation label. */
export function relationLabel(relation: 'self' | 'spouse' | 'child'): string {
  switch (relation) {
    case 'self':
      return 'You';
    case 'spouse':
      return 'Spouse';
    case 'child':
      return 'Child';
  }
}

/** "YYYY-MM" -> "Mon YYYY", e.g. "2025-01" -> "Jan 2025". */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map((s) => parseInt(s, 10));
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
