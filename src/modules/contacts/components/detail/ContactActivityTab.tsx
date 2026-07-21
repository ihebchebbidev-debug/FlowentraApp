import { useTranslation } from 'react-i18next';
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

function parseMetadata(meta?: string | null): Record<string, any> | null {
  if (!meta) return null;
  try { return JSON.parse(meta); } catch { return null; }
}

function ActivityRow({ activity, t, locale }: { activity: ContactActivityDto; t: (k: string, o?: any) => string; locale: any }) {
  const meta = TYPE_META[activity.type] ?? { icon: CircleDot, color: 'text-muted-foreground bg-muted' };
  const Icon = meta.icon;
  const md = parseMetadata(activity.metadata);
  const label = t(`activity.types.${activity.type}`, { defaultValue: activity.type.replace(/_/g, ' ') });
  const number = md?.number as string | undefined;
  const title = md?.title as string | undefined;
  const status = md?.status as string | undefined;
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
          {number && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{number}</Badge>}
          {status && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">{status}</Badge>}
        </div>
        {(title || activity.description) && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 break-words">
            {title || activity.description}
          </p>
        )}
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
          <span>{when}</span>
          {activity.createdBy && <span>• {activity.createdBy}</span>}
        </div>
      </div>
    </div>
  );
}

export function ContactActivityTab({ contactId }: Props) {
  const { t, i18n } = useTranslation('contacts');
  const { activities, isLoading } = useContactActivity(contactId);
  const locale = i18n.language?.startsWith('fr') ? frLocale : enLocale;

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
              <ActivityRow key={a.id} activity={a} t={t} locale={locale} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
