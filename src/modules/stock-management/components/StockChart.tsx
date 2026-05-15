import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { StockStats } from '../types';

interface StockChartProps {
  stats: StockStats;
}

export function StockChart({ stats }: StockChartProps) {
  const { t } = useTranslation('stock-management');

  const data = [
    { name: t('chart.healthy'), value: stats.healthy, color: 'hsl(var(--success))' },
    { name: t('chart.low'), value: stats.low, color: 'hsl(var(--warning))' },
    { name: t('chart.critical'), value: stats.critical, color: 'hsl(var(--destructive))' },
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t('chart.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [value, t('chart.legend')]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
