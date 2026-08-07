import { useState } from 'react';
import { Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HRPageHeader } from '../HRPageHeader';
import { GoalsTab } from './GoalsTab';
import { ReviewCyclesTab } from './ReviewCyclesTab';
import { ReviewsTab } from './ReviewsTab';

export function PerformancePage() {
  const { t } = useTranslation('hr');
  const [tab, setTab] = useState('goals');
  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('performancePage.title')}
        subtitle={t('performancePage.subtitle')}
        icon={Target}
        accentColor="chart-3"
      />
      <div className="p-4 md:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="underline">
            <TabsTrigger value="goals">{t('performancePage.tabs.goals')}</TabsTrigger>
            <TabsTrigger value="cycles">{t('performancePage.tabs.cycles')}</TabsTrigger>
            <TabsTrigger value="reviews">{t('performancePage.tabs.reviews')}</TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="mt-4"><GoalsTab /></TabsContent>
          <TabsContent value="cycles" className="mt-4"><ReviewCyclesTab /></TabsContent>
          <TabsContent value="reviews" className="mt-4"><ReviewsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
