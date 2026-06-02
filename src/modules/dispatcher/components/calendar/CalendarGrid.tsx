import { format, isSameDay, differenceInMinutes, startOfDay, isWeekend, getDay } from "date-fns";
import type { Technician, Job } from "../../types";
import type { ZoomDimensions, TechnicianAvailability, DayScheduleInfo } from "./types";
import { ResizableJobBlock } from "./ResizableJobBlock";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import { CalendarDays, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { assignLanes as computeLanes } from "../../utils/lanes";

// Leave data structure matching CustomCalendar export
interface TechnicianLeave {
  id: number;
  technicianId: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  status: string;
  reason?: string;
}

interface CalendarGridProps {
  dates: Date[];
  technicians: Technician[];
  workingHours: number[];
  assignedJobs: Record<string, Job[]>;
  leaves?: TechnicianLeave[];
  availability?: TechnicianAvailability[];
  dimensions: ZoomDimensions;
  dragOverSlot: { technicianId: string; date: Date; hour: number } | null;
  onDragOver: (e: React.DragEvent, technicianId: string, date: Date, hour: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, technicianId: string, date: Date, hour: number) => void;
  onJobResize: (jobId: string, newEnd: Date) => void;
  onJobClick: (job: Job) => void;
  includeWeekends: boolean;
}

export function CalendarGrid({
  dates,
  technicians,
  workingHours,
  assignedJobs,
  leaves = [],
  availability = [],
  dimensions,
  dragOverSlot,
  onDragOver,
  onDragLeave,
  onDrop,
  onJobResize,
  onJobClick,
  onPreviewResize,
  includeWeekends
}: CalendarGridProps & { onPreviewResize?: (jobId: string, newEnd: Date) => void }) {
  const { t } = useTranslation();
  const { dateWidth, hourWidth, widthMode } = dimensions;

  const getJobsForDate = (technicianId: string, date: Date) => {
    const key = `${technicianId}-${format(date, 'yyyy-MM-dd')}`;
    const jobs = assignedJobs[key] || [];
    const seen = new Set<string>();
    return jobs.filter(job => {
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });
  };

  // Use shared lane util (also used by CustomCalendar to compute row heights)
  const assignLanes = computeLanes;

  // Max lanes across all visible dates for a technician (drives row height)
  const getMaxLanesForTechnician = (technicianId: string): number => {
    let max = 1;
    for (const date of dates) {
      const jobs = getJobsForDate(technicianId, date);
      if (jobs.length === 0) continue;
      const used = assignLanes(jobs).reduce((m, l) => Math.max(m, l.lane + 1), 1);
      if (used > max) max = used;
    }
    return max;
  };



  // Calculate workload utilization for a technician on a specific date
  const getWorkloadLevel = (technicianId: string, date: Date): 'light' | 'normal' | 'heavy' | 'overloaded' | null => {
    const { isWorkingDay, daySchedule } = getAvailabilityForDate(technicianId, date);
    if (!isWorkingDay) return null;
    
    const dayJobs = getJobsForDate(technicianId, date);
    if (dayJobs.length === 0) return 'light';
    
    // Calculate total scheduled minutes
    const totalScheduledMinutes = dayJobs.reduce((total, job) => {
      if (job.scheduledStart && job.scheduledEnd) {
        return total + differenceInMinutes(job.scheduledEnd, job.scheduledStart);
      }
      return total + (job.estimatedDuration || 60);
    }, 0);
    
    // Calculate available working minutes
    let availableMinutes = workingHours.length * 60; // default
    if (daySchedule) {
      const [startH] = daySchedule.startTime.split(':').map(Number);
      const [endH] = daySchedule.endTime.split(':').map(Number);
      availableMinutes = (endH - startH) * 60;
    }
    
    const utilization = availableMinutes > 0 ? totalScheduledMinutes / availableMinutes : 0;
    
    if (utilization <= 0.3) return 'light';
    if (utilization <= 0.7) return 'normal';
    if (utilization <= 1.0) return 'heavy';
    return 'overloaded';
  };

  // Get heatmap CSS classes for workload level — stronger colors for visibility
  const getHeatmapClasses = (level: 'light' | 'normal' | 'heavy' | 'overloaded' | null): string => {
    switch (level) {
      case 'light': return 'bg-success/10';
      case 'normal': return 'bg-warning/15';
      case 'heavy': return 'bg-warning/25';
      case 'overloaded': return 'bg-destructive/20';
      default: return '';
    }
  };

  // Get heatmap indicator dot color
  const getHeatmapDotColor = (level: 'light' | 'normal' | 'heavy' | 'overloaded' | null): string => {
    switch (level) {
      case 'light': return 'bg-success';
      case 'normal': return 'bg-warning';
      case 'heavy': return 'bg-orange-500';
      case 'overloaded': return 'bg-destructive animate-pulse';
      default: return '';
    }
  };

  // Get workload label for accessibility
  const getWorkloadLabel = (level: 'light' | 'normal' | 'heavy' | 'overloaded' | null): string => {
    switch (level) {
      case 'light': return t('dispatcher.workload.light', 'Light');
      case 'normal': return t('dispatcher.workload.normal', 'Normal');
      case 'heavy': return t('dispatcher.workload.heavy', 'Heavy');
      case 'overloaded': return t('dispatcher.workload.overloaded', 'Overloaded');
      default: return '';
    }
  };

  // Check if a technician has leave on a specific date
  const getLeaveForDate = (technicianId: string, date: Date): TechnicianLeave | undefined => {
    const dateStart = startOfDay(date);
    return leaves.find(leave => {
      if (leave.technicianId !== technicianId) return false;
      const leaveStart = startOfDay(leave.startDate);
      const leaveEnd = startOfDay(leave.endDate);
      // Check if date falls within leave range (inclusive)
      return dateStart >= leaveStart && dateStart <= leaveEnd;
    });
  };

  // Get technician availability/schedule for a specific date
  const getAvailabilityForDate = (technicianId: string, date: Date): { 
    isWorkingDay: boolean; 
    daySchedule: DayScheduleInfo | null;
    status: string;
    scheduleNote?: string;
  } => {
    const techAvail = availability.find(a => a.technicianId === technicianId);
    if (!techAvail) {
      // Default: assume working day with full hours
      return { isWorkingDay: true, daySchedule: null, status: 'available' };
    }

    const dayOfWeek = getDay(date); // 0=Sunday, 1=Monday, etc.
    const daySchedule = techAvail.daySchedules[dayOfWeek];
    
    // Check if this day is a working day
    const isWorkingDay = daySchedule?.enabled === true && !daySchedule?.fullDayOff;
    
    return {
      isWorkingDay,
      daySchedule: daySchedule || null,
      status: techAvail.status || 'available',
      scheduleNote: techAvail.scheduleNote
    };
  };

  // Check if a specific hour is within working hours for a technician on a date
  const isHourWithinWorkingHours = (technicianId: string, date: Date, hour: number): boolean => {
    const { isWorkingDay, daySchedule } = getAvailabilityForDate(technicianId, date);
    
    if (!isWorkingDay) return false;
    if (!daySchedule) return true; // No schedule info, assume all hours available
    
    // Parse start and end times
    const [startHour] = daySchedule.startTime.split(':').map(Number);
    const [endHour] = daySchedule.endTime.split(':').map(Number);
    
    // Check if hour is within working range
    return hour >= startHour && hour < endHour;
  };

  // Check if a specific hour falls within lunch break
  const isLunchHour = (technicianId: string, date: Date, hour: number): boolean => {
    const { isWorkingDay, daySchedule } = getAvailabilityForDate(technicianId, date);
    if (!isWorkingDay || !daySchedule?.lunchStart || !daySchedule?.lunchEnd) return false;
    
    const [lunchStartH, lunchStartM] = daySchedule.lunchStart.split(':').map(Number);
    const [lunchEndH, lunchEndM] = daySchedule.lunchEnd.split(':').map(Number);
    const lunchStartMinutes = lunchStartH * 60 + (lunchStartM || 0);
    const lunchEndMinutes = lunchEndH * 60 + (lunchEndM || 0);
    const hourStart = hour * 60;
    const hourEnd = (hour + 1) * 60;
    
    // Hour overlaps with lunch if hourStart < lunchEnd AND lunchStart < hourEnd
    return hourStart < lunchEndMinutes && lunchStartMinutes < hourEnd;
  };

  // Check if technician status indicates unavailability
  const isTechnicianUnavailable = (technicianId: string): boolean => {
    const techAvail = availability.find(a => a.technicianId === technicianId);
    if (!techAvail) return false;
    
    const unavailableStatuses = ['on_leave', 'sick', 'unavailable', 'off'];
    return unavailableStatuses.includes(techAvail.status?.toLowerCase() || '');
  };

  const getJobPosition = (job: Job, date: Date) => {
    if (!job.scheduledStart) return null;
    
    const dayStart = startOfDay(date);
    const minutesFromStart = differenceInMinutes(job.scheduledStart, dayStart);
    const hours = minutesFromStart / 60;
    
    // Position relative to working hours (8 AM = hour 0)
    const workingHourOffset = hours - workingHours[0];
    
    console.log('Job positioning:', {
      jobId: job.id,
      scheduledStart: job.scheduledStart,
      dayStart,
      minutesFromStart,
      hours,
      workingHourOffset,
      hourWidth: dimensions.hourWidth
    });
    
    return {
      left: `${Math.max(0, workingHourOffset) * dimensions.hourWidth}px`,
      top: '4px'
    };
  };

  const isSlotHighlighted = (technicianId: string, date: Date, hour: number) => {
    return dragOverSlot?.technicianId === technicianId && 
           isSameDay(dragOverSlot.date, date) && 
           dragOverSlot.hour === hour;
  };

  return (
  <div className="flex-1 overflow-x-hidden bg-gradient-to-br from-background to-accent/5 relative">
      {/* Single current time indicator spanning all rows */}
      <CurrentTimeIndicator 
        dates={dates}
        workingHours={workingHours}
        dateWidth={dateWidth}
        hourWidth={dimensions.hourWidth}
        widthMode={widthMode}
      />
      <div className={`${widthMode === 'auto' ? 'w-full' : ''}`} style={widthMode === 'scroll' ? { width: `${dates.length * dateWidth}px` } : {}}>

        {technicians.map((technician) => {
          const techUnavailable = isTechnicianUnavailable(technician.id);
          const maxLanes = getMaxLanesForTechnician(technician.id);
          const LANE_HEIGHT = 36; // px per stacked job
          const rowHeight = Math.max(80, maxLanes * LANE_HEIGHT + 12);

          return (
          <div key={technician.id} className="flex border-b" style={{ height: `${rowHeight}px` }}>
            {dates.map(date => {
              const dayJobs = getJobsForDate(technician.id, date);
              const laneAssignments = assignLanes(dayJobs);
              const leaveOnDate = getLeaveForDate(technician.id, date);
              const weekend = isWeekend(date);
              const weekendDisabled = weekend && !includeWeekends;
              const isOnLeave = !!leaveOnDate;
              const { isWorkingDay } = getAvailabilityForDate(technician.id, date);
              
              // Day is not plannable if: weekend disabled, on leave, not a working day, or tech unavailable
              const isDayNotPlannable = weekendDisabled || isOnLeave || !isWorkingDay || techUnavailable;
              
              // Workload heatmap level
              const workloadLevel = !isDayNotPlannable ? getWorkloadLevel(technician.id, date) : null;
              const heatmapClass = getHeatmapClasses(workloadLevel);
              const heatmapDotColor = getHeatmapDotColor(workloadLevel);
              
              return (
                <div
                  key={format(date, 'yyyy-MM-dd')}
                  className={`flex border-r last:border-r-0 flex-shrink-0 relative ${
                    isOnLeave || techUnavailable
                      ? 'bg-success/10'
                      : !isWorkingDay
                        ? 'bg-destructive/10 dark:bg-destructive/15'
                        : weekendDisabled
                          ? 'bg-destructive/10 dark:bg-destructive/15'
                          : weekend
                            ? 'bg-muted/10'
                            : heatmapClass
                  } ${isDayNotPlannable ? 'pointer-events-none' : ''}`}
                  style={{ width: `${dateWidth}px` }}
                >
                  {/* Workload heatmap indicator with label */}
                  {workloadLevel && !isDayNotPlannable && (
                    <div className="absolute top-0.5 right-0.5 z-30 flex items-center gap-1 px-1 py-0.5 rounded-sm bg-background/80 backdrop-blur-sm" title={getWorkloadLabel(workloadLevel)}>
                      <div className={`w-2 h-2 rounded-full ${heatmapDotColor}`} />
                      <span className="text-[9px] font-medium text-foreground/70">{getWorkloadLabel(workloadLevel)}</span>
                    </div>
                  )}
                  {/* Leave overlay - Green */}
                  {(isOnLeave || techUnavailable) && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                      <div className="absolute inset-0 bg-success/15" />
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(16,185,129,0.15)_6px,rgba(16,185,129,0.15)_12px)]" />
                      <div className="bg-success/10 border border-success/30 rounded px-2 py-1 flex items-center gap-1.5 shadow-sm z-20">
                        <CalendarDays className="h-3.5 w-3.5 text-success" />
                        <span className="text-[10px] font-medium text-success truncate max-w-[80px]">
                          {isOnLeave ? leaveOnDate.leaveType : t('dispatcher.unavailable')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Non-working day overlay - Red striped like weekend */}
                  {!isWorkingDay && !isOnLeave && !techUnavailable && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                      <div className="absolute inset-0 bg-destructive/10 dark:bg-destructive/15" />
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(239,68,68,0.12)_8px,rgba(239,68,68,0.12)_16px)]" />
                      <div className="bg-destructive/10 border border-destructive/30 rounded px-2 py-1 flex items-center gap-1.5 shadow-sm z-20">
                        <Clock className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-[10px] font-medium text-destructive">
                          {t('dispatcher.day_off')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {weekendDisabled && !isOnLeave && !techUnavailable && isWorkingDay && (
                    <div className="absolute inset-0 pointer-events-none opacity-60 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,0,0,0.10)_8px,rgba(255,0,0,0.10)_16px)]" />
                  )}
                  
                  {/* Working hour slots */}
                  {workingHours.map(hour => {
                    const isHighlighted = isSlotHighlighted(technician.id, date, hour);
                    const isWithinWorkHours = isHourWithinWorkingHours(technician.id, date, hour);
                    const isLunch = isLunchHour(technician.id, date, hour);
                    const isHourDisabled = isDayNotPlannable || !isWithinWorkHours;
                    
                    return (
                      <div
                        key={hour}
                        className={`calendar-drop-zone border-r last:border-r-0 transition-all duration-200 relative group ${
                          isHourDisabled
                            ? 'cursor-not-allowed'
                            : 'cursor-pointer'
                        } ${
                          isHighlighted
                            ? 'drag-over bg-gradient-to-br from-primary/20 to-primary/10 border-primary/40'
                            : isHourDisabled
                              ? ''
                              : 'hover:bg-gradient-to-br hover:from-accent/20 hover:to-accent/10'
                        }`}
                        style={{ width: `${dimensions.hourWidth}px` }}
                        onDragOver={(e) => !isHourDisabled && onDragOver(e, technician.id, date, hour)}
                        onDragLeave={(e) => !isHourDisabled && onDragLeave(e)}
                        onDrop={(e) => !isHourDisabled && onDrop(e, technician.id, date, hour)}
                      >
                        {/* Hour outside working hours - subtle red stripe */}
                        {!isWithinWorkHours && !isDayNotPlannable && (
                          <div className="absolute inset-0 pointer-events-none bg-destructive/8 dark:bg-destructive/12 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(239,68,68,0.08)_4px,rgba(239,68,68,0.08)_8px)]" />
                        )}

                        {/* Lunch break overlay - gray striped */}
                        {isLunch && !isDayNotPlannable && (
                          <div 
                            className="absolute inset-0 pointer-events-none z-10 bg-muted/30 dark:bg-muted/40 bg-[repeating-linear-gradient(-45deg,transparent,transparent_3px,hsl(var(--muted-foreground)/0.10)_3px,hsl(var(--muted-foreground)/0.10)_6px)]"
                            title={t('dispatcher.lunch_break')}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[8px] font-medium text-muted-foreground/60 uppercase tracking-wider select-none">
                                {t('dispatcher.lunch')}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Enhanced drop zone indicator with animation */}
                        {isHighlighted && (
                          <div className="absolute inset-0 border-2 border-dashed border-primary/60 rounded-md flex items-center justify-center z-20 animate-pulse">
                            <div className="flex items-center gap-1 text-primary/80 text-xs font-medium">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                              <span>{t('dispatcher.drop_here')}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Hover indicator */}
                        {!isHourDisabled && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="absolute top-1 left-1 w-1 h-1 bg-accent rounded-full"></div>
                            <div className="absolute bottom-1 right-1 w-1 h-1 bg-accent rounded-full"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Positioned job blocks (multi-lane stacking for overlaps) */}
                  {laneAssignments.map(({ job, lane }) => {
                    const position = getJobPosition(job, date);
                    if (!position) return null;
                    const top = 4 + lane * LANE_HEIGHT;
                    return (
                      <div
                        key={job.id}
                        className="absolute"
                        style={{ left: position.left, top: `${top}px` }}
                      >
                        <ResizableJobBlock
                          job={job}
                          hourWidth={dimensions.hourWidth}
                          onResize={onJobResize}
                          onPreviewResize={onPreviewResize}
                          onClick={onJobClick}
                          isLocked={job.isLocked}
                          compactHeight={LANE_HEIGHT - 4}
                          isShared={job.isShared}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          );
        })}
      </div>
    </div>
  );
}