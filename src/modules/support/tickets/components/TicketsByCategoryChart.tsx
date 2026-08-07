import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { DistributionEntry } from '../hooks/useTicketsData';

interface Props {
  title: string;
  data: DistributionEntry[];
}

export default function TicketsByCategoryChart({ title, data }: Props) {
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
          <BarChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} width={32} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
              cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
