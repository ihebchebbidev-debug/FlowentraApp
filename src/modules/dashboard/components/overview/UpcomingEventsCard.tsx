import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heading, Text } from '@/shared/components/Typography';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import dayjs from 'dayjs';

export default function UpcomingEventsCard({ events, allEvents }: { events: Array<{ id: string, title: string, start: string | Date }>, allEvents?: Array<any> }) {
  const { t } = useTranslation('dashboard');
  if (!events.length) {
    return (
      <Card className="h-full flex flex-col justify-center items-center p-4">
        <Text as="div" variant="muted">{t('upcomingEvents.noUpcoming2Days')}</Text>
      </Card>
    );
  }
  // Prepare full 7-day list for modal (if allEvents provided)
  const next7 = (Array.isArray(allEvents) ? allEvents : []).
    map(e => ({ ...e, startDate: dayjs(e.start) })).
    filter(e => e.startDate.isAfter(dayjs().subtract(1, 'hour')) && e.startDate.isBefore(dayjs().add(7, 'day'))).
    sort((a, b) => a.startDate.valueOf() - b.startDate.valueOf());

  return (
    <Card className="h-full flex flex-col p-0 overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-start justify-between whitespace-nowrap space-y-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-start">
          <Heading as={CardTitle as any} size="card" className="truncate text-left">{t('upcomingEvents.title')}</Heading>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="flex-shrink-0 ml-2">{t('upcomingEvents.seeMore')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle>{t('upcomingEvents.upcoming7Title')}</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3 max-h-[60vh] overflow-auto">
                {next7.length === 0 && (
                <div className="p-4">
                  <Text as="div" variant="muted">{t('upcomingEvents.noEvents7Days')}</Text>
                </div>
              )}
                  {next7.map(ev => (
                    <div key={ev.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-start gap-3">
                        <div className="w-24 flex-shrink-0">
                          <Button variant="outline" size="sm" className="px-2 py-0.5 min-w-0">{dayjs(ev.start).format('ddd, MMM D')}</Button>
                        </div>
                        <div className="flex-1">
                          <Text as="div" variant="body" className="font-medium">{ev.title}</Text>
                          {ev.location && <Text as="div" variant="muted-xs">{ev.location}</Text>}
                        </div>
                        <div className="flex-shrink-0">
                          <Text as="div" variant="muted-xs" className="text-xs">{dayjs(ev.start).format('HH:mm')}</Text>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2 p-4 pt-0">
        {events.map(ev => (
          <div key={ev.id} className="rounded-lg px-3 py-2 bg-muted flex flex-col sm:flex-row sm:items-center gap-2 border border-border hover:bg-accent transition">
            {/* Date pill: outline button to match Create KPI */}
            <div className="flex-shrink-0">
              <Button variant="outline" size="sm" className="px-2 py-0.5 min-w-0">{dayjs(ev.start).format('ddd, MMM D')}</Button>
            </div>
            <Text as="span" variant="body" className="flex-1 truncate">{ev.title}</Text>
            <Text as="span" variant="muted-xs" className="ml-auto">{dayjs(ev.start).format('HH:mm')}</Text>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
