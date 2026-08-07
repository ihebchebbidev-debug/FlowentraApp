import React from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { DistributionEntry } from '../hooks/useTicketsData';

interface Props {
  title: string;
  data: DistributionEntry[];
  colorMap?: Record<string, string>;
}

const FALLBACK_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(217 91% 60%)',
  'hsl(38 92% 50%)',
  'hsl(142 71% 45%)',
  'hsl(271 91% 65%)',
  'hsl(0 0% 60%)',
];

export default function TicketsByStatusChart({ title, data, colorMap }: Props) {
  const { t } = useTranslation('support');

  if (data.length === 0) {
    return (
      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-semibold mb-3">{title}</h3>
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
          {t('dashboard.emptyChart', 'No data yet')}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={40}
              outerRadius={72}
              paddingAngle={2}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.key}
                  fill={colorMap?.[entry.key] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
