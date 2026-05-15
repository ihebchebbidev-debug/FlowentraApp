import { useState, useMemo } from "react";
import { format, isSameDay, isWeekend, getDay, startOfWeek, addDays } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { CalendarDays, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStatusSolidClasses } from "@/config/entity-statuses";
import type { Technician, Job, DragData, ServiceOrder, InstallationGroup } from "../../types";
import type { TechnicianAvailability, DayScheduleInfo } from "./types";
import type { TechnicianLeave } from "./CustomCalendar";
import { OverviewTimePickerModal } from "./OverviewTimePickerModal";

interface OverviewCalendarGridProps {
  dates: Date[];
  technicians: Technician[];
  assignedJobs: Record<string, Job[]>;
  leaves?: TechnicianLeave[];
  availability?: TechnicianAvailability[];
  includeWeekends: boolean;
  onDrop: (e: React.DragEvent, technicianId: string, date: Date, hour: number) => void;
  onJobClick: (job: Job) => void;
}

export function OverviewCalendarGrid({
  dates,
  technicians,
  assignedJobs,
  leaves = [],
  availability = [],
  includeWeekends,
  onDrop,
  onJobClick,
}: OverviewCalendarGridProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;

  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{
    technicianId: string;
    date: Date;
    dataText: string;
  } | null>(null);
  const [pendingDropInfo, setPendingDropInfo] = useState<{
    technicianName: string;
    jobTitle: string;
    date: Date;
  } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [expandedCell, setExpandedCell] = useState<string | null>(null);

  const getJobsForDate = (technicianId: string, date: Date) => {
    const key = `${technicianId}-${format(date, 'yyyy-MM-dd')}`;
    return assignedJobs[key] || [];
  };

  const isOnLeave = (technicianId: string, date: Date) => {
    return leaves.some(
      leave =>
        leave.technicianId === technicianId &&
        leave.status === 'approved' &&
        date >= leave.startDate &&
        date <= leave.endDate
    );
  };

  const isDayOff = (technicianId: string, date: Date) => {
    const avail = availability.find(a => a.technicianId === technicianId);
    if (!avail || !avail.daySchedules) return false;
    const dayOfWeek = getDay(date);
    const schedule = avail.daySchedules[dayOfWeek] as DayScheduleInfo | undefined;
    return schedule ? !schedule.enabled || schedule.fullDayOff : false;
  };

  const getTechSummaryForDate = (date: Date) => {
    return technicians.map(tech => {
      const jobs = getJobsForDate(tech.id, date);
      const onLeave = isOnLeave(tech.id, date);
      const dayOff = isDayOff(tech.id, date);
      return { tech, jobs, onLeave, dayOff, hasActivity: jobs.length > 0 || onLeave };
    });
  };

  const handleDragOver = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(cellKey);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.overview-drop-cell')) {
      setDragOverCell(null);
    }
  };

  const handleCellDrop = (e: React.DragEvent, technicianId: string, date: Date) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCell(null);

    const dataText = e.dataTransfer.getData('application/json');
    if (!dataText) return;

    try {
      const data: DragData = JSON.parse(dataText);
      const tech = technicians.find(t => t.id === technicianId);
      const techName = tech ? `${tech.firstName} ${tech.lastName}` : t('dispatcher.unknown');

      let jobTitle = '';
      if (data.type === 'job') {
        jobTitle = (data.item as Job).title;
      } else if (data.type === 'serviceOrder') {
        jobTitle = (data.item as ServiceOrder).title || `SO #${(data.item as ServiceOrder).id}`;
      } else if (data.type === 'installationGroup') {
        const group = data.item as InstallationGroup;
        jobTitle = `${group.installationName} (${group.jobs.length} jobs)`;
      }

      setPendingDrop({ technicianId, date, dataText });
      setPendingDropInfo({ technicianName: techName, jobTitle, date });
      setTimePickerOpen(true);
    } catch (err) {
      console.error('Failed to parse drop data:', err);
    }
  };

  const handleTimeConfirm = (hour: number, minute: number) => {
    if (!pendingDrop) return;

    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      dataTransfer: {
        getData: () => pendingDrop.dataText,
      },
    } as unknown as React.DragEvent;

    const dropDate = new Date(pendingDrop.date);
    dropDate.setMinutes(minute);

    onDrop(syntheticEvent, pendingDrop.technicianId, dropDate, hour);

    setTimePickerOpen(false);
    setPendingDrop(null);
    setPendingDropInfo(null);
  };

  const weekRows = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < dates.length; i += 7) {
      rows.push(dates.slice(i, Math.min(i + 7, dates.length)));
    }
    return rows;
  }, [dates]);

  const dayNames = useMemo(() => {
    const base = startOfWeek(dates[0], { locale: dateLocale });
    return Array.from({ length: 7 }, (_, i) => format(addDays(base, i), 'EEE', { locale: dateLocale }));
  }, [dates, dateLocale]);

  return (
    <TooltipProvider>
      <ScrollArea className="flex-1 bg-muted/30">
        <div className="p-3">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-px mb-px rounded-t-lg overflow-hidden bg-border">
            {dayNames.map((name, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground py-2 bg-card font-medium uppercase tracking-wider">
                {name}
              </div>
            ))}
          </div>

          {/* Calendar weeks */}
          <div className="bg-border rounded-b-lg overflow-hidden">
            {weekRows.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-px">
                {week.map((date) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const isToday = isSameDay(date, new Date());
                  const weekend = isWeekend(date);
                  const weekendDisabled = weekend && !includeWeekends;
                  const techSummaries = getTechSummaryForDate(date);
                  const totalJobs = techSummaries.reduce((sum, s) => sum + s.jobs.length, 0);
                  const techsOnLeave = techSummaries.filter(s => s.onLeave);
                  const isExpanded = expandedCell === dateKey;

                  return (
                    <div
                      key={dateKey}
                      className={`overview-drop-cell min-h-[110px] p-2 relative transition-all cursor-pointer
                        ${weekendDisabled ? 'bg-muted' : 'bg-card'}
                        ${isToday ? 'bg-primary/5' : ''}
                        ${dragOverCell === dateKey ? 'bg-accent' : ''}
                        hover:bg-accent/40
                      `}
                      onClick={() => setExpandedCell(isExpanded ? null : dateKey)}
                      onDragOver={(e) => handleDragOver(e, dateKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => {
                        if (!weekendDisabled && technicians.length > 0) {
                          handleCellDrop(e, technicians[0].id, date);
                        }
                      }}
                    >
                      {/* Date header */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm leading-none ${
                            isToday
                              ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-medium'
                              : weekend
                                ? 'text-muted-foreground'
                                : 'text-foreground'
                          }`}
                        >
                          {format(date, 'd')}
                        </span>
                        {totalJobs > 0 && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-card border-border">
                            {totalJobs} {totalJobs === 1 ? t('dispatcher.job') : t('dispatcher.jobs')}
                          </Badge>
                        )}
                      </div>

                      {/* Technician avatar row */}
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {techSummaries.map(({ tech, jobs, onLeave: techOnLeave, dayOff }) => {
                          if (jobs.length === 0 && !techOnLeave && !dayOff) return null;

                          return (
                            <Tooltip key={tech.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className="relative flex-shrink-0"
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.dataTransfer.dropEffect = 'move';
                                    setDragOverCell(`${tech.id}-${dateKey}`);
                                  }}
                                  onDrop={(e) => {
                                    e.stopPropagation();
                                    if (!techOnLeave && !dayOff) {
                                      handleCellDrop(e, tech.id, date);
                                    }
                                  }}
                                >
                                  <UserAvatar
                                    src={tech.avatar}
                                    name={`${tech.firstName} ${tech.lastName}`}
                                    seed={tech.id}
                                    size="sm"
                                    className={`!h-7 !w-7 !rounded-full ring-2 shadow-sm ${
                                      techOnLeave
                                        ? 'ring-warning opacity-60 grayscale-[40%]'
                                        : jobs.length > 0
                                          ? 'ring-primary/60'
                                          : 'ring-border'
                                    }`}
                                  />
                                  {jobs.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] rounded-full w-4 h-4 flex items-center justify-center leading-none shadow-sm font-medium">
                                      {jobs.length}
                                    </span>
                                  )}
                                  {techOnLeave && (
                                    <span className="absolute -bottom-0.5 -right-0.5 bg-warning text-warning-foreground rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-sm">
                                      <CalendarDays className="h-2 w-2" />
                                    </span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs bg-popover border shadow-lg z-50">
                                <div className="space-y-1.5 text-xs">
                                  <div className="font-medium text-foreground">{tech.firstName} {tech.lastName}</div>
                                  {techOnLeave && <div className="text-warning">{t('dispatcher.on_leave')}</div>}
                                  {dayOff && <div className="text-muted-foreground">{t('dispatcher.day_off')}</div>}
                                  {jobs.length > 0 && (
                                    <div className="text-muted-foreground">
                                      {jobs.length} {jobs.length === 1 ? t('dispatcher.job') : t('dispatcher.jobs')}
                                    </div>
                                  )}
                                  {jobs.map(job => (
                                    <div key={job.id} className="text-muted-foreground truncate">
                                      • {job.title}
                                      {job.scheduledStart && ` (${format(new Date(job.scheduledStart), 'HH:mm')})`}
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>

                      {/* On-leave summary (when not expanded) */}
                      {!isExpanded && techsOnLeave.length > 0 && (
                        <div className="text-[10px] text-warning flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {techsOnLeave.length} {t('dispatcher.on_leave').toLowerCase()}
                          </span>
                        </div>
                      )}

                      {/* Expanded detail view */}
                      {isExpanded && (
                        <div className="mt-1.5 space-y-1.5 border-t border-border pt-1.5">
                          {techSummaries.filter(s => s.jobs.length > 0).map(({ tech, jobs }) => (
                            <div key={tech.id} className="space-y-0.5">
                              <div className="text-[10px] text-muted-foreground truncate font-medium">
                                {tech.firstName} {tech.lastName}
                              </div>
                              {jobs.map(job => {
                                const statusClasses = getStatusSolidClasses('dispatch', job.status || 'pending');
                                return (
                                  <div
                                    key={job.id}
                                    className={`${statusClasses} rounded px-1.5 py-0.5 text-[9px] leading-tight cursor-pointer truncate hover:opacity-80 transition-opacity`}
                                    onClick={(e) => { e.stopPropagation(); onJobClick(job); }}
                                  >
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                                      {job.scheduledStart && <span>{format(new Date(job.scheduledStart), 'HH:mm')}</span>}
                                      <span className="truncate">{job.title}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                          {techsOnLeave.map(({ tech }) => (
                            <div key={`leave-${tech.id}`} className="flex items-center gap-1 text-[10px] text-warning">
                              <CalendarDays className="h-2.5 w-2.5" />
                              <span className="truncate">{tech.firstName} - {t('dispatcher.on_leave')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Drop overlay */}
                      {dragOverCell === dateKey && !weekendDisabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded pointer-events-none z-10">
                          <span className="text-xs font-medium text-primary bg-card/90 px-2 py-1 rounded shadow-sm">
                            {t('dispatcher.drop_here')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Fill remaining columns */}
                {week.length < 7 &&
                  Array.from({ length: 7 - week.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[110px] bg-muted/50" />
                  ))
                }
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Time Picker Modal */}
      <OverviewTimePickerModal
        open={timePickerOpen}
        onOpenChange={(open) => {
          setTimePickerOpen(open);
          if (!open) {
            setPendingDrop(null);
            setPendingDropInfo(null);
          }
        }}
        date={pendingDropInfo?.date || null}
        technicianName={pendingDropInfo?.technicianName || ''}
        jobTitle={pendingDropInfo?.jobTitle || ''}
        onConfirm={handleTimeConfirm}
      />
    </TooltipProvider>
  );
}
