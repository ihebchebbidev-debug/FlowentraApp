/**
 * Format a numeric value for display in stats cards.
 * Returns 0 (not '-') for zero values so empty states render as "0",
 * which matches the compliance dashboard and avoids confusing dashes.
 */
export function formatStatValue(value: number | string | null | undefined): string | number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return 0;
  }
  return value;
}

/**
 * Format currency value. Returns "0 <currency>" for zero/empty so KPI
 * tiles read correctly when there is no spend yet.
 */
export function formatCurrencyValue(value: number | null | undefined, currency = 'TND'): string {
  const v = value ?? 0;
  return `${v.toLocaleString()} ${currency}`;
}
