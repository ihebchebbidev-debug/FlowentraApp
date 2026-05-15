import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Search, RefreshCcw, Loader2, MapPin, Clock, Users, LayoutGrid, List, Settings2 } from 'lucide-react';
import { ProviderIcon } from './ProviderIcon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import type { ConnectedAccount } from '../types';
import type { SyncedCalendarEventDto } from '@/services/api/emailAccountsApi';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarEventDetailDialog } from './CalendarEventDetailDialog';

interface CalendarSettingsTabProps {
  accounts: ConnectedAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string) => void;
  // Calendar sync props
  calendarEvents: SyncedCalendarEventDto[];
  calendarEventsTotalCount: number;
  calendarEventsLoading: boolean;
  calendarSyncing: boolean;
  onSyncCalendar: (accountId: string, maxResults?: number) => Promise<any>;
  onFetchCalendarEvents: (accountId: string, page?: number, pageSize?: number, search?: string) => Promise<any>;
  onStartCalendarAutoSync: (accountId: string) => void;
  onStopCalendarAutoSync: () => void;
}

export function CalendarSettingsTab({
  accounts,
  selectedAccountId,
  onSelectAccount,
  calendarEvents,
  calendarEventsTotalCount,
  calendarEventsLoading,
  calendarSyncing,
  onSyncCalendar,
  onFetchCalendarEvents,
  onStartCalendarAutoSync,
  onStopCalendarAutoSync,
}: CalendarSettingsTabProps) {
  const { t } = useTranslation('email-calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<SyncedCalendarEventDto | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  // Initial sync + fetch on account selection
  useEffect(() => {
    if (selectedAccount && !initialSyncDone) {
      const doInitialSync = async () => {
        try {
          await onSyncCalendar(selectedAccount.id);
        } catch {
          // Sync failed, still try to fetch cached events
        }
        await onFetchCalendarEvents(selectedAccount.id, 1, 25);
        setInitialSyncDone(true);
        onStartCalendarAutoSync(selectedAccount.id);
      };
      doInitialSync();
    }
    return () => onStopCalendarAutoSync();
  }, [selectedAccount?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when search or page changes
  useEffect(() => {
    if (selectedAccount && initialSyncDone) {
      const timeout = setTimeout(() => {
        onFetchCalendarEvents(selectedAccount.id, currentPage, 25, searchQuery || undefined);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSync = useCallback(async () => {
    if (!selectedAccount) return;
    try {
      await onSyncCalendar(selectedAccount.id);
      await onFetchCalendarEvents(selectedAccount.id, currentPage, 25, searchQuery || undefined);
    } catch {
      // Error handled in hook
    }
  }, [selectedAccount, currentPage, searchQuery, onSyncCalendar, onFetchCalendarEvents]);

  const handleEventClick = useCallback((event: SyncedCalendarEventDto) => {
    setSelectedEvent(event);
    setEventDetailOpen(true);
  }, []);

  const navigate = useNavigate();

  if (accounts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">{t('calendar.events.noAccountTitle')}</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">{t('calendar.events.noAccountDescription')}</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate('/dashboard/settings', { state: { tab: 'integrations' } })}
          >
            <Settings2 className="h-4 w-4" />
            {t('calendar.events.goToIntegrations')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(calendarEventsTotalCount / 25);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return t('calendar.events.today');
    if (isTomorrow(date)) return t('calendar.events.tomorrow');
    if (isThisWeek(date)) return t('calendar.events.thisWeek');
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="space-y-6">
      {/* Account selector — always visible */}
      <div className="flex items-center gap-2">
        {accounts.length === 1 ? (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/60 bg-background shadow-sm text-sm">
            <div className="h-7 w-7 rounded-md bg-background border border-border/60 flex items-center justify-center shadow-sm">
              <ProviderIcon provider={selectedAccount?.provider || ''} className="h-4 w-4" />
            </div>
            <span className="font-medium text-foreground">{selectedAccount?.handle}</span>
          </div>
        ) : (
          <Select value={selectedAccount?.id} onValueChange={(id) => { onSelectAccount(id); setInitialSyncDone(false); setCurrentPage(1); setSearchQuery(''); }}>
            <SelectTrigger className="w-80 bg-background shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-md bg-background border border-border/60 flex items-center justify-center">
                      <ProviderIcon provider={a.provider} className="h-3.5 w-3.5" />
                    </div>
                    <span>{a.handle}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedAccount && (
        <>
          {/* Events List */}
          {!initialSyncDone ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-36 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                    <div className="h-3 w-52 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-16 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                    <div className="h-8 w-56 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                    <div className="h-8 w-20 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 py-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border/40">
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <div className="h-3 w-8 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                        <div className="h-5 w-5 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-44 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-24 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40" />
                          <div className="h-3 w-20 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {t('calendar.events.title')}
                      {calendarEventsTotalCount > 0 && (
                        <Badge variant="secondary" className="text-xs ml-1">{calendarEventsTotalCount}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">{t('calendar.events.description')}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* View toggle */}
                  <div className="flex items-center border border-border/40 rounded-md overflow-hidden">
                    <button
                      className={cn(
                        "p-1.5 transition-colors",
                        viewMode === 'calendar' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setViewMode('calendar')}
                      title={t('calendarView.monthView')}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className={cn(
                        "p-1.5 transition-colors",
                        viewMode === 'list' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setViewMode('list')}
                      title={t('calendarView.listView')}
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="relative w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder={t('calendar.events.searchPlaceholder')}
                      className="pl-8 h-8"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8"
                    onClick={handleManualSync}
                    disabled={calendarSyncing}
                  >
                    {calendarSyncing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-3.5 w-3.5" />
                    )}
                    {t('emails.inbox.sync')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Loading skeleton */}
              {(calendarEventsLoading && calendarEvents.length === 0) ? (
                <div className="space-y-3 py-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border/40">
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <div className="h-3 w-8 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                        <div className="h-5 w-5 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-44 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-24 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40" />
                          <div className="h-3 w-20 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : calendarEvents.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-muted/50 mb-3">
                    <CalendarDays className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{t('calendar.events.noEvents')}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">{t('calendar.events.noEventsDescription')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={handleManualSync}
                    disabled={calendarSyncing}
                  >
                    {calendarSyncing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-3.5 w-3.5" />
                    )}
                    {t('emails.inbox.syncNow')}
                  </Button>
                </div>
              ) : viewMode === 'calendar' ? (
                /* Calendar month view */
                <CalendarMonthView events={calendarEvents} onEventClick={handleEventClick} />
              ) : (
                /* Events list */
                <div className="divide-y divide-border/30">
                  {calendarEvents.map((event) => {
                    const startDate = new Date(event.startTime);
                    const endDate = new Date(event.endTime);
                    const attendeeCount = event.attendees ? JSON.parse(event.attendees).length : 0;

                    return (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="flex items-start gap-4 px-3 py-3 hover:bg-foreground/[0.02] transition-colors cursor-pointer"
                      >
                        {/* Date indicator */}
                        <div className="flex flex-col items-center min-w-[48px] pt-0.5">
                          <span className="text-xs text-muted-foreground uppercase">{format(startDate, 'MMM')}</span>
                          <span className="text-lg font-semibold text-foreground leading-tight">{format(startDate, 'd')}</span>
                        </div>

                        {/* Event details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">{event.title || t('eventDetail.noTitle')}</span>
                            {event.isAllDay && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t('calendar.events.allDay')}</Badge>
                            )}
                            {event.status === 'cancelled' && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{t('eventDetail.cancelled')}</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {!event.isAllDay && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(startDate, 'HH:mm')} – {format(endDate, 'HH:mm')}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </span>
                            )}
                            {attendeeCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {attendeeCount}
                              </span>
                            )}
                          </div>

                          {event.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                              {event.description}
                            </p>
                          )}
                        </div>

                        {/* Date label */}
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {getDateLabel(event.startTime)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination (list view only) */}
              {viewMode === 'list' && totalPages > 1 && (
                <div className="flex items-center justify-between px-3 pt-3 border-t border-border/40 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {t('emails.inbox.page')} {currentPage} / {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      {t('emails.inbox.previous')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      {t('emails.inbox.next')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Auto-sync indicator */}
              {selectedAccount.lastSyncedAt && (
                <div className="px-3 pt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCcw className="h-3 w-3" />
                  {t('emails.inbox.autoSync')}
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </>
      )}

      {/* Event Detail Dialog */}
      <CalendarEventDetailDialog
        open={eventDetailOpen}
        onOpenChange={setEventDetailOpen}
        event={selectedEvent}
      />
    </div>
  );
}
