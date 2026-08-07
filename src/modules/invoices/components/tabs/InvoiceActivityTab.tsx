import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format as formatDate } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, Plus, Pencil, Send, Ban, Trash2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useInvoiceActivities } from '../../hooks/useCustomerInvoices';
import { usersApi } from '@/services/api/usersApi';
import type { InvoiceActivity } from '../../types';

interface Props {
  invoiceId: number;
}

const TYPE_ICON: Record<string, { icon: typeof Plus; className: string }> = {
  created:            { icon: Plus,         className: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40' },
  created_from_sale:  { icon: Plus,         className: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40' },
  updated:            { icon: Pencil,       className: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40' },
  posted:             { icon: Send,         className: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40' },
  voided:             { icon: Ban,          className: 'text-red-600 bg-red-100 dark:bg-red-900/40' },
  deleted:            { icon: Trash2,       className: 'text-red-600 bg-red-100 dark:bg-red-900/40' },
  auto_marked_paid:   { icon: CheckCircle2, className: 'text-green-600 bg-green-100 dark:bg-green-900/40' },
  auto_reopened:      { icon: RefreshCw,    className: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40' },
  manual_marked_paid: { icon: CheckCircle2, className: 'text-green-600 bg-green-100 dark:bg-green-900/40' },
  manual_reopened:    { icon: RefreshCw,    className: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40' },
  auto_post_skipped:  { icon: AlertTriangle, className: 'text-orange-600 bg-orange-100 dark:bg-orange-900/40' },
};

export function InvoiceActivityTab({ invoiceId }: Props) {
  const { t } = useTranslation('invoices');
  const { data: activities, isLoading } = useInvoiceActivities(invoiceId);

  const { data: usersData } = useQuery({
    queryKey: ['users-for-activity'],
    queryFn: () => usersApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const usersById = useMemo(() => {
    const map: Record<string, string> = {};
    (usersData?.users || []).forEach((u: any) => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${u.id}`;
      if (u.id != null) map[String(u.id)] = name;
    });
    return map;
  }, [usersData]);

  const resolveUser = (id: string): string => {
    if (!id || id === 'system' || id === 'anonymous') return t('activity.system');
    return usersById[id] || `User ${id}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        {t('loading')}
      </div>
    );
  }

  const list = activities || [];
  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
        <Activity className="h-8 w-8 opacity-40" />
        <p className="text-sm">{t('activity.empty')}</p>
      </div>
    );
  }

  return (
    <div className="relative pl-4">
      {/* vertical timeline rail */}
      <div className="absolute left-[27px] top-2 bottom-2 w-px bg-border" aria-hidden />
      <div className="space-y-3">
        {list.map((a: InvoiceActivity) => {
          const cfg = TYPE_ICON[a.type] ?? { icon: Activity, className: 'text-muted-foreground bg-muted' };
          const Icon = cfg.icon;
          const label = t(`activity.types.${a.type}`, { defaultValue: a.type });
          return (
            <div key={a.id} className="relative flex items-start gap-3">
              <div className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ring-4 ring-background ${cfg.className}`}>
                <Icon className="h-4 w-4" />
              </div>
              <Card className="flex-1 shadow-card border-0 hover:shadow-md transition-shadow">
                <CardContent className="py-3 px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-medium">{label}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(new Date(a.createdAt), 'PPpp')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {t('activity.by')} {resolveUser(a.createdBy)}
                    </span>
                  </div>
                  {a.description && (
                    <p className="text-sm mt-1.5 text-foreground whitespace-pre-wrap">{a.description}</p>
                  )}
                  {(a.oldValue || a.newValue) && a.type !== 'created' && a.type !== 'created_from_sale' && (
                    <div className="text-xs text-muted-foreground mt-1.5">
                      {a.oldValue && <span>{t('activity.from')} <code className="px-1 rounded bg-muted">{a.oldValue}</code></span>}
                      {a.oldValue && a.newValue && ' → '}
                      {a.newValue && <span>{t('activity.to')} <code className="px-1 rounded bg-muted">{a.newValue}</code></span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InvoiceActivityTab;
