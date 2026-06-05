import type { SiteTheme } from '../types';

/**
 * Single source of truth for how the store renders money. The currency lives on
 * the site theme (set once in the Theme panel) so every e-commerce block —
 * cart, checkout, mini-cart — shows totals in the same currency.
 */
export function formatStorePrice(
  amount: number,
  theme?: Pick<SiteTheme, 'currency' | 'currencyPosition'> | null,
): string {
  const currency = theme?.currency ?? '$';
  const position = theme?.currencyPosition ?? 'before';
  const value = (Number.isFinite(amount) ? amount : 0).toFixed(2);
  return position === 'after' ? `${value} ${currency}` : `${currency}${value}`;
}

/** The bare currency token (symbol or code), e.g. for labels/placeholders. */
export function storeCurrency(theme?: Pick<SiteTheme, 'currency'> | null): string {
  return theme?.currency ?? '$';
}
