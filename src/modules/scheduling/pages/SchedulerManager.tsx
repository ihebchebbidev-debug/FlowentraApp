import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import i18n from '@/lib/i18n';
import schedulingEnDefault from '../locales/en';
import { en as schedulingEnNested } from '../locales/en/index';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { SchedulingService } from "../services/scheduling.service";
import type { Technician } from "../../dispatcher/types";
import { ScheduleEditor } from "../components/ScheduleEditor";
import { UserAvatar } from "@/components/ui/user-avatar";
import { initialsFor, avatarBgFor, dotColorFor, lookupHexColorForStatus } from "../utils";
import { usePermissions } from "@/hooks/usePermissions";
import { ShieldAlert, Loader2, Clock, Calendar, AlertCircle, CalendarCog, ArrowLeft } from "lucide-react";
import { schedulesApi, type UserFullSchedule, type DaySchedule, type UserLeave } from "@/services/api/schedulesApi";
import { format, isWithinInterval, parseISO } from "date-fns";

interface TechnicianAvailability {
  techId: string;
  schedule: UserFullSchedule | null;
  todaySchedule: DaySchedule | null;
  activeLeave: UserLeave | null;
  realTimeStatus: 'available' | 'not_working' | 'on_leave' | 'before_shift' | 'after_shift' | 'on_break' | 'no_schedule';
  loading: boolean;
  error: boolean;
}

export function SchedulerManager() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, isLoading: permissionsLoading, isMainAdmin } = usePermissions();
  
  // Permission checks - uses dispatches module for scheduling
  const hasReadAccess = isMainAdmin || hasPermission('dispatches', 'read');
  const hasUpdateAccess = isMainAdmin || hasPermission('dispatches', 'update');
  
  const openSidebarRequested = (location.state && (location.state as any).openSidebar) || false;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { setOpen } = useSidebar();
  const [technicians] = useState<Technician[]>(SchedulingService.getTechnicians());
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Technician | null>(null);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, TechnicianAvailability>>({});

  useEffect(() => {
    if (openSidebarRequested) {
      try { setOpen(true); } catch (e) { /* ignore if provider missing */ }
    }
  }, [openSidebarRequested]);

  // Ensure scheduling translations are available at runtime (useful during HMR/dev)
  useEffect(() => {
    try {
      // flat object export
      if (schedulingEnDefault && typeof schedulingEnDefault === 'object') {
        Object.keys(schedulingEnDefault).forEach((k) => {
          const key = `scheduling.${k}`;
          if (!i18n.exists(key)) i18n.addResource('en', 'translation', key, (schedulingEnDefault as any)[k]);
        });
      }
      // nested export
      if (schedulingEnNested && (schedulingEnNested as any).scheduling) {
        Object.keys((schedulingEnNested as any).scheduling).forEach((k) => {
          const key = `scheduling.${k}`;
          if (!i18n.exists(key)) i18n.addResource('en', 'translation', key, (schedulingEnNested as any).scheduling[k]);
        });
      }
    } catch (e) {
      // noop
    }
  }, []);

  // Calculate real-time status based on schedule and leaves
  const calculateRealTimeStatus = useCallback((
    schedule: UserFullSchedule | null,
    todayDayOfWeek: number,
    now: Date
  ): { status: TechnicianAvailability['realTimeStatus']; todaySchedule: DaySchedule | null; activeLeave: UserLeave | null } => {
    if (!schedule) {
      return { status: 'no_schedule', todaySchedule: null, activeLeave: null };
    }

    // Check for active leave
    const activeLeave = schedule.leaves?.find(leave => {
      try {
        const start = parseISO(leave.startDate);
        const end = parseISO(leave.endDate);
        return isWithinInterval(now, { start, end }) && leave.status === 'approved';
      } catch {
        return false;
      }
    });

    if (activeLeave) {
      return { status: 'on_leave', todaySchedule: null, activeLeave };
    }

    // Check today's schedule
    const todaySchedule = schedule.daySchedules?.[todayDayOfWeek];
    
    // If no schedule for today or full day off
    if (!todaySchedule || todaySchedule.fullDayOff) {
      return { status: 'not_working', todaySchedule: todaySchedule || null, activeLeave: null };
    }

    // If schedule exists but is disabled for this day
    if (!todaySchedule.enabled) {
      return { status: 'not_working', todaySchedule, activeLeave: null };
    }

    // Check if current time is within working hours
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;
    
    const [startHour, startMin] = todaySchedule.startTime.split(':').map(Number);
    const [endHour, endMin] = todaySchedule.endTime.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMin;
    const endTimeInMinutes = endHour * 60 + endMin;

    if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
      // Check if in lunch break
      if (todaySchedule.lunchStart && todaySchedule.lunchEnd) {
        const [lunchStartHour, lunchStartMin] = todaySchedule.lunchStart.split(':').map(Number);
        const [lunchEndHour, lunchEndMin] = todaySchedule.lunchEnd.split(':').map(Number);
        const lunchStartInMinutes = lunchStartHour * 60 + lunchStartMin;
        const lunchEndInMinutes = lunchEndHour * 60 + lunchEndMin;
        
        if (currentTimeInMinutes >= lunchStartInMinutes && currentTimeInMinutes <= lunchEndInMinutes) {
          return { status: 'on_break', todaySchedule, activeLeave: null };
        }
      }
      return { status: 'available', todaySchedule, activeLeave: null };
    }

    // Outside working hours - distinguish between before shift and after shift
    if (currentTimeInMinutes < startTimeInMinutes) {
      return { status: 'before_shift', todaySchedule, activeLeave: null };
    }
    
    return { status: 'after_shift', todaySchedule, activeLeave: null };
  }, []);

  // Load availability for all technicians
  const loadAllAvailability = useCallback(async () => {
    const now = new Date();
    const todayDayOfWeek = now.getDay(); // 0 = Sunday

    // Initialize loading state for all technicians
    const initialState: Record<string, TechnicianAvailability> = {};
    technicians.forEach(tech => {
      initialState[tech.id] = {
        techId: tech.id,
        schedule: null,
        todaySchedule: null,
        activeLeave: null,
        realTimeStatus: 'no_schedule',
        loading: true,
        error: false
      };
    });
    setAvailabilityMap(initialState);

    // Fetch all availability in parallel
    const results = await Promise.allSettled(
      technicians.map(async (tech) => {
        // Use the real user ID directly — technician IDs from the API are already real IDs (e.g. "1", "4", "5")
        const userId = tech.id;
        try {
          const schedule = await schedulesApi.getSchedule(userId);
          const { status, todaySchedule, activeLeave } = calculateRealTimeStatus(schedule, todayDayOfWeek, now);
          return {
            techId: tech.id,
            schedule,
            todaySchedule,
            activeLeave,
            realTimeStatus: status,
            loading: false,
            error: false
          } as TechnicianAvailability;
        } catch (err) {
          console.warn(`Failed to load availability for ${tech.id}:`, err);
          return {
            techId: tech.id,
            schedule: null,
            todaySchedule: null,
            activeLeave: null,
            realTimeStatus: 'no_schedule',
            loading: false,
            error: true
          } as TechnicianAvailability;
        }
      })
    );

    // Update state with results
    const newState: Record<string, TechnicianAvailability> = {};
    results.forEach((result, index) => {
      const techId = technicians[index].id;
      if (result.status === 'fulfilled') {
        newState[techId] = result.value;
      } else {
        newState[techId] = {
          techId,
          schedule: null,
          todaySchedule: null,
          activeLeave: null,
          realTimeStatus: 'no_schedule',
          loading: false,
          error: true
        };
      }
    });
    setAvailabilityMap(newState);
  }, [technicians, calculateRealTimeStatus]);

  // Load availability on mount and periodically
  useEffect(() => {
    loadAllAvailability();
    // Refresh every 5 minutes
    const interval = setInterval(loadAllAvailability, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAllAvailability]);

  // Get status badge variant and text
  const getStatusBadge = (availability: TechnicianAvailability) => {
    if (availability.loading) {
      return { variant: 'outline' as const, text: t('scheduling.loading_availability', 'Loading...'), icon: Loader2 };
    }
    
    switch (availability.realTimeStatus) {
      case 'available':
        return { variant: 'default' as const, text: t('scheduling.available_now', 'Available now'), color: 'bg-emerald-500' };
      case 'not_working':
        return { variant: 'destructive' as const, text: t('scheduling.not_working_today', 'Not working today'), color: 'bg-destructive' };
      case 'on_leave':
        return { variant: 'destructive' as const, text: t('scheduling.on_leave_today', 'On leave'), color: 'bg-violet-500' };
      case 'before_shift':
        return { variant: 'outline' as const, text: t('scheduling.not_working_now', 'Not working now'), color: 'bg-amber-500' };
      case 'after_shift':
        return { variant: 'outline' as const, text: t('scheduling.not_working_now', 'Not working now'), color: 'bg-amber-500' };
      case 'on_break':
        return { variant: 'outline' as const, text: t('scheduling.on_break', 'On break'), color: 'bg-amber-500' };
      case 'no_schedule':
      default:
        return { variant: 'outline' as const, text: t('scheduling.no_schedule', 'No schedule configured'), color: 'bg-muted-foreground' };
    }
  };

  // Access denied state - after all hooks
  if (!permissionsLoading && !hasReadAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">{t('common.access_denied', 'Access Denied')}</h2>
          <p className="text-muted-foreground max-w-md">
            {t('common.no_permission_view', 'You do not have permission to view this module. Please contact your administrator.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur mb-4 -m-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('scheduling.manage_scheduler', 'Manage scheduler')}</h1>
            <p className="text-[11px] text-muted-foreground">{t('scheduling.manage_scheduler_description', 'Manage technician schedules, leaves and capacity')}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back', 'Back')}
        </Button>
      </div>

      <Card>
          <CardHeader>
          <CardTitle>{t('scheduling.technicians_list', 'Technicians')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Input placeholder={t('scheduling.search_placeholder', 'Search technicians...')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-2 p-2">
                {technicians.filter((tech) => {
                  const q = query.trim().toLowerCase();
                  if (!q) return true;
                  const fullName = `${tech.firstName} ${tech.lastName}`.toLowerCase();
                  const skills = (tech.skills || []).join(' ').toLowerCase();
                  const email = (tech.email || '').toLowerCase();
                  const phone = (tech.phone || '').toLowerCase();
                  return fullName.includes(q) || skills.includes(q) || email.includes(q) || phone.includes(q);
                }).map(tech => {
                  const availability = availabilityMap[tech.id];
                  const statusBadge = availability ? getStatusBadge(availability) : null;
                  const meta = SchedulingService.getTechnicianMeta(tech.id) || {};
                  
                  // Use real-time status color or fallback to meta
                  const realTimeStatusColor = availability?.realTimeStatus === 'available' ? 'bg-emerald-500' :
                    availability?.realTimeStatus === 'on_leave' ? 'bg-violet-500' :
                    availability?.realTimeStatus === 'not_working' ? 'bg-destructive' :
                    (availability?.realTimeStatus === 'before_shift' || availability?.realTimeStatus === 'after_shift' || availability?.realTimeStatus === 'on_break') ? 'bg-amber-500' : 'bg-muted-foreground';
                  
                  const status = (meta.status || tech.status) as string;
                  const avatarBg = avatarBgFor(availability?.realTimeStatus === 'available' ? 'available' : 
                    availability?.realTimeStatus === 'on_leave' ? 'on_leave' : status as any);
                  const initials = initialsFor(tech);

                  // Get working hours from real-time data or fallback
                  const todaySchedule = availability?.todaySchedule;
                  const workingHoursDisplay = todaySchedule && todaySchedule.enabled && !todaySchedule.fullDayOff
                    ? `${todaySchedule.startTime} - ${todaySchedule.endTime}`
                    : meta.workingHours 
                      ? `${meta.workingHours.start} - ${meta.workingHours.end}`
                      : `${tech.workingHours.start} - ${tech.workingHours.end}`;

                  return (
                    <div key={tech.id} className="p-3 border rounded-lg flex items-center gap-3">
                      <div className="relative">
                        <UserAvatar
                          src={tech.avatar}
                          name={`${tech.firstName} ${tech.lastName}`}
                          seed={tech.id}
                          size="md"
                          className="!rounded-full"
                        />
                        <div 
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${realTimeStatusColor}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold truncate">{tech.firstName} {tech.lastName}</div>
                        </div>
                        
                        {/* Working hours */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{t('scheduling.working_hours', 'Working hours')}: {workingHoursDisplay}</span>
                        </div>
                        
                        {/* Real-time status badge */}
                        <div className="flex items-center gap-2 mt-2">
                          {availability?.loading ? (
                            <Badge variant="outline" className="gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {t('scheduling.loading_availability', 'Loading...')}
                            </Badge>
                          ) : statusBadge ? (
                            <Badge 
                              variant={statusBadge.variant}
                              className={
                                statusBadge.variant === 'default' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                                statusBadge.color === 'bg-violet-500' ? 'bg-violet-500 hover:bg-violet-600' :
                                statusBadge.color === 'bg-destructive' ? 'bg-destructive hover:bg-destructive/90' : ''
                              }
                            >
                              {statusBadge.text}
                            </Badge>
                          ) : null}
                          
                          {/* Show active leave info */}
                          {availability?.activeLeave && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {availability.activeLeave.leaveType} {t('scheduling.until', 'until')} {format(parseISO(availability.activeLeave.endDate), 'dd/MM')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Schedule note if any */}
                        {availability?.schedule?.scheduleNote && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{availability.schedule.scheduleNote}</span>
                          </div>
                        )}
                      </div>

                      {hasUpdateAccess && (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={() => navigate(`/dashboard/field/dispatcher/manage-scheduler/edit/${tech.id}`)}>{t('dispatcher.edit_schedule', 'Edit')}</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <ScheduleEditor
          technician={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            loadAllAvailability(); // Refresh availability after save
          }}
        />
      )}
    </div>
  );
}
