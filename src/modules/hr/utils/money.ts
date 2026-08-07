export function formatTnd(amount: number | null | undefined, locale: string = 'fr-TN', fractionDigits = 3): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return '—';
  try {
    // Prefer a Tunisia locale currency format, but keep a stable "TND" suffix.
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
    return `${formatted} TND`;
  } catch {
    return `${amount.toFixed(fractionDigits)} TND`;
  }
}

