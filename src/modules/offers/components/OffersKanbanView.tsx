import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GenericKanbanBoard, type KanbanItem } from '@/shared/components/kanban';
import { useKanbanColumns } from '@/shared/components/kanban/useKanbanColumns';
import { Offer } from '../types';
import { format } from 'date-fns';

// Same calculation as in OffersList table view
const calculateItemsTotal = (offer: Offer): number => {
  let subtotal = 0;
  if (offer.items && offer.items.length > 0) {
    subtotal = offer.items.reduce((total, item) => {
      const itemTotal = item.totalPrice || (item.quantity * item.unitPrice);
      const discount = item.discount || 0;
      const discountAmount = item.discountType === 'percentage'
        ? itemTotal * (discount / 100)
        : discount;
      return total + (itemTotal - discountAmount);
    }, 0);
  } else {
    subtotal = offer.totalAmount || offer.amount || 0;
  }
  // Business rule: Subtotal → Discount → Tax (on afterDiscount) → Fiscal Stamp
  const offerDiscount = offer.discount || 0;
  const offerDiscountAmount = offer.discountType === 'percentage' ? subtotal * (offerDiscount / 100) : offerDiscount;
  const afterDiscount = subtotal - offerDiscountAmount;
  const taxes = offer.taxes || 0;
  const taxAmount = offer.taxType === 'percentage' ? afterDiscount * (taxes / 100) : taxes;
  const fiscalStamp = offer.fiscalStamp || 0;
  return afterDiscount + taxAmount + fiscalStamp;
};

interface OffersKanbanViewProps {
  offers: Offer[];
  onOfferClick: (offer: Offer) => void;
  onStatusChange?: (offerId: string, newStatus: string) => void;
  formatCurrency?: (val: number) => string;
}

export function OffersKanbanView({ offers, onOfferClick, onStatusChange, formatCurrency }: OffersKanbanViewProps) {
  const { t } = useTranslation('offers');

  const translateStatus = useCallback((key: string, fallback: string) => {
    return t(key, { defaultValue: fallback });
  }, [t]);

  const columns = useKanbanColumns('offer', translateStatus);

  const items: KanbanItem[] = useMemo(() => {
    return offers.map((offer): KanbanItem => {
      const total = calculateItemsTotal(offer);
      return {
        id: offer.id,
        title: offer.title,
        subtitle: offer.offerNumber ? `#${offer.offerNumber}` : undefined,
        status: offer.status,
        value: formatCurrency ? formatCurrency(total) : `${total.toLocaleString()}`,
        numericValue: total,
        contactName: offer.contactName,
        companyName: offer.contactCompany,
        priority: undefined,
        category: offer.category ? t(`categories.${offer.category}`, { defaultValue: offer.category }) : undefined,
        itemsCount: offer.items?.length,
        currency: offer.currency,
        date: offer.validUntil ? format(new Date(offer.validUntil), 'dd MMM yyyy') : undefined,
        dateLabel: t('valid_until', { defaultValue: 'Valid until' }),
        email: offer.contactEmail,
      };
    });
  }, [offers, formatCurrency, t]);

  const handleItemClick = useCallback((itemId: string) => {
    const offer = offers.find(o => o.id === itemId);
    if (offer) onOfferClick(offer);
  }, [offers, onOfferClick]);

  return (
    <GenericKanbanBoard
      items={items}
      columns={columns}
      onItemClick={handleItemClick}
      onStatusChange={onStatusChange}
      formatTotal={formatCurrency}
      emptyLabel={t('no_offers_found', 'No offers')}
    />
  );
}
