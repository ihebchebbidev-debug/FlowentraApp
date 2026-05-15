import { useWidgetData } from '../../hooks/useWidgetData';
import type { DashboardWidget } from '../../types';
import { WidgetSkeleton } from './WidgetSkeleton';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { WidgetBackground } from './WidgetBackground';

interface Props { widget: DashboardWidget; }

const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-2.5 min-w-[100px]">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
          <span className="text-xs font-medium text-foreground">{payload[0].name}</span>
        </div>
        <p className="text-sm font-bold text-foreground">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function WidgetDonut({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const { chartData, isLoading } = useWidgetData(widget.dataSource, widget.metric, widget.config?.externalApi);
  const cfg = widget.config || {};

  if (isLoading) return <WidgetSkeleton type="donut" />;
  if (!chartData.length) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{t('dashboardBuilder.noData')}</div>;
  }

  const total = chartData.reduce((s, d) => s + d.value, 0);
  const colors = cfg.color ? chartData.map(() => cfg.color!) : COLORS;
  const filteredData = chartData.filter(d => d.value > 0);

  return (
    <WidgetBackground bg={cfg.kpiBg} fallbackColor={cfg.color || 'hsl(var(--chart-1))'} widgetId={widget.id}>
      <div className="h-full w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={filteredData} cx="50%" cy="45%" innerRadius={`${cfg.innerRadius ?? 45}%`} outerRadius="70%"
              paddingAngle={2} dataKey="value" nameKey="name" strokeWidth={0}>
              {filteredData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))' }} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {cfg.showLegend !== false && (
              <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                formatter={(value: string, entry: any) => (
                  <span className="text-xs text-muted-foreground ml-1">{value} ({entry.payload.value})</span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: cfg.showLegend !== false ? '28px' : '0' }}>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{total}</p>
            <p className="text-[10px] text-muted-foreground">{t('dashboardBuilder.total')}</p>
          </div>
        </div>
      </div>
    </WidgetBackground>
  );
}
