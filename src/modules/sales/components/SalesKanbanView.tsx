import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GenericKanbanBoard, type KanbanItem } from '@/shared/components/kanban';
import { useKanbanColumns } from '@/shared/components/kanban/useKanbanColumns';
import { Sale } from '../types';
import { format } from 'date-fns';

// Same calculation as in SalesList table view
const calculateItemsTotal = (sale: Sale): number => {
  let subtotal = 0;
  if (sale.items && sale.items.length > 0) {
    subtotal = sale.items.reduce((total, item) => {
      const itemTotal = item.totalPrice || (item.quantity * item.unitPrice);
      const discount = item.discount || 0;
      const discountAmount = item.discountType === 'percentage'
        ? itemTotal * (discount / 100)
        : discount;
      return total + (itemTotal - discountAmount);
    }, 0);
  } else {
    subtotal = sale.totalAmount || sale.amount || 0;
  }
  // Business rule: Subtotal → Discount → Tax (on afterDiscount) → Fiscal Stamp
  const saleDiscount = sale.discount || 0;
  const saleDiscountAmount = sale.discountType === 'percentage' ? subtotal * (saleDiscount / 100) : saleDiscount;
  const afterDiscount = subtotal - saleDiscountAmount;
  const taxes = sale.taxes || 0;
  const taxAmount = sale.taxType === 'percentage' ? afterDiscount * (taxes / 100) : taxes;
  const fiscalStamp = sale.fiscalStamp || 0;
  return afterDiscount + taxAmount + fiscalStamp;
};

interface SalesKanbanViewProps {
  sales: Sale[];
  onSaleClick: (sale: Sale) => void;
  onStatusChange?: (saleId: string, newStatus: string) => void;
  formatCurrency?: (val: number) => string;
}

export function SalesKanbanView({ sales, onSaleClick, onStatusChange, formatCurrency }: SalesKanbanViewProps) {
  const { t } = useTranslation('sales');

  const translateStatus = useCallback((key: string, fallback: string) => {
    return t(key, { defaultValue: fallback });
  }, [t]);

  const columns = useKanbanColumns('sale', translateStatus);

  const items: KanbanItem[] = useMemo(() => {
    return sales.map((sale): KanbanItem => {
      const total = calculateItemsTotal(sale);
      return {
        id: sale.id,
        title: sale.title,
        subtitle: sale.saleNumber ? `#${sale.saleNumber}` : undefined,
        status: sale.status,
        value: formatCurrency ? formatCurrency(total) : `${total.toLocaleString()}`,
        numericValue: total,
        contactName: sale.contactName,
        companyName: sale.contactCompany,
        priority: sale.priority,
        itemsCount: sale.items?.length,
        currency: sale.currency,
        date: sale.estimatedCloseDate ? format(new Date(sale.estimatedCloseDate), 'dd MMM yyyy') : undefined,
        dateLabel: t('estimatedCloseDate', { defaultValue: 'Est. close' }),
        badges: sale.offerId ? [{ label: `${t('fromOffer', { defaultValue: 'From offer' })}`, variant: 'info' as const }] : undefined,
      };
    });
  }, [sales, formatCurrency, t]);

  const handleItemClick = useCallback((itemId: string) => {
    const sale = sales.find(s => s.id === itemId);
    if (sale) onSaleClick(sale);
  }, [sales, onSaleClick]);

  return (
    <GenericKanbanBoard
      items={items}
      columns={columns}
      onItemClick={handleItemClick}
      onStatusChange={onStatusChange}
      formatTotal={formatCurrency}
      emptyLabel={t('noSalesFound', 'No sales')}
    />
  );
}
