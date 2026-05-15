import { useWidgetData } from '../../hooks/useWidgetData';
import type { DashboardWidget } from '../../types';
import { WidgetSkeleton } from './WidgetSkeleton';
import { useTranslation } from 'react-i18next';
import { WidgetBackground } from './WidgetBackground';

interface Props { widget: DashboardWidget; }

export function WidgetGauge({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const { value, isLoading } = useWidgetData(widget.dataSource, widget.metric, widget.config?.externalApi);
  const title = widget.titleCustom || t(widget.titleKey);
  const cfg = widget.config || {};
  const numValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;
  const maxVal = cfg.maxValue || 100;
  const progress = Math.min(Math.max(numValue, 0), maxVal);
  const percentage = (progress / maxVal) * 100;

  if (isLoading) return <WidgetSkeleton type="gauge" />;

  const color = cfg.color || 'hsl(var(--primary))';
  const size = 100;
  const strokeW = 8;
  const r = (size - strokeW * 2) / 2;
  const circumference = r * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <WidgetBackground bg={cfg.kpiBg} fallbackColor={color} widgetId={widget.id}>
      <div className="h-full flex flex-col items-center justify-center gap-1.5">
        <div className="relative inline-flex items-center justify-center">
          <svg height={size} width={size} className="transform -rotate-90">
            <circle stroke="hsl(var(--muted))" fill="transparent" strokeWidth={strokeW} r={r} cx={size / 2} cy={size / 2} />
            <circle stroke={color} fill="transparent" strokeWidth={strokeW}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset: offset }}
              strokeLinecap="round" r={r} cx={size / 2} cy={size / 2}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-foreground">{numValue}%</span>
          </div>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground text-center truncate max-w-full px-1">{title}</span>
      </div>
    </WidgetBackground>
  );
}
