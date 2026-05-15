import { useWidgetData } from '../../hooks/useWidgetData';
import type { DashboardWidget } from '../../types';
import { WidgetSkeleton } from './WidgetSkeleton';
import { useTranslation } from 'react-i18next';
import { WidgetBackground } from './WidgetBackground';

interface Props { widget: DashboardWidget; }

const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
];

export function WidgetFunnel({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const { chartData, isLoading } = useWidgetData(widget.dataSource, widget.metric, widget.config?.externalApi);
  const cfg = widget.config || {};

  if (isLoading) return <WidgetSkeleton type="funnel" />;
  if (!chartData.length) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{t('dashboardBuilder.noData')}</div>;
  }

  const sorted = [...chartData].sort((a, b) => b.value - a.value);
  const maxVal = sorted[0]?.value || 1;

  return (
    <WidgetBackground bg={cfg.kpiBg} fallbackColor={cfg.color || 'hsl(var(--chart-1))'} widgetId={widget.id}>
      <div className="h-full flex flex-col justify-center gap-2 px-3 py-2">
        {sorted.map((item, index) => {
          const width = Math.max((item.value / maxVal) * 100, 12);
          const color = cfg.color || item.color || COLORS[index % COLORS.length];
          return (
            <div key={item.name} className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground w-20 truncate text-right flex-shrink-0">{item.name}</span>
              <div className="flex-1 flex justify-start">
                <div className="h-8 rounded-md flex items-center justify-center text-xs font-semibold transition-all duration-300"
                  style={{ width: `${width}%`, backgroundColor: color, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  {item.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetBackground>
  );
}
