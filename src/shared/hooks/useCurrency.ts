import { useMemo } from 'react';
import { useLookups } from '@/shared/contexts/LookupsContext';
import { usePreferences } from '@/hooks/usePreferences';
import { DEFAULT_CURRENCY_CODE, getCurrencyByCode } from '@/lib/currencies';

/**
 * Global currency hook.
 *
 * Resolution order:
 *   1. Global preferences.currency (set by MainAdminUser, applies to all users)
 *   2. Default currency flagged in the Lookups/Currencies table
 *   3. 'TND' fallback
 */
export function useCurrency() {
  const { currencies } = useLookups();
  const { preferences } = usePreferences();

  const current = useMemo(() => {
    const prefCode = preferences?.currency?.trim();
    if (prefCode) {
      const known = getCurrencyByCode(prefCode);
      return { code: known.code, name: known.name, symbol: known.symbol };
    }
    const lookupDefault = currencies.find(c => c.isDefault);
    if (lookupDefault) {
      const known = getCurrencyByCode(lookupDefault.description || lookupDefault.name);
      return { code: known.code, name: lookupDefault.name || known.name, symbol: known.symbol };
    }
    const fallback = getCurrencyByCode(DEFAULT_CURRENCY_CODE);
    return { code: fallback.code, name: fallback.name, symbol: fallback.symbol };
  }, [currencies, preferences?.currency]);

  const format = (amount?: number) => {
    if (amount === undefined || amount === null) return '';
    // Guard NaN / Infinity — otherwise Intl.NumberFormat would render "NaN"
    // straight into PDFs and totals.
    if (typeof amount !== 'number' || !Number.isFinite(amount)) return '-';
    if (amount === 0) return '-';
    try {
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(amount));
      return `${formatted} ${current.code}`;
    } catch {
      return String(amount);
    }
  };

  return { current, format };
}
