import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GenericKanbanBoard, type KanbanItem } from '@/shared/components/kanban';
import { useKanbanColumns } from '@/shared/components/kanban/useKanbanColumns';

interface DisplayDispatch {
  id: string;
  serviceOrderId: string;
  serviceOrderTitle?: string;
  dispatchNumber: string;
  assignedTechnicians: string[];
  status: string;
  priority: string;
  scheduledDate?: Date;
  scheduledStartTime?: string;
  contactName?: string;
  siteAddress?: string;
}

interface DispatchesKanbanViewProps {
  dispatches: DisplayDispatch[];
  onDispatchClick: (id: string) => void;
  onStatusChange?: (dispatchId: string, newStatus: string) => void;
}

export function DispatchesKanbanView({ dispatches, onDispatchClick, onStatusChange }: DispatchesKanbanViewProps) {
  const { t } = useTranslation();

  const translateStatus = useCallback((key: string, fallback: string) => {
    return t(key, { defaultValue: fallback });
  }, [t]);

  const columns = useKanbanColumns('dispatch', translateStatus);

  const items: KanbanItem[] = useMemo(() => {
    return dispatches.map((d): KanbanItem => ({
      id: d.id,
      title: d.dispatchNumber,
      subtitle: d.serviceOrderTitle || `SO-${d.serviceOrderId}`,
      status: d.status,
      contactName: d.contactName || d.assignedTechnicians?.[0],
      priority: d.priority,
      date: d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString() : undefined,
      dateLabel: t('dispatcher.scheduled_date', { defaultValue: 'Scheduled' }),
      badges: d.assignedTechnicians?.length > 0
        ? [{ label: d.assignedTechnicians[0], variant: 'secondary' as const }]
        : undefined,
    }));
  }, [dispatches, t]);

  const handleItemClick = useCallback((itemId: string) => {
    onDispatchClick(itemId);
  }, [onDispatchClick]);

  return (
    <GenericKanbanBoard
      items={items}
      columns={columns}
      onItemClick={handleItemClick}
      onStatusChange={onStatusChange}
      emptyLabel={t('dispatcher.no_dispatches', 'No dispatches')}
    />
  );
}
