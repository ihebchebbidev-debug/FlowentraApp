import { useTranslation } from 'react-i18next';
import { useWidgetData } from '../../hooks/useWidgetData';
import type { DashboardWidget } from '../../types';
import { WidgetSkeleton } from './WidgetSkeleton';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { WidgetBackground } from './WidgetBackground';

interface Props { widget: DashboardWidget; }

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2.5 min-w-[100px]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{payload[0].payload.name}</span>
        </div>
        <p className="text-sm font-bold text-foreground">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function WidgetRadar({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const { chartData, isLoading } = useWidgetData(widget.dataSource, widget.metric, widget.config?.externalApi);
  const cfg = widget.config || {};

  if (isLoading) return <WidgetSkeleton type="radar" />;
  if (!chartData.length) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{t('dashboardBuilder.noData')}</div>;
  }

  const fillColor = cfg.color || 'hsl(var(--chart-1))';

  return (
    <WidgetBackground bg={cfg.kpiBg} fallbackColor={fillColor} widgetId={widget.id}>
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="hsl(var(--border))" opacity={0.4} />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <PolarRadiusAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
            <Radar dataKey="value" stroke={fillColor} fill={fillColor} fillOpacity={0.25} strokeWidth={2} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </WidgetBackground>
  );
}
