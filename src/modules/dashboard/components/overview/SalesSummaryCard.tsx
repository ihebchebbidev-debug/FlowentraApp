import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MiniChart } from '@/components/charts/MiniChart';
import { Heading, Text } from '@/shared/components/Typography';

export default function SalesSummaryCard({ won = 12, lost = 4 }: { won?: number; lost?: number }) {
  const { t } = useTranslation('dashboard');
  const total = won + lost;
  const winRate = total === 0 ? 0 : Math.round((won / total) * 100);

  return (
    <Card className="h-full flex flex-col border-0 shadow-[var(--shadow-card)] bg-[image:var(--gradient-card)]">
      <CardHeader>
        <Heading as={CardTitle as any} size="card">{t('salesSummary.title')}</Heading>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <Text as="div" variant="muted">{t('salesSummary.wonLost')}</Text>
              <Text as="div" variant="metric-sm" className="mt-1">{won} / {lost}</Text>
            </div>
            <div className="w-20">
              <MiniChart data={[{ value: 2 }, { value: 4 }, { value: 6 }, { value: 8 }, { value: 12 }]} type="line" color="#10b981" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <Text as="div" variant="muted-xs">{t('salesSummary.winRate')}</Text>
            <Text as="div" variant="body" className="font-medium">{winRate}%</Text>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
