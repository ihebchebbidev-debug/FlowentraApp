import { useTranslation } from 'react-i18next';
import { useWidgetData } from '../../hooks/useWidgetData';
import type { DashboardWidget } from '../../types';
import { WidgetSkeleton } from './WidgetSkeleton';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useMemo } from 'react';
import { WidgetBackground } from './WidgetBackground';

interface Props { widget: DashboardWidget; }

const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2.5 min-w-[120px]">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
            <span className="text-xs text-muted-foreground">{p.dataKey}:</span>
            <span className="text-xs font-bold text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function WidgetStackedBar({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const { chartData, isLoading } = useWidgetData(widget.dataSource, widget.metric, widget.config?.externalApi);
  const cfg = widget.config || {};

  const { data, keys } = useMemo(() => {
    if (!chartData.length) return { data: [], keys: [] };
    const allKeys = chartData.map(d => d.name);
    const stackedData = [{ name: t('dashboardBuilder.total'), ...Object.fromEntries(chartData.map(d => [d.name, d.value])) }];
    return { data: stackedData, keys: allKeys };
  }, [chartData, t]);

  if (isLoading) return <WidgetSkeleton type="stackedBar" />;
  if (!chartData.length) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{t('dashboardBuilder.noData')}</div>;
  }

  return (
    <WidgetBackground bg={cfg.kpiBg} fallbackColor={cfg.color || 'hsl(var(--chart-1))'} widgetId={widget.id}>
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 8 }}>
            {cfg.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />}
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} width={32} />
            <Tooltip content={<CustomTooltip />} />
            {cfg.showLegend !== false && (
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                formatter={(value: string) => <span className="text-xs text-muted-foreground ml-1">{value}</span>}
              />
            )}
            {keys.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="stack" fill={cfg.color || COLORS[i % COLORS.length]}
                radius={i === keys.length - 1 ? [cfg.borderRadius ?? 6, cfg.borderRadius ?? 6, 0, 0] : [0, 0, 0, 0]}
                fillOpacity={1 - (i * 0.12)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetBackground>
  );
}
