/**
 * Shared display formatters for the Purchases module.
 *
 * The API returns dates as raw ISO strings (`2026-08-07T00:00:00`). Rendering
 * those directly leaked machine timestamps into every list/detail page, so all
 * purchase screens now go through these helpers.
 */

/** Locale-aware short date. Returns `fallback` for empty/invalid values. */
export function formatPurchaseDate(
  value?: string | Date | null,
  fallback = '-',
): string {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : fallback;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/** Locale-aware date + time (used for audit/activity style rows). */
export function formatPurchaseDateTime(
  value?: string | Date | null,
  fallback = '-',
): string {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : fallback;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Human label for a payment-terms code (`net30` → "Net 30 days").
 * Falls back to a de-camelised version of the raw code when unknown.
 */
export function formatPaymentTerms(
  t: (key: any, ...rest: any[]) => any,
  code?: string | null,
  fallback = '-',
): string {
  if (!code) return fallback;
  const label = String(t(`paymentTermsOptions.${code}`, { defaultValue: '' }) || '');
  if (label && label !== `paymentTermsOptions.${code}`) return label;
  return code
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([0-9])/gi, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
