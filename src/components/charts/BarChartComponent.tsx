import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

interface BarChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  valueKey?: string;
  labelKey?: string;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[100px]">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: payload[0].payload.color || payload[0].fill }}
          />
          <span className="text-lg font-bold text-foreground">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function BarChartComponent({ 
  data, 
  height = 250, 
  colors = [
    'hsl(142 76% 36%)',   // Green - accepted
    'hsl(217 91% 60%)',   // Blue - sent
    'hsl(48 96% 53%)',    // Yellow - negotiation
    'hsl(var(--chart-4))',
    'hsl(0 84% 60%)',     // Red - rejected
  ],
  showLegend = false,
  valueKey = 'value',
  labelKey = 'name',
}: BarChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
          <defs>
            {data.map((entry, index) => (
              <linearGradient key={`gradient-${index}`} id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={entry.color || colors[index % colors.length]} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color || colors[index % colors.length]} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
          <XAxis 
            dataKey={labelKey} 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            dy={10}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
          {showLegend && <Legend />}
          <Bar 
            dataKey={valueKey} 
            radius={[8, 8, 0, 0]}
            maxBarSize={45}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#barGradient-${index})`}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}