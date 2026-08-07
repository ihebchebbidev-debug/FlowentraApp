import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Calendar as BigCalendar, Views, View, dayjsLocalizer } from "react-big-calendar";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { add, startOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isWithinInterval } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { YearGrid } from "./YearGrid";
import { EventDialog } from "./EventDialog";
import { EventViewDialog } from "./EventViewDialog";
import { EventTypeManager, EventType } from "./EventTypeManager";
import type { CalendarEvent } from "../types";
import { SOURCE_LABELS } from "../services/unifiedCalendar.service";
import { UnifiedCalendarService } from "../services/unifiedCalendar.service";
import { useLookups } from "@/shared/contexts/LookupsContext";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles.css";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon,
  Calendar as CalendarIcon,
  List as ListIcon, RefreshCw, Filter, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar as DatePicker } from "@/components/ui/calendar";

import { useCalendar } from "../hooks/useCalendar";
import { DayEventsModal } from "./DayEventsModal";
import { EventListView } from "./EventListView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SearchAndFilterBar, type FilterGroup } from "@/shared/components/SearchAndFilterBar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

let _localizer: ReturnType<typeof dayjsLocalizer> | null = null;
function getLocalizer() {
  if (!_localizer) _localizer = dayjsLocalizer(dayjs);
  return _localizer;
}

export function CalendarPage() {
  const localizer = getLocalizer();
  const { t, i18n } = useTranslation('calendar');
  const { eventTypes: lookupEventTypes, updateEventTypes } = useLookups();
  const { date, setDate, view, setView, events, setEvents, currentPeriodEvents, onNavigate, create, update, remove, loading, refresh } = useCalendar();

  const eventTypes: EventType[] = lookupEventTypes.map(lookup => ({
    id: lookup.id,
    name: lookup.name,
    color: lookup.color || '#6b7280',
    isDefault: lookup.isDefault || false
  }));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [typeManagerOpen, setTypeManagerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [slotSelection, setSlotSelection] = useState<{ start?: Date; end?: Date; }>({});
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null);
  const [mode, setMode] = useState<'calendar' | 'list'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<{ source?: string }>({ source: 'all' });
  const [dateRangePreset, setDateRangePreset] = useState<string>('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${t("title")} — FlowSolution`;
  }, [t]);

  useEffect(() => {
    dayjs.locale(i18n.language.startsWith("fr") ? "fr" : "en");
  }, [i18n.language]);

  const views = useMemo(() => ({ month: true, week: true, day: true }), []);

  const handleCreate = async (data: {
    title: string; start: Date; end: Date; type: string; description?: string; location?: string;
  }) => {
    try {
      await create(data);
      setDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleUpdate = async (eventId: string, data: Partial<CalendarEvent>) => {
    try {
      await update(eventId, data);
      setDialogOpen(false);
      setViewDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDelete = (eventId: string) => {
    remove(eventId);
    setViewDialogOpen(false);
    setDialogOpen(false);
  };

  const handleEventView = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setViewDialogOpen(true);
  };

  // Open event from query param ?eventId=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const eid = params.get('eventId');
      if (eid) {
        const match = events.find(ev => String(ev.id) === String(eid));
        if (match) {
          setSelectedEvent(match);
          setViewDialogOpen(true);
          params.delete('eventId');
          const newSearch = params.toString();
          const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
          navigate(newPath, { replace: true });
        }
      }
    } catch { /* ignore */ }
  }, [location.search, location.pathname, events, navigate]);

  const handleEventEdit = () => {
    setViewDialogOpen(false);
    setDialogOpen(true);
  };

  const getEventColor = (event: CalendarEvent) => {
    return event.color || '#6b7280';
  };

  // Source-based filter groups
  const filterGroups: FilterGroup[] = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of events) {
      counts[ev.type] = (counts[ev.type] || 0) + 1;
    }
    const sourceKeys = Object.keys(UnifiedCalendarService.getSourceLabels());
    return [
      {
        key: 'source',
        label: t('source'),
        options: sourceKeys.map(key => ({
          value: key,
          label: t(`source_label.${key}`, key),
          count: counts[key] || 0,
        })),
      },
    ];
  }, [events, t]);

  const onFilterChange = (key: string, value: string | string[]) => {
    if (key === 'source') setActiveFilters(prev => ({ ...prev, source: value as string }));
  };
  const onClearFilters = () => {
    setActiveFilters({ source: 'all' });
    setDateRangePreset('all');
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
  };

  // Compute effective date range from preset or custom
  const effectiveDateRange = useMemo<{ from: Date; to: Date } | null>(() => {
    const today = startOfToday();
    switch (dateRangePreset) {
      case 'this_week': return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'next_week': {
        const next = add(today, { weeks: 1 });
        return { from: startOfWeek(next, { weekStartsOn: 1 }), to: endOfWeek(next, { weekStartsOn: 1 }) };
      }
      case 'this_month': return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'next_month': {
        const next = add(today, { months: 1 });
        return { from: startOfMonth(next), to: endOfMonth(next) };
      }
      case 'custom':
        if (customDateFrom && customDateTo) return { from: customDateFrom, to: endOfMonth(customDateTo) < customDateTo ? customDateTo : customDateTo };
        if (customDateFrom) return { from: customDateFrom, to: add(customDateFrom, { years: 1 }) };
        return null;
      default: return null; // 'all' — no date filter
    }
  }, [dateRangePreset, customDateFrom, customDateTo]);

  // Auto-clear the active preset chip when the user manually navigates the
  // calendar (Prev / Next / Today / view switch / clicking a date). Custom
  // ranges are preserved because they're explicit user intent.
  const clearPresetIfNavigatedAway = (nextDate: Date) => {
    if (dateRangePreset === 'all' || dateRangePreset === 'custom') return;
    if (!effectiveDateRange) return;
    const inRange = isWithinInterval(nextDate, {
      start: effectiveDateRange.from,
      end: effectiveDateRange.to,
    });
    if (!inRange) setDateRangePreset('all');
  };

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return events.filter(ev => {
      const matchesSearch = !term
        || ev.title.toLowerCase().includes(term)
        || (ev.location || '').toLowerCase().includes(term)
        || (ev.description || '').toLowerCase().includes(term)
        || (ev.contactName || '').toLowerCase().includes(term)
        || (ev.metadata?.contactName || '').toLowerCase().includes(term)
        || (ev.metadata?.technicianName || '').toLowerCase().includes(term)
        || (ev.metadata?.jobNumber || '').toLowerCase().includes(term)
        || (ev.metadata?.orderNumber || '').toLowerCase().includes(term)
        || (ev.metadata?.offerNumber || '').toLowerCase().includes(term)
        || (ev.metadata?.saleNumber || '').toLowerCase().includes(term)
        || (ev.status || '').toLowerCase().includes(term);
      const matchesSource = !activeFilters.source || activeFilters.source === 'all' || ev.type === activeFilters.source;
      // NOTE: date preset (This Week / Next Week / This Month ...) only navigates
      // the calendar display — it MUST NOT filter event content. The calendar
      // grid itself already restricts what is visible to the displayed period,
      // and we want ALL sources within that displayed period to appear.
      // The "custom" range remains a real content filter (explicit user intent).
      const matchesDate =
        !effectiveDateRange ||
        dateRangePreset !== 'custom' ||
        isWithinInterval(ev.start, { start: effectiveDateRange.from, end: effectiveDateRange.to });
      return matchesSearch && matchesSource && matchesDate;
    });
  }, [events, searchTerm, activeFilters, effectiveDateRange, dateRangePreset]);

  const Header = () => (
    <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{t('title')}</h1>
          <p className="text-px-10 sm:text-px-11 text-muted-foreground truncate">{t('subtitle')}</p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2">
      </div>
    </div>
  );

  return (
    <div className="flex flex-col">
      <Header />


      <Card className="border-0 shadow-medium">
        <Separator />
        <CardContent className={cn("p-0")}>
          <div className="p-3 sm:p-4 pb-3">
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder={t('search_placeholder')}
              filterGroups={filterGroups}
              activeFilters={activeFilters as any}
              onFilterChange={onFilterChange}
              onClearFilters={onClearFilters}
              fullWidth
            />
          </div>
          {/* Date range quick filters */}
          <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {/* Date range preset buttons */}
            {[
              { value: 'all', labelKey: 'date_range.all' },
              { value: 'this_week', labelKey: 'date_range.this_week' },
              { value: 'next_week', labelKey: 'date_range.next_week' },
              { value: 'this_month', labelKey: 'date_range.this_month' },
              { value: 'next_month', labelKey: 'date_range.next_month' },
              { value: 'custom', labelKey: 'date_range.custom' },
            ].map(preset => (
              <Button
                key={preset.value}
                variant={dateRangePreset === preset.value ? 'default' : 'outline'}
                size="sm"
                className={cn("h-7 text-xs rounded-full px-3", dateRangePreset === preset.value && "bg-primary text-primary-foreground")}
                onClick={() => {
                  setDateRangePreset(preset.value);
                  if (preset.value !== 'custom') { setCustomDateFrom(undefined); setCustomDateTo(undefined); }
                  // Navigate calendar to the start of the selected range
                  const today = startOfToday();
                  switch (preset.value) {
                    case 'this_week': setDate(startOfWeek(today, { weekStartsOn: 1 })); break;
                    case 'next_week': setDate(startOfWeek(add(today, { weeks: 1 }), { weekStartsOn: 1 })); break;
                    case 'this_month': setDate(startOfMonth(today)); break;
                    case 'next_month': setDate(startOfMonth(add(today, { months: 1 }))); break;
                    case 'all': setDate(today); break;
                  }
                }}
              >
                {t(preset.labelKey)}
              </Button>
            ))}
            {dateRangePreset !== 'all' && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-muted-foreground" onClick={() => { setDateRangePreset('all'); setCustomDateFrom(undefined); setCustomDateTo(undefined); }}>
                <X className="h-3 w-3 mr-1" /> {t('date_range.clear')}
              </Button>
            )}
          </div>
          {/* Custom date range pickers */}
          {dateRangePreset === 'custom' && (
            <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", !customDateFrom && "text-muted-foreground")}>
                    <CalIcon className="h-3.5 w-3.5" />
                    {customDateFrom ? format(customDateFrom, "MMM d, yyyy") : t('date_range.from')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker mode="single" selected={customDateFrom} onSelect={(d) => { setCustomDateFrom(d || undefined); if (d) setDate(d); }} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">→</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", !customDateTo && "text-muted-foreground")}>
                    <CalIcon className="h-3.5 w-3.5" />
                    {customDateTo ? format(customDateTo, "MMM d, yyyy") : t('date_range.to')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker mode="single" selected={customDateTo} onSelect={(d) => { setCustomDateTo(d || undefined); }} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              {effectiveDateRange && (
                <Badge variant="secondary" className="text-px-10">
                  {t('events_in_range', { count: filteredEvents.length })}
                </Badge>
              )}
            </div>
          )}
          {/* Active date range indicator */}
          {effectiveDateRange && dateRangePreset !== 'all' && dateRangePreset !== 'custom' && (
            <div className="px-4 pb-2">
              <Badge variant="secondary" className="text-px-10">
                {format(effectiveDateRange.from, "MMM d")} — {format(effectiveDateRange.to, "MMM d, yyyy")}
              </Badge>
            </div>
          )}
          {/* Source legend */}
          <div className="px-4 pb-3 flex flex-wrap gap-3">
            {Object.entries(UnifiedCalendarService.getSourceColors()).map(([key, color]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {t(`source_label.${key}`, key)}
              </div>
            ))}
          </div>
          {/* View switcher (Month / Week / Day) + navigation */}
          <div className="px-4 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="sm" className="h-7 text-xs px-2"
                onClick={() => {
                  // Predict where Prev will land so we can auto-clear the preset chip.
                  const next = view === Views.MONTH
                    ? add(date, { months: -1 })
                    : view === Views.WEEK
                      ? add(date, { weeks: -1 })
                      : add(date, { days: -1 });
                  clearPresetIfNavigatedAway(next);
                  onNavigate('PREV');
                }}
                aria-label="Previous"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline" size="sm" className="h-7 text-xs px-3"
                onClick={() => {
                  clearPresetIfNavigatedAway(startOfToday());
                  onNavigate('TODAY');
                }}
              >
                {t('today', 'Today')}
              </Button>
              <Button
                variant="outline" size="sm" className="h-7 text-xs px-2"
                onClick={() => {
                  const next = view === Views.MONTH
                    ? add(date, { months: 1 })
                    : view === Views.WEEK
                      ? add(date, { weeks: 1 })
                      : add(date, { days: 1 });
                  clearPresetIfNavigatedAway(next);
                  onNavigate('NEXT');
                }}
                aria-label="Next"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <span className="ml-2 text-xs font-medium text-foreground">
                {view === Views.DAY
                  ? format(date, 'EEEE, MMM d, yyyy')
                  : view === Views.WEEK
                    ? `${format(startOfWeek(date, { weekStartsOn: 1 }), 'MMM d')} — ${format(endOfWeek(date, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                    : format(date, 'MMMM yyyy')}
              </span>
            </div>
            <div className="inline-flex rounded-md border border-border overflow-hidden">
              {[
                { value: Views.MONTH, label: t('view.month', 'Month') },
                { value: Views.WEEK, label: t('view.week', 'Week') },
                { value: Views.DAY, label: t('view.day', 'Day') },
              ].map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setView(v.value as View)}
                  className={cn(
                    "h-7 px-3 text-xs font-medium transition-colors",
                    view === v.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <Tabs value={mode} className="w-full">
            <TabsContent value="calendar" className="m-0">
              {view === "year" ? (
                <YearGrid date={date} onMonthClick={m => { const d = add(startOfToday(), { months: m }); setDate(d); setView(Views.MONTH); }} />
              ) : (
                <div className="h-[70vh] relative">
                  <BigCalendar 
                    localizer={localizer} date={date}
                    onNavigate={d => { clearPresetIfNavigatedAway(d); setDate(d); }}
                    view={view} onView={v => setView(v)} 
                    events={filteredEvents}
                    startAccessor="start" endAccessor="end" 
                    style={{ height: "100%" }} views={views} popup={false} selectable
                    toolbar={false}
                    tooltipAccessor={() => ''}
                    onSelectSlot={(slotInfo: any) => { setDayModalDate(slotInfo.start); setDayModalOpen(true); }}
                    onSelectEvent={(event: CalendarEvent) => { handleEventView(event); }}
                    onShowMore={(_events: CalendarEvent[], date: Date) => { setDayModalDate(date); setDayModalOpen(true); }}
                    eventPropGetter={(event: CalendarEvent) => ({
                      style: {
                        backgroundColor: getEventColor(event),
                        borderColor: getEventColor(event),
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '10px',
                        padding: '0 4px',
                        cursor: 'pointer'
                      }
                    })}
                    showMultiDayTimes={false} dayLayoutAlgorithm="no-overlap" max={2}
                    components={{
                      event: ({ event: ev }: any) => {
                        const sourceLabel = String(t(`source_label.${ev.type}`, ev.type));
                        const priorityLabel = String(t(`priority_label.${ev.priority || 'medium'}`, ev.priority || 'medium'));
                        const statusLabel = String(t(`status_label.${(ev.status || 'scheduled').replace(/ /g, '_')}`, ev.status || 'scheduled'));
                        const md = ev.metadata || {};
                        // When: show the date + time range (or "All day").
                        const sameDay = dayjs(ev.start).isSame(ev.end, 'day');
                        const whenText = ev.allDay
                          ? format(ev.start, 'EEE, MMM d')
                          : sameDay
                            ? `${format(ev.start, 'EEE, MMM d · HH:mm')} – ${format(ev.end, 'HH:mm')}`
                            : `${format(ev.start, 'MMM d, HH:mm')} – ${format(ev.end, 'MMM d, HH:mm')}`;
                        const contact = md.contactName || ev.contactName;
                        const assignee = md.technicianName || md.assignedTo;
                        const reference = md.jobNumber || md.orderNumber || md.offerNumber || md.saleNumber;
                        const amount = md.amount != null
                          ? `${Number(md.amount).toLocaleString()} ${md.currency || ''}`.trim()
                          : null;
                        const duration = md.estimatedDuration ? `${md.estimatedDuration} min` : null;
                        const place = ev.location || md.customerAddress;
                        const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-px-10 text-muted-foreground shrink-0">{label}</span>
                            <span className="text-px-10 font-medium text-popover-foreground text-right break-words">{value}</span>
                          </div>
                        );
                        return (
                          <Tooltip delayDuration={150}>
                            <TooltipTrigger asChild>
                              <div className="w-full h-full text-white text-px-10 px-1 cursor-pointer hover:opacity-90 transition-opacity leading-[18px]">
                                <span className="truncate font-medium text-px-10">{ev.title}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px] p-0 overflow-hidden border shadow-lg">
                              <div className="px-2.5 py-2 border-b border-border" style={{ borderLeft: `3px solid ${ev.color || '#6b7280'}` }}>
                                <p className="font-semibold text-xs text-popover-foreground break-words">{ev.title}</p>
                                <p className="text-px-10 text-muted-foreground mt-0.5">{sourceLabel}</p>
                              </div>
                              <div className="p-2.5 space-y-1">
                                <Row label={t('tooltip.when')} value={whenText} />
                                <Row label={t('tooltip.status')} value={<span className="capitalize">{statusLabel}</span>} />
                                <Row label={t('tooltip.priority')} value={<span className="capitalize">{priorityLabel}</span>} />
                                {reference && <Row label={t('tooltip.reference')} value={reference} />}
                                {contact && <Row label={t('tooltip.contact')} value={contact} />}
                                {assignee && <Row label={t('tooltip.technician')} value={assignee} />}
                                {amount && <Row label={t('tooltip.amount')} value={amount} />}
                                {duration && <Row label={t('tooltip.duration')} value={duration} />}
                                {place && (
                                  <p className="text-px-10 text-muted-foreground break-words pt-1 mt-1 border-t border-border">📍 {place}</p>
                                )}
                                {ev.description && (
                                  <p className="text-px-10 text-muted-foreground break-words pt-1 mt-1 border-t border-border line-clamp-3">{ev.description}</p>
                                )}
                                <p className="text-px-9 text-muted-foreground/70 pt-1 mt-1 border-t border-border italic">{t('tooltip.hint')}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                    }}
                  />
                </div>
              )}
            </TabsContent>
            <TabsContent value="list" className="m-0">
              <EventListView
                startDate={startOfToday()} days={30} events={filteredEvents}
                onEventClick={(ev) => { setSelectedEvent(ev); setViewDialogOpen(true); }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <EventViewDialog
        open={viewDialogOpen} onOpenChange={setViewDialogOpen}
        event={selectedEvent} onEdit={handleEventEdit} onDelete={handleDelete}
      />

      <EventDialog 
        open={dialogOpen && eventTypes.length > 0} onOpenChange={setDialogOpen} 
        initialStart={slotSelection.start} initialEnd={slotSelection.end}
        event={selectedEvent} eventTypes={eventTypes}
        onSave={handleCreate} onUpdate={handleUpdate} onDelete={handleDelete}
        onManageTypes={() => setTypeManagerOpen(true)}
      />

      <DayEventsModal
        open={dayModalOpen} date={dayModalDate}
        events={useMemo(() => {
          if (!dayModalDate) return [];
          return events.filter(ev => dayjs(ev.start).isSame(dayModalDate, 'day'));
        }, [dayModalDate, events])}
        onOpenChange={setDayModalOpen}
        onAddEvent={(d) => {
          setSelectedEvent(null);
          setSlotSelection({ start: d, end: add(d, { hours: 1 }) });
          setDayModalOpen(false);
          setDialogOpen(true);
        }}
        onEventClick={(ev) => { setSelectedEvent(ev); setDayModalOpen(false); setViewDialogOpen(true); }}
        eventTypesLoaded={eventTypes.length > 0}
      />

      <EventTypeManager
        open={typeManagerOpen} onOpenChange={setTypeManagerOpen}
        eventTypes={eventTypes}
        onEventTypesChange={(newTypes) => {
          const lookupTypes = newTypes.map(type => ({ id: type.id, name: type.name, color: type.color, isDefault: type.isDefault, isActive: true }));
          updateEventTypes(lookupTypes);
        }}
      />
    </div>
  );
}
