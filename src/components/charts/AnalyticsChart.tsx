import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useId } from 'react';

type GenericPoint = { name: string; [key: string]: any };

interface SeriesConfig {
  key: string;            // data key in each data point
  name?: string;          // legend label
  color?: string;         // stroke/fill base color
  dashed?: boolean;       // render dashed line
  show?: boolean;         // allow toggling visibility
}

interface AnalyticsChartProps {
  data: Array<GenericPoint>;
  height?: number;
  // Legacy two-series props (kept for backward compatibility)
  actualColor?: string;
  projectedColor?: string;
  showActual?: boolean;
  showProjected?: boolean;
  // New: dynamic series mode. When provided, overrides legacy props.
  series?: SeriesConfig[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[120px]">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-semibold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsChart({ 
  data, 
  height = 300, 
  actualColor = 'hsl(var(--chart-1))', 
  projectedColor = 'hsl(var(--chart-2))',
  showActual = true,
  showProjected = true,
  series,
}: AnalyticsChartProps) {
  const uid = useId();
  const actualGradId = `actualGradient-${uid}`;
  const projectedGradId = `projectedGradient-${uid}`;
  const palette = [
    'hsl(142 76% 36%)',  // Green for won
    'hsl(0 84% 60%)',    // Red for lost
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {/* Legacy gradients */}
            <linearGradient id={actualGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={actualColor} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={actualColor} stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id={projectedGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={projectedColor} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={projectedColor} stopOpacity={0.05}/>
            </linearGradient>
            {/* Dynamic gradients with enhanced opacity */}
            {series?.map((s, i) => (
              <linearGradient key={s.key} id={`grad-${s.key}-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color || palette[i % palette.length]} stopOpacity={0.5} />
                <stop offset="50%" stopColor={s.color || palette[i % palette.length]} stopOpacity={0.2} />
                <stop offset="95%" stopColor={s.color || palette[i % palette.length]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            vertical={false}
            opacity={0.5}
          />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground ml-1">{value}</span>
            )}
          />
          {series && series.length > 0 ? (
            series.filter(s => s.show !== false).map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color || palette[i % palette.length]}
                fillOpacity={1}
                fill={`url(#grad-${s.key}-${uid})`}
                strokeWidth={2.5}
                strokeDasharray={s.dashed ? '6 4' : undefined}
                name={s.name || s.key}
                dot={{ r: 4, fill: s.color || palette[i % palette.length], strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                activeDot={{ r: 6, fill: s.color || palette[i % palette.length], strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              />
            ))
          ) : (
            <>
              {showActual && (
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke={actualColor}
                  fillOpacity={1}
                  fill={`url(#${actualGradId})`}
                  strokeWidth={2.5}
                  name="Actual"
                  dot={{ r: 4, fill: actualColor, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  activeDot={{ r: 6, fill: actualColor, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                />
              )}
              {showProjected && (
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke={projectedColor}
                  fillOpacity={1}
                  fill={`url(#${projectedGradId})`}
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  name="Projected"
                  dot={{ r: 4, fill: projectedColor, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  activeDot={{ r: 6, fill: projectedColor, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                />
              )}
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}