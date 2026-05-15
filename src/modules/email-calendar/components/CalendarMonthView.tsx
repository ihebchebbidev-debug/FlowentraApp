import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  addMonths,
  subMonths,
} from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import type { SyncedCalendarEventDto } from '@/services/api/emailAccountsApi';

interface CalendarMonthViewProps {
  events: SyncedCalendarEventDto[];
  onEventClick: (event: SyncedCalendarEventDto) => void;
}

export function CalendarMonthView({ events, onEventClick }: CalendarMonthViewProps) {
  const { t, i18n } = useTranslation('email-calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const locale = i18n.language === 'fr' ? fr : enUS;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return format(day, 'EEE', { locale });
    });
  }, [locale]);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, day);
    });
  };

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy', { locale })}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => setCurrentMonth(new Date())}
          >
            {t('calendarView.today')}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-px">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/30">
        {calendarDays.map((day) => {
          const dayEvents = getEventsForDay(day);
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "bg-background min-h-[80px] p-1.5 transition-colors",
                !inCurrentMonth && "bg-muted/30",
              )}
            >
              <div className={cn(
                "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                today && "bg-primary text-primary-foreground",
                !today && inCurrentMonth && "text-foreground",
                !today && !inCurrentMonth && "text-muted-foreground/50",
              )}>
                {format(day, 'd')}
              </div>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    className={cn(
                      "w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate transition-colors",
                      event.status === 'cancelled'
                        ? "bg-destructive/10 text-destructive line-through"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    onClick={() => onEventClick(event)}
                    title={event.title}
                  >
                    {!event.isAllDay && (
                      <span className="font-medium">{format(new Date(event.startTime), 'HH:mm')} </span>
                    )}
                    {event.title || t('eventDetail.noTitle')}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-muted-foreground px-1">
                    +{dayEvents.length - 3} {t('calendarView.more')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
