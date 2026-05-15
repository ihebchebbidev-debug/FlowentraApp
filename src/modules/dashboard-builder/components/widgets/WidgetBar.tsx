import { useTranslation } from 'react-i18next';
import { useWidgetData } from '../../hooks/useWidgetData';
import type { DashboardWidget } from '../../types';
import { WidgetSkeleton } from './WidgetSkeleton';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import { WidgetBackground } from './WidgetBackground';

interface Props { widget: DashboardWidget; }

const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2.5 min-w-[100px]">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.color || payload[0].fill }} />
          <span className="text-sm font-bold text-foreground">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function WidgetBar({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const { chartData, isLoading } = useWidgetData(widget.dataSource, widget.metric, widget.config?.externalApi);
  const cfg = widget.config || {};

  if (isLoading) return <WidgetSkeleton type="bar" />;
  if (!chartData.length) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{t('dashboardBuilder.noData')}</div>;
  }

  const colors = cfg.color ? chartData.map(() => cfg.color!) : COLORS;

  return (
    <WidgetBackground bg={cfg.kpiBg} fallbackColor={cfg.color || 'hsl(var(--chart-1))'} widgetId={widget.id}>
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 16, right: 8, left: -16, bottom: 8 }}>
            <defs>
              {chartData.map((entry, index) => (
                <linearGradient key={`g-${index}`} id={`wbar-g-${widget.id}-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={entry.color || colors[index % colors.length]} stopOpacity={1} />
                  <stop offset="100%" stopColor={entry.color || colors[index % colors.length]} stopOpacity={0.65} />
                </linearGradient>
              ))}
            </defs>
            {cfg.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />}
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={6} interval={0} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} width={32} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }} />
            <Bar dataKey="value" radius={[cfg.borderRadius ?? 6, cfg.borderRadius ?? 6, 2, 2]} maxBarSize={48}>
              {chartData.map((entry, index) => (
                <Cell key={`c-${index}`} fill={`url(#wbar-g-${widget.id}-${index})`} />
              ))}
              {cfg.showLabels !== false && (
                <LabelList dataKey="value" position="top" fill="hsl(var(--foreground))" fontSize={11} fontWeight={600} offset={6} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetBackground>
  );
}
