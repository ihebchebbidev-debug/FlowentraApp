import { useTranslation } from "react-i18next";
import { ContentSkeleton, TableSkeleton } from "@/components/ui/page-skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LazyListItem } from "@/shared/components/LazyComponents";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, isSameDay, addMonths, subMonths } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useState } from "react";
import { Filter, Loader2, ClipboardList, Briefcase, Calendar, MapPin, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useReportsCalendarData } from "./hooks/useReportsCalendarData";
import { useFieldReportsKpi } from "./hooks/useFieldReportsKpi";
import { useServiceOrdersList } from "./hooks/useServiceOrdersList";

export default function Reports() {
  const { t, i18n } = useTranslation('field');
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const [displayedMonth, setDisplayedMonth] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dispatches: true,
    absences: false,
    holidays: false
  });
  const currentDate = new Date();
  
  // Use the real data hooks
  const {
    dispatches,
    getDispatchesForDate,
    monthSummary,
    isLoading: isCalendarLoading,
  } = useReportsCalendarData(displayedMonth);
  
  // Use field KPI data
  const kpiData = useFieldReportsKpi();
  
  // Use service orders list with pagination
  const {
    serviceOrders,
    totalCount,
    currentPage,
    totalPages,
    isLoading: isServiceOrdersLoading,
    filters: soFilters,
    goToNextPage,
    goToPrevPage,
    updateFilters,
    clearFilters,
  } = useServiceOrdersList(6);

  // Local search state
  const [searchInput, setSearchInput] = useState('');
  
  // Generate calendar days for displayed month
  const monthStart = startOfMonth(displayedMonth);
  const monthEnd = endOfMonth(displayedMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days for complete weeks
  const startDay = getDay(monthStart);
  const paddingStart = Array.from({ length: startDay }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startDay - i));
    return date;
  });

  const endDay = getDay(monthEnd);
  const paddingEnd = Array.from({ length: 6 - endDay }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const allCalendarDays = [...paddingStart, ...monthDays, ...paddingEnd];

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === displayedMonth.getMonth() && date.getFullYear() === displayedMonth.getFullYear();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setDisplayedMonth(prev => 
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const displayedMonthName = format(displayedMonth, 'MMMM yyyy', { locale: dateLocale });
  
  // Helper to get status color for badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'closed':
      case 'invoiced':
        return 'bg-success/20 text-success border-success/30';
      case 'in_progress': 
        return 'bg-warning/20 text-warning border-warning/30';
      case 'assigned':
      case 'scheduled':
      case 'ready_for_planning':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'pending':
      case 'draft':
        return 'bg-muted text-muted-foreground border-muted';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'on_hold':
        return 'bg-warning/10 text-warning border-warning/20';
      default: 
        return 'bg-muted text-muted-foreground border-muted';
    }
  };
  
  // Helper to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-primary text-primary-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleSearch = () => {
    updateFilters({ search: searchInput || undefined });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background min-h-screen">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Service Orders */}
        <LazyListItem placeholder={<div className="h-[72px] rounded-xl bg-primary/5 animate-pulse" />}>
          <Card className="cursor-pointer group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 h-[72px]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('reports.serviceOrders')}</span>
              </div>
              {kpiData.isLoading ? (
                <div className="h-5 w-12 bg-primary/10 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-foreground">{kpiData.totalServiceOrders || '-'}</p>
              )}
            </CardContent>
          </Card>
        </LazyListItem>

        {/* Jobs */}
        <LazyListItem placeholder={<div className="h-[72px] rounded-xl bg-primary/5 animate-pulse" />}>
          <Card className="cursor-pointer group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 h-[72px]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('reports.jobs')}</span>
              </div>
              {kpiData.isLoading ? (
                <div className="h-5 w-12 bg-primary/10 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-foreground">{kpiData.totalJobs || '-'}</p>
              )}
            </CardContent>
          </Card>
        </LazyListItem>

        {/* Dispatches */}
        <LazyListItem placeholder={<div className="h-[72px] rounded-xl bg-primary/5 animate-pulse" />}>
          <Card className="cursor-pointer group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 h-[72px]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('reports.dispatches')}</span>
              </div>
              {kpiData.isLoading ? (
                <div className="h-5 w-12 bg-primary/10 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-foreground">{kpiData.totalDispatches || '-'}</p>
              )}
            </CardContent>
          </Card>
        </LazyListItem>

        {/* Installations */}
        <LazyListItem placeholder={<div className="h-[72px] rounded-xl bg-primary/5 animate-pulse" />}>
          <Card className="cursor-pointer group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 h-[72px]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('reports.installations')}</span>
              </div>
              {kpiData.isLoading ? (
                <div className="h-5 w-12 bg-primary/10 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-foreground">{kpiData.totalInstallations || '-'}</p>
              )}
            </CardContent>
          </Card>
        </LazyListItem>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="service-orders">
        <TabsList className="grid w-full grid-cols-2 gap-1">
          <TabsTrigger value="service-orders" className="text-xs sm:text-sm">{t('reports.tabs.serviceOrders')}</TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs sm:text-sm">{t('reports.tabs.dispatchCalendar')}</TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-3">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">{displayedMonthName}</h4>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  
                     
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 border rounded-lg p-4">
                      {/* Week headers */}
                      {[
                        { key: 'sun', default: 'Sun' },
                        { key: 'mon', default: 'Mon' },
                        { key: 'tue', default: 'Tue' },
                        { key: 'wed', default: 'Wed' },
                        { key: 'thu', default: 'Thu' },
                        { key: 'fri', default: 'Fri' },
                        { key: 'sat', default: 'Sat' }
                      ].map(day => (
                        <div key={day.key} className="p-2 text-center text-xs font-medium text-muted-foreground border-b">
                          {t(`reports.weekdays.${day.key}`)}
                        </div>
                      ))}
                      
                      {/* Calendar days with dispatch counts */}
                      {allCalendarDays.map((date, index) => {
                        const dayNumber = date.getDate();
                        const isInCurrentMonth = isCurrentMonth(date);
                        const dayDispatches = isInCurrentMonth ? getDispatchesForDate(date) : [];
                        const dispatchCount = dayDispatches.length;
                        const isToday = isSameDay(date, currentDate);
                        
                        return (
                          <div key={index} className={`min-h-[60px] p-2 border rounded-sm cursor-pointer transition-colors
                            ${isInCurrentMonth ? 'bg-card hover:bg-muted/50' : 'bg-muted/20 text-muted-foreground'}
                            ${isToday ? 'ring-2 ring-primary bg-primary/5' : ''}
                          `}>
                            <div className="flex flex-col h-full">
                              <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : ''}`}>
                                {isInCurrentMonth ? dayNumber : ''}
                              </span>
                              {dispatchCount > 0 && (
                                <div className="flex-1 mt-1">
                                  <div className={`text-xs px-1 py-0.5 rounded ${
                                    dayDispatches.some(d => d.status === 'completed') 
                                      ? 'bg-success/20 text-success' 
                                      : dayDispatches.some(d => d.status === 'in_progress')
                                        ? 'bg-warning/20 text-warning'
                                        : 'bg-primary/20 text-primary'
                                  }`}>
                                    {dispatchCount} {dispatchCount !== 1 ? t('reports.calendar.dispatches') : t('reports.calendar.dispatch')}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                 
                {/* Summary Sidebar */}
                <div className="space-y-4">
                  <Card className="shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{format(displayedMonth, 'MMMM', { locale: dateLocale })} {t('reports.calendar.summary')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {isCalendarLoading ? (
                        <ContentSkeleton rows={4} className="p-0" />
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{t('reports.status.total')}</span>
                            <span className="font-semibold">{monthSummary.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{t('reports.status.completed')}</span>
                            <span className="font-semibold text-success">{monthSummary.completed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{t('reports.status.inProgress')}</span>
                            <span className="font-semibold text-warning">{monthSummary.inProgress}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{t('reports.status.scheduled')}</span>
                            <span className="font-semibold text-primary">{monthSummary.scheduled}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{t('reports.status.pending')}</span>
                            <span className="font-semibold text-muted-foreground">{monthSummary.pending}</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Orders Tab */}
        <TabsContent value="service-orders" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Search Input - Left */}
                <div className="relative flex-1 sm:w-64 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('reports.filters.searchOrders')}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="pl-9 pr-8"
                  />
                  {searchInput && (
                    <button
                      onClick={() => {
                        setSearchInput('');
                        updateFilters({ search: undefined });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>

                {/* Filters - Right */}
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={soFilters.status || 'all'}
                    onValueChange={(v) => updateFilters({ status: v === 'all' ? undefined : v })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder={t('reports.table.status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('reports.filters.allStatus')}</SelectItem>
                      <SelectItem value="draft">{t('reports.status.draft')}</SelectItem>
                      <SelectItem value="ready_for_planning">{t('reports.status.ready')}</SelectItem>
                      <SelectItem value="scheduled">{t('reports.status.scheduled')}</SelectItem>
                      <SelectItem value="in_progress">{t('reports.status.inProgress')}</SelectItem>
                      <SelectItem value="completed">{t('reports.status.completed')}</SelectItem>
                      <SelectItem value="on_hold">{t('reports.status.onHold')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={soFilters.priority || 'all'}
                    onValueChange={(v) => updateFilters({ priority: v === 'all' ? undefined : v })}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder={t('reports.table.priority')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('reports.priority.all')}</SelectItem>
                      <SelectItem value="urgent">{t('reports.priority.urgent')}</SelectItem>
                      <SelectItem value="high">{t('reports.priority.high')}</SelectItem>
                      <SelectItem value="medium">{t('reports.priority.medium')}</SelectItem>
                      <SelectItem value="low">{t('reports.priority.low')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {(soFilters.status || soFilters.priority || soFilters.search) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      {t('reports.filters.clear')}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isServiceOrdersLoading ? (
                <TableSkeleton rows={5} cols={4} />
              ) : serviceOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('reports.empty.noServiceOrders')}</p>
                  {(soFilters.status || soFilters.priority || soFilters.search) && (
                    <Button variant="link" onClick={clearFilters} className="mt-2">
                      {t('reports.filters.clearFilters')}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Service Orders Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.table.orderNumber')}</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.table.customer')}</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.table.status')}</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.table.priority')}</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.table.targetDate')}</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.table.createdBy')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {serviceOrders.map((so) => (
                          <tr 
                            key={so.id} 
                            className="hover:bg-muted/50 cursor-pointer transition-colors group"
                          >
                            <td className="py-3 px-3">
                              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {so.orderNumber}
                              </p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm text-foreground">
                                {so.contactName}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <Badge variant="outline" className={`text-xs ${getStatusColor(so.status)}`}>
                                {t(`reports.status.${so.status.replace(/_/g, '')}`, { defaultValue: so.status.replace(/_/g, ' ') })}
                              </Badge>
                            </td>
                            <td className="py-3 px-3">
                              <Badge className={`text-xs ${getPriorityColor(so.priority)}`}>
                                {t(`reports.priority.${so.priority}`, { defaultValue: so.priority })}
                              </Badge>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm text-muted-foreground">
                                {so.targetCompletionDate 
                                  ? format(new Date(so.targetCompletionDate), 'MMM d, yyyy', { locale: dateLocale })
                                  : '-'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm text-muted-foreground">
                                {so.createdBy || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {t('reports.pagination.page')} {currentPage} {t('reports.pagination.of')} {totalPages} • {t('reports.pagination.showing')} {serviceOrders.length} {t('reports.pagination.of')} {totalCount}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {t('reports.pagination.previous')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                        >
                          {t('reports.pagination.next')}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
