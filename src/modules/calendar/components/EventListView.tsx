import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { CalendarEvent } from '../types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Calendar, CheckSquare, Wrench, ClipboardList, DollarSign, Briefcase,
  MapPin, User, Clock, ChevronRight
} from 'lucide-react';

export interface EventListViewProps {
  startDate: Date;
  days?: number;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}

const SOURCE_ICONS: Record<string, React.ElementType> = {
  task: CheckSquare,
  dispatch: Wrench,
  offer: ClipboardList,
  sale: DollarSign,
  service_order: Briefcase,
  manual: Calendar,
};

export const EventListView: React.FC<EventListViewProps> = ({
  startDate,
  days = 30,
  events,
  onEventClick,
  className
}) => {
  const { t } = useTranslation('calendar');

  const daysArray = useMemo(() => {
    return Array.from({ length: days }, (_, i) => dayjs(startDate).add(i, 'day'));
  }, [startDate, days]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const d of daysArray) {
      map.set(d.format('YYYY-MM-DD'), []);
    }
    for (const ev of events) {
      const key = dayjs(ev.start).format('YYYY-MM-DD');
      if (map.has(key)) {
        map.get(key)!.push(ev);
      }
    }
    for (const [, list] of map) {
      list.sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());
    }
    return map;
  }, [events, daysArray]);

  const isToday = (d: dayjs.Dayjs) => d.isSame(dayjs(), 'day');

  return (
    <div className={cn('space-y-3 p-3', className)}>
      {daysArray.map(d => {
        const key = d.format('YYYY-MM-DD');
        const list = byDay.get(key) || [];
        const today = isToday(d);
        return (
          <Card key={key} className={cn("border shadow-sm overflow-hidden", today && "ring-2 ring-primary/20")}>
            <div className={cn(
              "px-4 py-2.5 flex items-center justify-between sticky top-0 backdrop-blur supports-[backdrop-filter]:bg-card/80",
              today ? "bg-primary/5" : "bg-card/95"
            )}>
              <div className="flex items-center gap-2">
                {today && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                <span className={cn("font-semibold text-sm capitalize", today && "text-primary")}>
                  {d.format('dddd, MMM D')}
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px] h-5">
                {list.length} {list.length === 1 ? t('event') : t('events')}
              </Badge>
            </div>
            <div className="divide-y divide-border/60">
              {list.length === 0 ? (
                <div className="px-4 py-4 text-xs text-muted-foreground italic">{t('no_events_day')}</div>
              ) : (
                list.map(ev => {
                  const Icon = SOURCE_ICONS[ev.type] || Calendar;
                  const isAllDay = ev.allDay || dayjs(ev.end).diff(dayjs(ev.start), 'day') >= 1;
                  const meta = ev.metadata;
                  const statusLabel = String(t(`status_label.${(ev.status || 'scheduled').replace(/ /g, '_')}`, ev.status));

                  return (
                    <button
                      key={String(ev.id)}
                      onClick={() => onEventClick?.(ev)}
                      className="w-full text-left px-4 py-3 hover:bg-accent/40 transition-colors flex items-start gap-3 group"
                    >
                      <div className="p-1.5 rounded-md shrink-0 mt-0.5" style={{ backgroundColor: `${ev.color || '#6b7280'}15` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: ev.color || '#6b7280' }} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
                            {ev.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {isAllDay ? t('all_day') : `${dayjs(ev.start).format('HH:mm')} - ${dayjs(ev.end).format('HH:mm')}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize">{statusLabel}</Badge>
                          {meta?.contactName && (
                            <span className="flex items-center gap-1">
                              <User className="h-2.5 w-2.5" /> {meta.contactName}
                            </span>
                          )}
                          {meta?.amount != null && (
                            <span className="font-medium text-foreground">
                              {meta.amount.toLocaleString()} {meta.currency || ''}
                            </span>
                          )}
                          {ev.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-2.5 w-2.5" /> {ev.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default EventListView;
