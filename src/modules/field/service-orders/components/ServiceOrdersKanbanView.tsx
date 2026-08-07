import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GenericKanbanBoard, type KanbanItem } from '@/shared/components/kanban';
import { useKanbanColumns } from '@/shared/components/kanban/useKanbanColumns';
import { ServiceOrder } from '../types';

interface ServiceOrdersKanbanViewProps {
  serviceOrders: ServiceOrder[];
  onServiceOrderClick: (so: ServiceOrder) => void;
  onStatusChange?: (soId: string, newStatus: string) => void;
  formatCurrency?: (val: number) => string;
}

export function ServiceOrdersKanbanView({ serviceOrders, onServiceOrderClick, onStatusChange, formatCurrency }: ServiceOrdersKanbanViewProps) {
  const { t } = useTranslation('service_orders');

  const translateStatus = useCallback((key: string, fallback: string) => {
    return t(key, { defaultValue: fallback });
  }, [t]);

  const columns = useKanbanColumns('service_order', translateStatus);

  const items: KanbanItem[] = useMemo(() => {
    return serviceOrders.map((so): KanbanItem => {
      const total = so.financials?.estimatedCost || 0;
      return {
        id: so.id,
        title: so.customer?.company || so.orderNumber,
        subtitle: `#${so.orderNumber}`,
        status: so.status,
        value: total > 0 ? (formatCurrency ? formatCurrency(total) : `${total.toLocaleString()}`) : undefined,
        numericValue: total,
        contactName: so.customer?.contactPerson,
        companyName: so.customer?.company,
        priority: so.priority,
        itemsCount: so.jobs?.length,
        date: so.createdAt ? new Date(so.createdAt).toLocaleDateString() : undefined,
        dateLabel: t('created_date', { defaultValue: 'Created' }),
        badges: so.assignedTechnicians?.length > 0
          ? [{ label: `${so.assignedTechnicians.length} ${t('technicians', { defaultValue: 'techs' })}`, variant: 'secondary' as const }]
          : undefined,
      };
    });
  }, [serviceOrders, formatCurrency, t]);

  const handleItemClick = useCallback((itemId: string) => {
    const so = serviceOrders.find(s => s.id === itemId);
    if (so) onServiceOrderClick(so);
  }, [serviceOrders, onServiceOrderClick]);

  return (
    <GenericKanbanBoard
      items={items}
      columns={columns}
      onItemClick={handleItemClick}
      onStatusChange={onStatusChange}
      formatTotal={formatCurrency}
      emptyLabel={t('no_service_orders', 'No service orders')}
    />
  );
}
