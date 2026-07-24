import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Edit, Trash2, Users, CalendarDays, Wallet } from 'lucide-react';
import {
  formatPlannedMinutes,
  type PlannedLineEntry,
} from '@/services/plannedEntriesService';

interface Props {
  entry: PlannedLineEntry;
  currency: string;
  expenseTypeLabel?: (v: string) => string;
  jobLabel?: string;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

/**
 * Card renderer for a planned time/expense entry — matches the visual style
 * of "actual" entry cards so both can live inside a single unified list.
 * Distinguished by a prominent "Planned" badge in the header.
 */
export function PlannedEntryCard({
  entry,
  currency,
  expenseTypeLabel,
  jobLabel,
  onEdit,
  onDelete,
  readOnly,
}: Props) {
  const { t } = useTranslation();

  const plannedBadge = (
    <Badge
      variant="outline"
      className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    >
      {t('planning.plannedBadge', 'Planned')}
    </Badge>
  );

  return (
    <div className="border border-dashed border-amber-300/70 dark:border-amber-800/60 rounded-lg p-3 bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {plannedBadge}
          {entry.kind === 'expense' && entry.expenseType && (
            <Badge variant="secondary" className="text-xs">
              {expenseTypeLabel
                ? expenseTypeLabel(entry.expenseType)
                : t(`planning.expenseTypes.${entry.expenseType}`, entry.expenseType)}
            </Badge>
          )}
          {jobLabel && (
            <Badge variant="outline" className="text-[10px]">📋 {jobLabel}</Badge>
          )}
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {entry.kind === 'time' && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Users className="h-3 w-3" /> {t('planning.technicianCount', 'Technicians')}
            </span>
            <div className="font-medium">{entry.technicianCount ?? 1}</div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" /> {t('planning.duration', 'Duration')}
            </span>
            <div className="font-medium">{formatPlannedMinutes(entry.plannedMinutes ?? 0)}</div>
          </div>
          {entry.plannedDate && (
            <div className="col-span-2">
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> {t('planning.plannedDate', 'Planned day')}
              </span>
              <div className="font-medium">
                {format(new Date(entry.plannedDate), 'dd/MM/yyyy')}
              </div>
            </div>
          )}
        </div>
      )}

      {entry.kind === 'expense' && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Wallet className="h-3 w-3" /> {t('planning.amount', 'Amount')}
            </span>
            <div className="font-medium text-primary">
              {(entry.plannedAmount ?? 0).toFixed(2)} {entry.currency ?? currency}
            </div>
          </div>
          {entry.plannedDate && (
            <div>
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> {t('planning.plannedDate', 'Planned day')}
              </span>
              <div className="font-medium">
                {format(new Date(entry.plannedDate), 'dd/MM/yyyy')}
              </div>
            </div>
          )}
        </div>
      )}

      {entry.description && (
        <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
          <p className="text-sm text-muted-foreground">{entry.description}</p>
        </div>
      )}
    </div>
  );
}

export default PlannedEntryCard;
