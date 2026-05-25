import { useMemo } from 'react';
import { Calendar as BigCalendar, dayjsLocalizer, Views } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/modules/calendar/styles.css';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarX2 } from 'lucide-react';

type LeaveEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
};

let _localizer: ReturnType<typeof dayjsLocalizer> | null = null;
function getLocalizer() {
  if (!_localizer) _localizer = dayjsLocalizer(dayjs);
  return _localizer;
}

export function LeavesCalendar(props: { events?: LeaveEvent[] }) {
  const localizer = getLocalizer();
  const { i18n, t } = useTranslation('hr');

  useMemo(() => {
    dayjs.locale(i18n.language.startsWith('fr') ? 'fr' : 'en');
  }, [i18n.language]);

  const views = useMemo(() => [Views.MONTH], []);
  const events = props.events ?? [];
  const defaultDate = useMemo(() => {
    if (!events.length) return new Date();
    const upcoming = events
      .map(e => e.start)
      .filter(d => d.getTime() >= Date.now())
      .sort((a, b) => a.getTime() - b.getTime())[0];
    return upcoming ?? events.map(e => e.start).sort((a, b) => b.getTime() - a.getTime())[0];
  }, [events]);

  return (
    <Card className="shadow-card border-0 bg-card p-3">
      <div className="text-sm text-muted-foreground mb-3">{t('leavesPage.calendarHint')}</div>
      {events.length === 0 ? (
        <Alert className="mb-3">
          <AlertDescription className="flex items-start gap-2">
            <CalendarX2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <span>{t('leavesPage.calendarEmptyHint')}</span>
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="h-[560px]">
        <BigCalendar
          localizer={localizer}
          events={events}
          views={views as any}
          defaultView={Views.MONTH}
          defaultDate={defaultDate}
          selectable={false}
          popup={false}
          style={{ height: '100%' }}
        />
      </div>
    </Card>
  );
}

