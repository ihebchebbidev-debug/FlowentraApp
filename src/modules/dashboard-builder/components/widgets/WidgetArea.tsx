import { useWidgetData } from '../../hooks/useWidgetData';
import type { DashboardWidget } from '../../types';
import { WidgetSkeleton } from './WidgetSkeleton';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { WidgetBackground } from './WidgetBackground';

interface Props { widget: DashboardWidget; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-2.5 min-w-[100px]">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <span className="text-sm font-bold text-foreground">{payload[0].value}</span>
      </div>
    );
  }
  return null;
};

export function WidgetArea({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const { chartData, isLoading } = useWidgetData(widget.dataSource, widget.metric, widget.config?.externalApi);
  const cfg = widget.config || {};

  if (isLoading) return <WidgetSkeleton type="area" />;
  if (!chartData.length) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{t('dashboardBuilder.noData')}</div>;
  }

  const color = cfg.color || 'hsl(var(--chart-1))';
  const gradientId = `area-g-${widget.id}`;

  return (
    <WidgetBackground bg={cfg.kpiBg} fallbackColor={color} widgetId={widget.id}>
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -16, bottom: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            {cfg.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />}
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={6} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} width={32} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`}
              dot={{ r: 3, fill: color, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WidgetBackground>
  );
}
