import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr as frLocale, arSA } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ActivityEvent } from '../types';

function localeFor(lang: string) {
  if (lang?.startsWith('fr')) return frLocale;
  if (lang?.startsWith('ar')) return arSA;
  return enUS;
}

export interface ActivityFeedProps {
  events: ActivityEvent[];
  emptyMessage?: string;
  className?: string;
  dense?: boolean;
  highlightIds?: Set<string>;
}

export function ActivityFeed({
  events,
  emptyMessage,
  className,
  highlightIds,
}: ActivityFeedProps) {
  const { t, i18n } = useTranslation('traceability');
  const dateLocale = localeFor(i18n.language);

  if (!events.length) {
    return (
      <Card className={cn('bg-white', className)}>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          {emptyMessage || t('empty')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-white border-border/60', className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white">
              <TableHead className="w-[160px] text-xs font-medium">{t('csv.timestamp')}</TableHead>
              <TableHead className="w-[110px] text-xs font-medium">{t('csv.source')}</TableHead>
              <TableHead className="w-[140px] text-xs font-medium">{t('csv.action')}</TableHead>
              <TableHead className="text-xs font-medium">{t('csv.entity')}</TableHead>
              <TableHead className="text-xs font-medium">{t('csv.message')}</TableHead>
              <TableHead className="w-[160px] text-xs font-medium">{t('csv.user')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((ev) => {
              const performedAt = ev.performedAt ? new Date(ev.performedAt) : null;
              const isNew = highlightIds?.has(ev.id);
              const sourceLabel = t(`source.${ev.source}`, { defaultValue: ev.source });
              const actionKey = ev.action ? `action.${ev.action}` : '';
              const actionLabel = actionKey
                ? t(actionKey, { defaultValue: ev.actionLabel })
                : ev.actionLabel;

              return (
                <TableRow
                  key={ev.id}
                  className={cn(
                    'bg-white hover:bg-muted/20 transition-colors',
                    isNew && 'bg-muted/20',
                  )}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap align-top">
                    {performedAt
                      ? formatDistanceToNow(performedAt, { addSuffix: true, locale: dateLocale })
                      : '—'}
                    {isNew && (
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {sourceLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-foreground/90 align-top whitespace-nowrap">
                    {actionLabel}
                  </TableCell>
                  <TableCell className="align-top">
                    {ev.entityUrl ? (
                      <Link
                        to={ev.entityUrl}
                        className="text-xs font-medium text-foreground hover:underline"
                      >
                        {ev.entityLabel}
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-foreground">{ev.entityLabel}</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="text-xs text-foreground/80 leading-snug">
                      {ev.message || actionLabel}
                    </div>
                    {(ev.oldValue || ev.newValue) && (
                      <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                        {ev.oldValue && (
                          <span className="line-through opacity-70">{ev.oldValue}</span>
                        )}
                        {ev.oldValue && ev.newValue && <span className="mx-1.5">→</span>}
                        {ev.newValue && <span>{ev.newValue}</span>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground align-top">
                    <span className="truncate block max-w-[160px]">{ev.actor.name}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

// Retained for compat with prior imports; no longer used for coloring.
export const SOURCE_ICON = {} as Record<string, unknown>;
