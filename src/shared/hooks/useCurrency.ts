import { useMemo } from 'react';
import { useLookups } from '@/shared/contexts/LookupsContext';

export function useCurrency() {
  const { currencies } = useLookups();

  const current = useMemo(() => {
    const cur = currencies.find(c => c.isDefault);
    return cur ? { code: cur.description || 'TND', name: cur.name } : { code: 'TND', name: 'Tunisian Dinar' };
  }, [currencies]);

  const format = (amount?: number) => {
    if (amount === undefined || amount === null) return '';
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
