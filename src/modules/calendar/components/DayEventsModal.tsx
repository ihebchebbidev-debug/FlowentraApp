import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarEvent } from "../types";
import { UnifiedCalendarService } from "../services/unifiedCalendar.service";
import dayjs from "dayjs";
import {
  CalendarDays, Clock, MapPin, Search, User, DollarSign, Wrench,
  ClipboardList, Briefcase, CheckSquare, Calendar, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type DayEventsModalProps = {
  open: boolean;
  date: Date | null;
  events: CalendarEvent[];
  onOpenChange: (open: boolean) => void;
  onAddEvent: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  eventTypesLoaded?: boolean;
};

const SOURCE_ICONS: Record<string, React.ElementType> = {
  task: CheckSquare,
  dispatch: Wrench,
  offer: ClipboardList,
  sale: DollarSign,
  service_order: Briefcase,
  manual: Calendar,
};

function EventCard({ ev, t, onClick }: { ev: CalendarEvent; t: any; onClick: () => void }) {
  const Icon = SOURCE_ICONS[ev.type] || Calendar;
  const isAllDay = ev.allDay || dayjs(ev.end).diff(dayjs(ev.start), 'day') >= 1;
  const statusLabel = String(t(`status_label.${(ev.status || 'scheduled').replace(/ /g, '_')}`, ev.status || 'scheduled'));
  const sourceLabel = String(t(`source_label.${ev.type}`, ev.type));
  const meta = ev.metadata;

  return (
    <button onClick={onClick} className="w-full text-left group">
      <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-accent/40 transition-all duration-150">
        {/* Source icon */}
        <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${ev.color || 'hsl(var(--primary))'}15` }}>
          <Icon className="h-4 w-4" style={{ color: ev.color || 'hsl(var(--primary))' }} />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Title + time */}
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors leading-tight">
              {ev.title}
            </p>
            <Badge variant="outline" className="shrink-0 text-[10px] h-5">
              {isAllDay ? String(t('all_day')) : `${dayjs(ev.start).format('HH:mm')} - ${dayjs(ev.end).format('HH:mm')}`}
            </Badge>
          </div>

          {/* Source + Status badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className="text-[10px] h-4 px-1.5" style={{ backgroundColor: `${ev.color}20`, color: ev.color, border: `1px solid ${ev.color}30` }}>
              {sourceLabel}
            </Badge>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize">{statusLabel}</Badge>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            {meta?.contactName && (
              <span className="flex items-center gap-1 truncate">
                <User className="h-3 w-3 shrink-0" />
                {meta.contactName}
              </span>
            )}
            {meta?.amount != null && (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <DollarSign className="h-3 w-3 shrink-0" />
                {meta.amount.toLocaleString()} {meta.currency || ''}
              </span>
            )}
            {meta?.technicianName && (
              <span className="flex items-center gap-1 truncate">
                <Wrench className="h-3 w-3 shrink-0" />
                {meta.technicianName}
              </span>
            )}
            {ev.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {ev.location}
              </span>
            )}
            {meta?.estimatedDuration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                {t('detail.duration_min', { count: meta.estimatedDuration })}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary shrink-0 mt-1 transition-colors" />
      </div>
    </button>
  );
}

export function DayEventsModal({ open, date, events, onOpenChange, onAddEvent, onEventClick, eventTypesLoaded = true }: DayEventsModalProps) {
  const { t } = useTranslation('calendar');
  const [search, setSearch] = useState('');

  const sorted = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...events]
      .filter(ev => {
        if (!term) return true;
        return ev.title.toLowerCase().includes(term)
          || (ev.description || '').toLowerCase().includes(term)
          || (ev.location || '').toLowerCase().includes(term)
          || (ev.metadata?.contactName || '').toLowerCase().includes(term)
          || (ev.metadata?.technicianName || '').toLowerCase().includes(term);
      })
      .sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());
  }, [events, search]);

  // Group by source type
  const bySource = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of sorted) {
      const list = map.get(ev.type) || [];
      list.push(ev);
      map.set(ev.type, list);
    }
    return map;
  }, [sorted]);

  const title = date ? dayjs(date).format("dddd, MMMM D, YYYY") : "";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setSearch(''); onOpenChange(v); }}>
      <DialogContent className="w-[95vw] max-w-[780px] sm:max-w-2xl p-0 overflow-hidden sm:rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 pr-14 shrink-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="truncate text-base sm:text-lg capitalize">{title}</DialogTitle>
                <DialogDescription className="mt-0.5 text-xs sm:text-sm">
                  {sorted.length > 0
                    ? (sorted.length === 1 ? t('day_modal.events_count', { count: 1 }) : t('day_modal.events_count_plural', { count: sorted.length }))
                    : t('day_modal.no_events')}
                </DialogDescription>
              </div>
            </div>
            {date && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddEvent(date)}
                disabled={!eventTypesLoaded}
                className="shrink-0 text-xs"
              >
                {eventTypesLoaded ? t('add_event') : t('loading_types')}
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Search within day */}
        {events.length > 2 && (
          <div className="px-4 pt-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('search_placeholder')}
                className="pl-9 h-8 text-xs"
              />
            </div>
          </div>
        )}

        {/* Events list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {sorted.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{t('day_modal.no_events')}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{t('day_modal.no_events_desc')}</p>
                {date && (
                  <Button variant="link" size="sm" className="mt-3" onClick={() => onAddEvent(date)} disabled={!eventTypesLoaded}>
                    {t('add_first_event')}
                  </Button>
                )}
              </div>
            ) : bySource.size > 1 ? (
              // Grouped by source when multiple types
              Array.from(bySource.entries()).map(([source, list]) => {
                const sourceLabel = String(t(`source_label.${source}`, source));
                return (
                  <div key={source}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: UnifiedCalendarService.getSourceColors()[source as keyof ReturnType<typeof UnifiedCalendarService.getSourceColors>] || '#6b7280' }} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{sourceLabel}</span>
                      <Badge variant="secondary" className="text-[10px] h-4 ml-auto">{list.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {list.map(ev => (
                        <EventCard key={ev.id} ev={ev} t={t} onClick={() => onEventClick(ev)} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              // Flat list when single type
              <div className="space-y-2">
                {sorted.map(ev => (
                  <EventCard key={ev.id} ev={ev} t={t} onClick={() => onEventClick(ev)} />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
