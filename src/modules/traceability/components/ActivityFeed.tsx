import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr as frLocale, arSA } from 'date-fns/locale';
import {
  Activity,
  AlertTriangle,
  Boxes,
  Calendar as CalendarIcon,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  Folder,
  Info,
  LifeBuoy,
  ListTree,
  LogIn,
  Package,
  Plug,
  Receipt,
  Settings as SettingsIcon,
  Shield,
  ShoppingCart,
  Tag,
  Target,
  User,
  Users as UsersIcon,
  Workflow as WorkflowIcon,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ActivityEvent, ActivityLevel, ActivitySource } from '../types';

const SOURCE_ICON: Record<ActivitySource, typeof Activity> = {
  sales: ShoppingCart,
  offers: Tag,
  deals: Target,
  invoices: Receipt,
  purchases: Package,
  service: FileText,
  hr: User,
  contacts: User,
};

const LEVEL_STYLES: Record<
  ActivityLevel,
  { ring: string; dot: string; icon: typeof Info; text: string }
> = {
  info: {
    ring: 'ring-primary/20 bg-primary/10 text-primary',
    dot: 'bg-primary',
    icon: Info,
    text: 'text-primary',
  },
  success: {
    ring: 'ring-emerald-500/20 bg-emerald-500/10 text-emerald-600',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
    text: 'text-emerald-600',
  },
  warning: {
    ring: 'ring-amber-500/20 bg-amber-500/10 text-amber-600',
    dot: 'bg-amber-500',
    icon: AlertTriangle,
    text: 'text-amber-600',
  },
  error: {
    ring: 'ring-destructive/20 bg-destructive/10 text-destructive',
    dot: 'bg-destructive',
    icon: XCircle,
    text: 'text-destructive',
  },
};

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
  dense,
  highlightIds,
}: ActivityFeedProps) {
  const { t, i18n } = useTranslation('traceability');
  const dateLocale = localeFor(i18n.language);

  if (!events.length) {
    return (
      <Card className={className}>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          {emptyMessage || t('empty')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" aria-hidden />
      <ul className={cn('space-y-3', dense && 'space-y-2')}>
        {events.map((ev) => {
          const SourceIcon = SOURCE_ICON[ev.source] ?? Activity;
          const style = LEVEL_STYLES[ev.level];
          const performedAt = ev.performedAt ? new Date(ev.performedAt) : null;
          const isNew = highlightIds?.has(ev.id);
          const sourceLabel = t(`source.${ev.source}`, { defaultValue: ev.source });
          const actionKey = ev.action ? `action.${ev.action}` : '';
          const actionLabel = actionKey
            ? t(actionKey, { defaultValue: ev.actionLabel })
            : ev.actionLabel;

          return (
            <li
              key={ev.id}
              className={cn(
                'relative pl-12 transition-all',
                isNew && 'animate-in fade-in slide-in-from-top-2',
              )}
            >
              <div
                className={cn(
                  'absolute left-0 top-2 flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-background',
                  style.ring,
                )}
                aria-hidden
              >
                <SourceIcon className="h-4 w-4" />
              </div>
              <Card
                className={cn(
                  'border-border/60 shadow-sm hover:shadow-md transition-shadow',
                  isNew && 'ring-2 ring-primary/40 shadow-md',
                )}
              >
                <CardContent className={cn('p-3', !dense && 'md:p-4')}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {sourceLabel}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] font-medium', style.text)}
                        >
                          {actionLabel}
                        </Badge>
                        {ev.entityUrl ? (
                          <Link
                            to={ev.entityUrl}
                            className="text-xs font-medium text-foreground hover:underline truncate"
                          >
                            {ev.entityLabel}
                          </Link>
                        ) : (
                          <span className="text-xs font-medium text-foreground truncate">
                            {ev.entityLabel}
                          </span>
                        )}
                        {isNew && (
                          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-foreground/90 leading-snug">
                        {ev.message || actionLabel}
                      </p>
                      {(ev.oldValue || ev.newValue) && (
                        <div className="mt-1.5 text-[11px] text-muted-foreground font-mono">
                          {ev.oldValue && (
                            <span className="line-through opacity-70">{ev.oldValue}</span>
                          )}
                          {ev.oldValue && ev.newValue && <span className="mx-1.5">→</span>}
                          {ev.newValue && <span>{ev.newValue}</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {performedAt
                          ? formatDistanceToNow(performedAt, {
                              addSuffix: true,
                              locale: dateLocale,
                            })
                          : '—'}
                      </div>
                      <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[140px]">{ev.actor.name}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { SOURCE_ICON };
