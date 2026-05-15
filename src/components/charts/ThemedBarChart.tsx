import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';

interface ThemedBarChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number | string;
  showLabels?: boolean;
  horizontal?: boolean;
  usePrimaryGradient?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-[var(--shadow-strong)] p-2.5 min-w-[100px]">
        <p className="text-[12px] font-medium text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: payload[0].payload.color || 'hsl(var(--primary))' }}
          />
          <span className="text-lg font-bold text-foreground">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function ThemedBarChart({ 
  data, 
  height = 280, 
  showLabels = true,
  horizontal = false,
  usePrimaryGradient = true,
}: ThemedBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  if (horizontal) {
    return (
      <div className="w-full h-full flex flex-col justify-center gap-3 py-2">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={item.name} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="text-sm font-bold text-foreground">{item.value}</span>
              </div>
              <div className="relative h-8 bg-muted/50 rounded-lg overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ease-out group-hover:brightness-110"
                  style={{ 
                    width: `${Math.max(percentage, 3)}%`,
                    background: usePrimaryGradient 
                      ? `linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)`
                      : item.color || 'hsl(var(--primary))',
                    boxShadow: '0 2px 8px hsl(var(--primary) / 0.3)'
                  }}
                />
                {/* Animated shimmer effect */}
                <div 
                  className="absolute inset-y-0 left-0 rounded-lg overflow-hidden"
                  style={{ width: `${Math.max(percentage, 3)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const chartHeight = typeof height === 'string' ? height : `${height}px`;

  return (
    <div className="w-full h-full" style={{ height: chartHeight, minHeight: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -15, bottom: 20 }}>
          <defs>
            <linearGradient id="primaryBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.85} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="primaryBarGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
            </linearGradient>
            {data.map((entry, index) => (
              <linearGradient key={`gradient-${index}`} id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={entry.color || 'hsl(var(--primary))'} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color || 'hsl(var(--primary))'} stopOpacity={0.6} />
              </linearGradient>
            ))}
            <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="hsl(var(--primary))" floodOpacity="0.3"/>
            </filter>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            vertical={false} 
            opacity={0.4} 
          />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            dy={8}
            interval={0}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            allowDecimals={false}
            width={35}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15, radius: 8 }} 
          />
          <Bar 
            dataKey="value" 
            radius={[10, 10, 4, 4]}
            maxBarSize={55}
            style={{ filter: 'url(#barShadow)' }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={usePrimaryGradient ? 'url(#primaryBarGradient)' : `url(#barGradient-${index})`}
                className="transition-all duration-300 hover:brightness-110"
              />
            ))}
            {showLabels && (
              <LabelList 
                dataKey="value" 
                position="top" 
                fill="hsl(var(--foreground))"
                fontSize={12}
                fontWeight={600}
                offset={8}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
