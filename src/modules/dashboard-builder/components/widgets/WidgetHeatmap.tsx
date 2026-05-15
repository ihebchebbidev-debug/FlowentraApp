import { useTranslation } from 'react-i18next';
import { useWidgetData } from '../../hooks/useWidgetData';
import type { DashboardWidget } from '../../types';
import { WidgetSkeleton } from './WidgetSkeleton';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WidgetBackground } from './WidgetBackground';

interface Props { widget: DashboardWidget; }

function getHeatColor(value: number, max: number, accent?: string): string {
  const ratio = max > 0 ? value / max : 0;
  if (accent) {
    return `color-mix(in srgb, ${accent} ${Math.round(ratio * 100)}%, hsl(var(--muted)) ${Math.round((1 - ratio) * 100)}%)`;
  }
  const opacity = Math.max(0.08, ratio);
  return `hsl(var(--chart-1) / ${opacity})`;
}

export function WidgetHeatmap({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const { chartData, isLoading } = useWidgetData(widget.dataSource, widget.metric, widget.config?.externalApi);
  const cfg = widget.config || {};

  const { grid, rowLabels, colLabels, maxVal } = useMemo(() => {
    if (!chartData.length) return { grid: [], rowLabels: [], colLabels: [], maxVal: 0 };
    const labels = chartData.map(d => d.name);
    const values = chartData.map(d => d.value);
    const max = Math.max(...values, 1);
    return { grid: [values], rowLabels: [t('dashboardBuilder.total')], colLabels: labels, maxVal: max };
  }, [chartData, t]);

  if (isLoading) return <WidgetSkeleton type="heatmap" />;
  if (!chartData.length) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{t('dashboardBuilder.noData')}</div>;
  }

  return (
    <WidgetBackground bg={cfg.kpiBg} fallbackColor={cfg.color || 'hsl(var(--chart-1))'} widgetId={widget.id}>
      <TooltipProvider>
        <div className="h-full w-full flex flex-col p-3 gap-2">
          <div className="flex gap-1 pl-16">
            {colLabels.map((col, ci) => (
              <div key={ci} className="flex-1 text-center text-[10px] text-muted-foreground font-medium truncate">{col}</div>
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-1 min-h-0">
            {grid.map((row, ri) => (
              <div key={ri} className="flex gap-1 items-stretch flex-1">
                <div className="w-16 flex items-center text-[10px] text-muted-foreground font-medium truncate">{rowLabels[ri]}</div>
                {row.map((val, ci) => (
                  <Tooltip key={ci}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 rounded-md flex items-center justify-center text-xs font-bold transition-colors cursor-default min-h-[28px]"
                        style={{ backgroundColor: getHeatColor(val, maxVal, cfg.color), color: val / maxVal > 0.5 ? 'white' : 'hsl(var(--foreground))' }}>
                        {val}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">{colLabels[ci]}: {val}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>
    </WidgetBackground>
  );
}
