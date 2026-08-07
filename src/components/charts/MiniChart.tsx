import { ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

interface MiniChartProps {
  data: Array<{ value: number; label?: string }>;
  type?: 'line' | 'area';
  color?: string;
  height?: number;
}

export function MiniChart({ 
  data, 
  type = 'line', 
  color = "hsl(var(--primary))", 
  height = 60 
}: MiniChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`miniGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#miniGradient-${color})`}
            />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}