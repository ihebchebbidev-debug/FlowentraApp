import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useExpenseTypes, useWorkTypes } from '@/modules/lookups/hooks/useLookups';
import { formatSaleItemLabel } from '../utils/saleItemLabel';

/**
 * Translates sale/invoice line labels coming from service orders and dispatches,
 * resolving the type against the tenant's lookup labels when available.
 */
export function useSaleItemLabel() {
  const { i18n } = useTranslation('sales');
  const { items: expenseTypes } = useExpenseTypes();
  const { items: workTypes } = useWorkTypes();

  return useCallback(
    (itemName?: string | null, fallback?: string | null): string =>
      formatSaleItemLabel(itemName, {
        expenseTypes: expenseTypes as any[],
        workTypes: workTypes as any[],
        fallback,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenseTypes, workTypes, i18n.language],
  );
}
