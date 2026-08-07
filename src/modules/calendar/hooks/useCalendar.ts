import { useEffect, useMemo, useState, useCallback } from "react";
import { Views, View } from "react-big-calendar";
import { add, startOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import type { CalendarEvent } from "../types";
import { UnifiedCalendarService } from "../services/unifiedCalendar.service";

export function useCalendar() {
  const [date, setDate] = useState<Date>(startOfToday());
  const [view, setView] = useState<View>(Views.MONTH);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Load aggregated events from all internal modules
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const all = await UnifiedCalendarService.loadAll();
        if (!cancelled) setEvents(all);
      } catch (error) {
        console.error('Failed to load unified calendar events:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const currentPeriodEvents = useMemo(() => {
    let start: Date, end: Date;
    switch (view) {
      case Views.WEEK:
        start = startOfWeek(date); end = endOfWeek(date); break;
      case Views.MONTH:
        start = startOfMonth(date); end = endOfMonth(date); break;
      default:
        start = startOfToday(); end = add(startOfToday(), { days: 7 });
    }
    return events.filter(event => event.start >= start && event.start <= end);
  }, [events, date, view]);

  function onNavigate(action: "TODAY" | "PREV" | "NEXT") {
    if (action === "TODAY") return setDate(new Date());
    if (action === "PREV") return setDate(add(date, { [view === Views.MONTH || view === "year" ? "months" : "days"]: -1 * (view === Views.WEEK ? 7 : 1) } as any));
    if (action === "NEXT") return setDate(add(date, { [view === Views.MONTH || view === "year" ? "months" : "days"]: view === Views.WEEK ? 7 : 1 } as any));
  }

  const create = useCallback(async (data: { title: string; start: Date; end: Date; type: string; description?: string; location?: string }) => {
    const newEvent = UnifiedCalendarService.create(data);
    setEvents(prev => [...prev, newEvent]);
  }, []);

  const update = useCallback(async (eventId: string, data: Partial<CalendarEvent>) => {
    if (!UnifiedCalendarService.isEditable(eventId)) {
      console.warn('Cannot edit module-generated events');
      return;
    }
    const updated = UnifiedCalendarService.update(eventId, data);
    if (updated) {
      setEvents(prev => prev.map(e => e.id === eventId ? updated : e));
    }
  }, []);

  const remove = useCallback(async (eventId: string) => {
    if (!UnifiedCalendarService.isEditable(eventId)) {
      console.warn('Cannot delete module-generated events');
      return;
    }
    if (UnifiedCalendarService.remove(eventId)) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await UnifiedCalendarService.refresh();
      setEvents(all);
    } finally {
      setLoading(false);
    }
  }, []);

  return { date, setDate, view, setView, events, setEvents, currentPeriodEvents, onNavigate, create, update, remove, loading, refresh } as const;
}
