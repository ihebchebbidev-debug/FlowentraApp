import { useMemo } from 'react';
import type { KanbanColumnConfig } from './GenericKanbanBoard';
import type { EntityType, StatusDefinition } from '@/config/entity-statuses/types';
import { getEntityStatusConfig } from '@/config/entity-statuses';

/**
 * Chart-based color palette for kanban columns.
 * Cycles through chart-1..chart-5 semantic tokens.
 */
const COLUMN_COLORS: Array<{
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}> = [
  { color: 'hsl(var(--chart-1))', bgColor: 'bg-chart-1/10', borderColor: 'border-chart-1/30', iconColor: 'text-chart-1' },
  { color: 'hsl(var(--chart-2))', bgColor: 'bg-chart-2/10', borderColor: 'border-chart-2/30', iconColor: 'text-chart-2' },
  { color: 'hsl(var(--chart-3))', bgColor: 'bg-chart-3/10', borderColor: 'border-chart-3/30', iconColor: 'text-chart-3' },
  { color: 'hsl(var(--chart-4))', bgColor: 'bg-chart-4/10', borderColor: 'border-chart-4/30', iconColor: 'text-chart-4' },
  { color: 'hsl(var(--chart-5))', bgColor: 'bg-chart-5/10', borderColor: 'border-chart-5/30', iconColor: 'text-chart-5' },
  // Wrap around for entities with >5 statuses
  { color: 'hsl(var(--primary))',  bgColor: 'bg-primary/10',  borderColor: 'border-primary/30',  iconColor: 'text-primary' },
  { color: 'hsl(var(--chart-1))', bgColor: 'bg-chart-1/10', borderColor: 'border-chart-1/30', iconColor: 'text-chart-1' },
  { color: 'hsl(var(--chart-2))', bgColor: 'bg-chart-2/10', borderColor: 'border-chart-2/30', iconColor: 'text-chart-2' },
  { color: 'hsl(var(--chart-3))', bgColor: 'bg-chart-3/10', borderColor: 'border-chart-3/30', iconColor: 'text-chart-3' },
  { color: 'hsl(var(--chart-4))', bgColor: 'bg-chart-4/10', borderColor: 'border-chart-4/30', iconColor: 'text-chart-4' },
  { color: 'hsl(var(--chart-5))', bgColor: 'bg-chart-5/10', borderColor: 'border-chart-5/30', iconColor: 'text-chart-5' },
  { color: 'hsl(var(--primary))',  bgColor: 'bg-primary/10',  borderColor: 'border-primary/30',  iconColor: 'text-primary' },
  { color: 'hsl(var(--chart-1))', bgColor: 'bg-chart-1/10', borderColor: 'border-chart-1/30', iconColor: 'text-chart-1' },
  { color: 'hsl(var(--chart-2))', bgColor: 'bg-chart-2/10', borderColor: 'border-chart-2/30', iconColor: 'text-chart-2' },
];

/**
 * Build KanbanColumnConfig[] from entity-statuses config.
 * @param entityType - The entity type from config
 * @param translateFn - Function to translate status keys: (key: string, fallback: string) => string
 * @param excludeStatuses - Optional array of status IDs to exclude (e.g. terminal negative statuses)
 */
export function useKanbanColumns(
  entityType: EntityType,
  translateFn: (key: string, fallback: string) => string,
  excludeStatuses?: string[]
): KanbanColumnConfig[] {
  return useMemo(() => {
    const config = getEntityStatusConfig(entityType);
    if (!config) return [];

    const filteredStatuses = config.statuses.filter(
      (s) => !excludeStatuses?.includes(s.id)
    );

    return filteredStatuses.map((status, index): KanbanColumnConfig => {
      const palette = COLUMN_COLORS[index % COLUMN_COLORS.length];
      return {
        id: status.id,
        label: translateFn(status.translationKey, status.id),
        ...palette,
      };
    });
  }, [entityType, translateFn, excludeStatuses]);
}
