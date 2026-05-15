import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface DonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[120px]">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="text-sm font-medium text-foreground">{data.name}</span>
        </div>
        <p className="text-lg font-bold text-foreground">{data.value}</p>
      </div>
    );
  }
  return null;
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null; // Don't show label for very small slices
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central"
      className="text-xs font-semibold"
      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function DonutChartComponent({ 
  data, 
  height = 260,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Filter out zero values for cleaner display
  const filteredData = data.filter(d => d.value > 0);
  
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {data.map((entry, index) => (
              <linearGradient key={`gradient-${index}`} id={`donutGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.8} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {filteredData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{ 
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                  cursor: 'pointer'
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend 
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ paddingTop: '15px' }}
              formatter={(value, entry: any) => (
                <span className="text-xs text-muted-foreground ml-1">
                  {value} ({entry.payload.value})
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Label */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: showLegend ? '30px' : '0' }}>
          <div className="text-center">
            {centerValue !== undefined && (
              <p className="text-2xl font-bold text-foreground">{centerValue}</p>
            )}
            {centerLabel && (
              <p className="text-xs text-muted-foreground">{centerLabel}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
