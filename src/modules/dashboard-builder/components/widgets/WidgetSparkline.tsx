import { useTranslation } from 'react-i18next';
import { useWidgetData } from '../../hooks/useWidgetData';
import type { DashboardWidget } from '../../types';
import { WidgetSkeleton } from './WidgetSkeleton';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';
import { WidgetBackground } from './WidgetBackground';

interface Props { widget: DashboardWidget; }

export function WidgetSparkline({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const { trendData, value, isLoading } = useWidgetData(widget.dataSource, widget.metric, widget.config?.externalApi);
  const title = widget.titleCustom || t(widget.titleKey);
  const cfg = widget.config || {};

  if (isLoading) return <WidgetSkeleton type="sparkline" />;

  const color = cfg.color || 'hsl(var(--primary))';
  const sparkType = cfg.sparklineType || 'area';
  const data = trendData.length ? trendData : [{ value: 0 }];

  return (
    <WidgetBackground bg={cfg.kpiBg} fallbackColor={color} widgetId={widget.id}>
      <div className="h-full flex flex-col justify-between py-1 px-1">
        <div>
          <span className="text-[11px] font-medium text-muted-foreground truncate block">{title}</span>
          <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
        </div>
        <div className="flex-1 min-h-0 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            {sparkType === 'area' ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`spark-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#spark-${widget.id})`} />
              </AreaChart>
            ) : (
              <LineChart data={data}>
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </WidgetBackground>
  );
}
