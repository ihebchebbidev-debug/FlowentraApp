import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heading, Text } from '@/shared/components/Typography';

type Props = {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  accent?: string;
};

export default function KPICard({ title, value, subtitle }: Props) {
  return (
    <Card className="h-full border-0 shadow-[var(--shadow-card)] bg-[image:var(--gradient-card)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <Heading as="div" size="label" className="text-muted-foreground">{title}</Heading>
            <Text as="div" variant="metric" className="mt-1">{value}</Text>
            {subtitle && <Text as="div" variant="muted-xs" className="mt-1">{subtitle}</Text>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
