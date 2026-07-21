import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  FileText,
  ShoppingCart,
  ClipboardList,
  Truck,
  Wrench,
  StickyNote,
  Pencil,
  Trash2,
  CircleDot,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { useContactActivity, ContactActivityDto } from '../../hooks/useContactActivity';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr as frLocale, enUS as enLocale } from 'date-fns/locale';

interface Props {
  contactId: number;
}

const TYPE_META: Record<string, { icon: LucideIcon; color: string }> = {
  offer_created:              { icon: FileText,      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  offer_status_changed:       { icon: FileText,      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  sale_created:               { icon: ShoppingCart,  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  sale_status_changed:        { icon: ShoppingCart,  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  service_order_created:      { icon: ClipboardList, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  service_order_status_changed:{ icon: ClipboardList, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  dispatch_created:           { icon: Truck,         color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  dispatch_status_changed:    { icon: Truck,         color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  installation_created:       { icon: Wrench,        color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
  installation_completed:     { icon: Wrench,        color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
  note_added:                 { icon: StickyNote,    color: 'text-slate-600 bg-slate-100 dark:bg-slate-800/60' },
  note_updated:               { icon: Pencil,        color: 'text-slate-600 bg-slate-100 dark:bg-slate-800/60' },
  note_deleted:               { icon: Trash2,        color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
};

// Map a ContactActivity RelatedEntityType to the app route that shows the entity.
function pathFor(entityType?: string | null, entityId?: number | null): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case 'Offer':        return `/dashboard/offers/${entityId}`;
    case 'Sale':         return `/dashboard/sales/${entityId}`;
    case 'ServiceOrder': return `/dashboard/field/service-orders/${entityId}`;
    case 'Dispatch':     return `/dashboard/field/dispatches/${entityId}`;
    case 'Installation': return `/dashboard/field/installations/${entityId}`;
    default:             return null;
  }
}

function parseMetadata(meta?: string | null): Record<string, any> | null {
  if (!meta) return null;
  try { return JSON.parse(meta); } catch { return null; }
}

// Prefer a localized status label when the app has one; fall back to the raw token.
function useStatusLabel() {
  const { t } = useTranslation();
  return (status?: string | null) => {
    if (!status) return '';
    // Try a few known translation namespaces; fall back to the raw value.
    const candidates = [
      `offers:status.${status}`,
      `sales:status.${status}`,
      `field:serviceOrders.status.${status}`,
      `field:dispatches.status.${status}`,
      `field:installations.status.${status}`,
    ];
    for (const key of candidates) {
      const v = t(key, { defaultValue: '' });
      if (v && v !== key) return v;
    }
    return status.replace(/_/g, ' ');
  };
}

function ActivityRow({
  activity,
  t,
  locale,
  onOpenEntity,
  statusLabel,
}: {
  activity: ContactActivityDto;
  t: (k: string, o?: any) => string;
  locale: any;
  onOpenEntity: (path: string) => void;
  statusLabel: (s?: string | null) => string;
}) {
  const meta = TYPE_META[activity.type] ?? { icon: CircleDot, color: 'text-muted-foreground bg-muted' };
  const Icon = meta.icon;
  const md = parseMetadata(activity.metadata);
  const label = t(`activity.types.${activity.type}`, { defaultValue: activity.type.replace(/_/g, ' ') });
  const number = md?.number as string | undefined;
  const title = md?.title as string | undefined;
  const oldStatus = (md?.oldStatus as string | undefined) ?? undefined;
  const newStatus = (md?.status as string | undefined) ?? undefined;
  const isStatusChange = activity.type.endsWith('_status_changed');
  const path = pathFor(activity.relatedEntityType, activity.relatedEntityId ?? undefined);

  const when = (() => {
    try {
      return formatDistanceToNow(parseISO(activity.createdAt), { addSuffix: true, locale });
    } catch {
      return activity.createdAt;
    }
  })();

  return (
    <div className="flex gap-3 py-3">
      <div className={`shrink-0 rounded-full p-2 h-9 w-9 flex items-center justify-center ${meta.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{label}</span>
          {number && (
            path ? (
              <button
                type="button"
                onClick={() => onOpenEntity(path)}
                className="text-[11px] px-1.5 py-0.5 rounded border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:underline transition font-mono"
                title={t('activity.view', 'View')}
              >
                {number}
              </button>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">{number}</Badge>
            )
          )}
          {isStatusChange && (oldStatus || newStatus) && (
            <span className="inline-flex items-center gap-1 text-[11px]">
              {oldStatus && (
                <Badge variant="outline" className="px-1.5 py-0 capitalize text-muted-foreground">
                  {statusLabel(oldStatus)}
                </Badge>
              )}
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              {newStatus && (
                <Badge variant="secondary" className="px-1.5 py-0 capitalize">
                  {statusLabel(newStatus)}
                </Badge>
              )}
            </span>
          )}
          {!isStatusChange && newStatus && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
              {statusLabel(newStatus)}
            </Badge>
          )}
        </div>
        {isStatusChange && (oldStatus || newStatus) && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('activity.statusChangeDetail', {
              defaultValue: 'Status changed from {{from}} to {{to}}',
              from: statusLabel(oldStatus) || '—',
              to: statusLabel(newStatus) || '—',
            })}
          </p>
        )}
        {!isStatusChange && (title || activity.description) && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 break-words">
            {title || activity.description}
          </p>
        )}
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
          <span>{when}</span>
          {activity.createdBy && <span>• {activity.createdBy}</span>}
          {path && (
            <button
              type="button"
              onClick={() => onOpenEntity(path)}
              className="text-primary hover:underline"
            >
              {t('activity.view', 'View')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContactActivityTab({ contactId }: Props) {
  const { t, i18n } = useTranslation('contacts');
  const navigate = useNavigate();
  const { activities, isLoading } = useContactActivity(contactId);
  const locale = i18n.language?.startsWith('fr') ? frLocale : enLocale;
  const statusLabel = useStatusLabel();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">{t('activity.title', 'Activity')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('activity.empty', 'No activity yet')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {activities.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                t={t}
                locale={locale}
                onOpenEntity={(p) => navigate(p)}
                statusLabel={statusLabel}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
