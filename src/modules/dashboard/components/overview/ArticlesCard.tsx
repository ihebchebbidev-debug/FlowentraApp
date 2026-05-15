import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heading, Text } from '@/shared/components/Typography';

export default function ArticlesCard({ articles = 5 }: { articles?: number }) {
  const { t } = useTranslation('dashboard');
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <Heading as={CardTitle as any} size="card">{t('articlesCard.title')}</Heading>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex flex-col justify-between h-full">
          <div>
            <Text as="div" variant="muted">{t('articlesCard.published')}</Text>
            <Text as="div" variant="metric-sm" className="mt-1">{articles}</Text>
          </div>
          <Text as="div" variant="muted-xs" className="mt-3">{t('articlesCard.topArticle')}</Text>
        </div>
      </CardContent>
    </Card>
  );
}
