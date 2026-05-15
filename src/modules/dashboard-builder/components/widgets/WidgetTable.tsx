import { useWidgetData } from '../../hooks/useWidgetData';
import type { DashboardWidget } from '../../types';
import { WidgetSkeleton } from './WidgetSkeleton';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { WidgetBackground } from './WidgetBackground';

const DATA_SOURCE_TO_STATUS_NS: Record<string, string> = {
  sales: 'sale',
  offers: 'offer',
  serviceOrders: 'serviceOrder',
  dispatches: 'dispatch',
  tasks: 'task',
  contacts: 'contact',
};

interface Props { widget: DashboardWidget; }

const STATUS_COLORS: Record<string, string> = {
  won: 'bg-emerald-100 text-emerald-700', completed: 'bg-emerald-100 text-emerald-700',
  done: 'bg-emerald-100 text-emerald-700', closed: 'bg-emerald-100 text-emerald-700',
  active: 'bg-blue-100 text-blue-700', open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700', pending: 'bg-amber-100 text-amber-700',
  sent: 'bg-sky-100 text-sky-700', lost: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700', cancelled: 'bg-red-100 text-red-700',
};

export function WidgetTable({ widget }: Props) {
  const { t } = useTranslation(['dashboard', 'workflow']);
  const { tableData, isLoading } = useWidgetData(widget.dataSource, widget.metric, widget.config?.externalApi);
  const { format } = useCurrency();
  const cfg = widget.config || {};
  const statusNs = DATA_SOURCE_TO_STATUS_NS[widget.dataSource] || widget.dataSource;

  const translateStatus = (status: string) => {
    const key = `workflow:status.${statusNs}.${status}`;
    const translated = t(key, { defaultValue: '' });
    if (translated && translated !== key) return translated;
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (isLoading) return <WidgetSkeleton type="table" />;
  if (!tableData.length) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{t('dashboardBuilder.noData')}</div>;
  }

  const getStatusClass = (status: string) => {
    const key = status.toLowerCase().replace(/\s+/g, '_');
    return STATUS_COLORS[key] || 'bg-muted text-muted-foreground';
  };

  return (
    <WidgetBackground bg={cfg.kpiBg} fallbackColor={cfg.color || 'hsl(var(--chart-1))'} widgetId={widget.id}>
      <div className="h-full overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-border">
              <th className="text-left p-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboardBuilder.tableHeaders.name')}</th>
              <th className="text-left p-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboardBuilder.tableHeaders.status')}</th>
              <th className="text-right p-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('dashboardBuilder.tableHeaders.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={row.id || i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                <td className="p-2 text-foreground font-medium truncate max-w-[160px]">{row.name}</td>
                <td className="p-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusClass(row.status)}`}>{translateStatus(row.status)}</span>
                </td>
                <td className="p-2 text-right font-semibold text-foreground tabular-nums">{format(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetBackground>
  );
}
