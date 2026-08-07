import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Heading, Text } from '@/shared/components/Typography';

export default function EventsCard({ events = [] }: { events?: { id: string; title: string; time?: string }[] }) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const goToCalendar = (eventId?: string) => {
    if (eventId) {
      navigate(`/dashboard/calendar?eventId=${encodeURIComponent(eventId)}`);
    } else {
      navigate('/dashboard/calendar');
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <Heading as="div" size="card">{t('eventsCard.title')}</Heading>
          <Button variant="ghost" size="sm" onClick={() => goToCalendar()}>{t('eventsCard.viewCalendar')}</Button>
        </div>
        <ul className="mt-3 space-y-2">
          {events.length === 0 && <li><Text variant="muted">{t('eventsCard.noUpcoming')}</Text></li>}
          {events.map(e => (
            <li key={e.id}>
              <button
                onClick={() => goToCalendar(e.id)}
                className="w-full text-left flex items-start justify-between gap-4 py-2 rounded hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Text as="div" className="min-w-0 truncate">{e.title}</Text>
                {e.time && <Text as="div" variant="muted-xs" className="shrink-0">{e.time}</Text>}
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
