import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  RefreshCcw,
  Map,
  LayoutGrid,
  Wand2,
  Sparkles,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { isViewAllWriteBlocked } from "@/utils/targetTenant";
import { useMutationActionGuard } from "@/hooks/useCreateActionGuard";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ClipboardList } from "lucide-react";

import { PlanningAutopilotDemo } from "./onboarding/PlanningAutopilotDemo";
import { CustomCalendar } from "./CustomCalendar";
import { UnassignedJobsList, type PlanningMode } from "./UnassignedJobsList";
import { DispatcherMapView } from "./DispatcherMapView";
import { useDispatcherProgressiveLoad } from "../hooks/useDispatcherProgressiveLoad";
import { useActivePlanningProfile } from "../hooks/usePlanningProfile";
import type { Job, CalendarViewType, Technician } from "../types";
import { appSettingsApi } from "@/services/api/appSettingsApi";
import { startOfWeek, endOfWeek, addDays } from "date-fns";
import { autoFillDay, rankTechniciansForJob } from "../utils/planningAssist";
import { PlanningDisplayProvider, type PlanningDisplay } from "../context/PlanningDisplayContext";

export function DispatchingInterface() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Progressive loading hook
  const { technicians, jobs, loadingState, isFullyLoaded, refresh } = useDispatcherProgressiveLoad();

  // Active planning profile drives board behavior
  const { profile: activeProfile, settings: profileSettings, visibleUserIds, requiredSkillIds } = useActivePlanningProfile();

  const [selectedTechnician] = useState<string | null>(null);

  // Calendar view follows profile.defaultView
  const calendarView = useMemo<CalendarViewType>(() => {
    const today = new Date();
    if (profileSettings.defaultView === 'day') {
      return { type: 'day', startDate: today, endDate: addDays(today, 0) };
    }
    // weekStartsOn: 1 = Monday — business week starts Monday, not Sunday
    return { type: 'week', startDate: startOfWeek(today, { weekStartsOn: 1 }), endDate: endOfWeek(today, { weekStartsOn: 1 }) };
  }, [profileSettings.defaultView]);

  // The date window the dispatcher is actually viewing (CustomCalendar navigates
  // internally). Auto-fill targets this instead of always "today".
  const [viewedRange, setViewedRange] = useState<{ from: Date; to: Date }>(
    () => ({ from: calendarView.startDate, to: calendarView.endDate }),
  );

  // Trigger for refreshing calendar assigned jobs
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);

  // Mobile detection and UI state
  const [isMobile, setIsMobile] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobsSheetOpen, setIsJobsSheetOpen] = useState(false);
  const [isTechniciansSheetOpen, setIsTechniciansSheetOpen] = useState(false);

  // Planning mode is derived from the active profile's board mode
  const planningMode: PlanningMode = profileSettings.mode === 'installations' ? 'job' : 'serviceOrder';
  const setPlanningMode = (_: PlanningMode) => { /* managed by profile */ };

  // conversionMode: profile overrides the global app setting
  const { data: conversionModeRaw } = useQuery({
    queryKey: ['appSetting', 'JobConversionMode'],
    queryFn: async () => {
      const value = await appSettingsApi.getSetting('JobConversionMode');
      return (value === 'service' || value === 'installation') ? value as 'installation' | 'service' : 'installation';
    },
    staleTime: 30000,
  });
  const conversionMode: 'installation' | 'service' =
    profileSettings.mode === 'installations' ? 'installation' :
    profileSettings.mode === 'service_orders' ? 'service' :
    (conversionModeRaw || 'installation');

  // Filter and sort visible technicians by active profile
  const visibleTechnicians = useMemo<Technician[]>(() => {
    let list = technicians;

    // 1. Explicit user list (manual selection in profile)
    if (visibleUserIds && visibleUserIds.length > 0) {
      const set = new Set(visibleUserIds.map(String));
      list = list.filter(tech => set.has(String(tech.id)) || set.has(tech.id.match(/\d+/)?.[0] ?? ''));
    }

    // 2. Working-hours filter
    if (profileSettings.hideUsersWithoutWorkingHours) {
      list = list.filter(tech => {
        const wh = tech.workingHours;
        return wh && wh.start && wh.end && wh.start !== wh.end;
      });
    }

    // 3. Skills filter — keep only technicians who match the profile's required skills
    if (requiredSkillIds && requiredSkillIds.length > 0) {
      const requiredLower = requiredSkillIds.map(s => s.toLowerCase());
      const mode = profileSettings.skillFilterMode ?? 'any';
      list = list.filter(tech => {
        const techSkillsLower = (tech.skills ?? []).map(s => s.toLowerCase());
        return mode === 'all'
          ? requiredLower.every(req => techSkillsLower.includes(req))
          : requiredLower.some(req => techSkillsLower.includes(req));
      });
    }

    // 4. Sort by skill match score (most matching skills first)
    if (profileSettings.sortBySkillMatch && requiredSkillIds && requiredSkillIds.length > 0) {
      const requiredLower = requiredSkillIds.map(s => s.toLowerCase());
      list = [...list].sort((a, b) => {
        const scoreA = (a.skills ?? []).filter(s => requiredLower.includes(s.toLowerCase())).length;
        const scoreB = (b.skills ?? []).filter(s => requiredLower.includes(s.toLowerCase())).length;
        return scoreB - scoreA;
      });
    }

    return list;
  }, [technicians, visibleUserIds, profileSettings.hideUsersWithoutWorkingHours, profileSettings.skillFilterMode, profileSettings.sortBySkillMatch, requiredSkillIds]);
  
  // Track if we're refreshing (separate from initial load)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-fill day state
  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  // Disable scheduling actions while viewing all companies (no single company selected).
  const viewAllGuard = useMutationActionGuard();

  // View mode: 'calendar' or 'map'
  const [viewMode, setViewMode] = useState<'calendar' | 'map'>('calendar');
  // Planning autopilot product demo
  const [demoOpen, setDemoOpen] = useState(false);

  // Smart suggestions: best technicians for top unassigned jobs
  const suggestions = useMemo(() => {
    const topJobs = jobs.slice(0, 5);
    return topJobs.map(job => ({
      job,
      ranked: rankTechniciansForJob(job, visibleTechnicians).slice(0, 3),
    }));
  }, [jobs, visibleTechnicians]);

  const runAutoFill = async () => {
    // Block (with a single message) while viewing all companies — auto-fill would
    // otherwise fire one blocked write per job. A company must be selected first.
    if (isViewAllWriteBlocked()) {
      toast.error(t('dispatcher.autofill.select_company', { defaultValue: 'Select a company first — auto-fill is disabled while viewing all companies.' }));
      setAutoFillOpen(false);
      return;
    }
    if (jobs.length === 0) {
      toast.info(t('dispatcher.autofill.no_jobs', { defaultValue: 'No unassigned jobs to plan.' }));
      setAutoFillOpen(false);
      return;
    }
    if (visibleTechnicians.length === 0) {
      toast.error(t('dispatcher.autofill.no_techs', { defaultValue: 'No visible technicians in this profile.' }));
      setAutoFillOpen(false);
      return;
    }
    if (!profileSettings.allowSchedulingJobs) {
      toast.error(t('dispatcher.autofill.not_allowed', { defaultValue: 'Scheduling is disabled in this profile.' }));
      setAutoFillOpen(false);
      return;
    }
    setAutoFilling(true);
    try {
      // Target the day on screen: keep "today" when it's inside the viewed window,
      // otherwise fill the first day of the period the dispatcher navigated to.
      const now = new Date();
      const targetDay = (now >= viewedRange.from && now <= viewedRange.to) ? now : viewedRange.from;
      const res = await autoFillDay(targetDay, jobs, visibleTechnicians, {
        allowSchedulingInPast: profileSettings.allowSchedulingInPast,
        bufferMinutes: 15,
        groupByServiceOrder: profileSettings.autoFillSingleDispatchPerOrder,
      });
      if (res.assigned > 0) toast.success(t('dispatcher.autofill.success', { defaultValue: '{{n}} job(s) auto-scheduled', n: res.assigned }));
      if (res.skipped > 0) toast.warning(t('dispatcher.autofill.skipped', { defaultValue: '{{n}} job(s) could not be placed', n: res.skipped }));
      if (res.errors.length > 0) {
        console.warn('Auto-fill errors:', res.errors);
        toast.error(t('dispatcher.autofill.errors', {
          defaultValue: '{{n}} issue(s) during auto-fill — see console for details',
          n: res.errors.length,
        }));
      }
      if (res.assigned === 0 && res.skipped === 0 && res.errors.length === 0) {
        toast.info(t('dispatcher.autofill.nothing', { defaultValue: 'Nothing to schedule.' }));
      }
      await handleRefresh();
    } catch (e) {
      console.error(e);
      toast.error(t('dispatcher.autofill.failed', { defaultValue: 'Auto-fill failed' }));
    } finally {
      setAutoFilling(false);
      setAutoFillOpen(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Refresh handler to reload ALL data: technicians, unassigned jobs, AND assigned jobs on calendar
  const handleRefresh = async () => {
    console.log('Refreshing ALL dispatcher data...');
    setIsRefreshing(true);
    try {
      await refresh();
      // Trigger calendar to reload assigned jobs and leaves
      setCalendarRefreshTrigger(prev => {
        const newVal = prev + 1;
        console.log('Calendar refresh trigger updated to:', newVal);
        return newVal;
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Called after a job is assigned in CustomCalendar - DO NOT call assignJob again here
  // The actual assignment is done in CustomCalendar.handleConfirmAssignment
  const handleJobAssignment = async (_jobId: string, _technicianId: string, _scheduledStart: Date, _scheduledEnd: Date) => {
    try {
      // Refresh to update the unassigned jobs list
      await refresh();
      // Close mobile sheets after assignment
      if (isMobile) {
        setIsJobsSheetOpen(false);
        setSelectedJob(null);
      }
    } catch (error) {
      console.error('Failed to assign job:', error);
    }
  };

  const handleJobClick = (job: Job) => {
    if (isMobile) {
      setSelectedJob(job);
      setIsJobsSheetOpen(false);
      setIsTechniciansSheetOpen(true);
    }
  };

  // Handle job click from map view
  const handleMapJobClick = (job: Job) => {
    // Navigate to the dispatch detail page if job has an assigned dispatch
    if (job.id) {
      navigate(`/dashboard/field/dispatcher/job/${job.id}`);
    }
  };

  const planningDisplay = useMemo(() => ({
    // Guard the empty-array case: `[] ?? x` keeps `[]` (it's not nullish), which
    // would make the label resolver fall back to the order number for every card.
    cardPrimaryFields: (profileSettings.cardPrimaryFields?.length ? profileSettings.cardPrimaryFields : ['serviceOrderNumber']) as PlanningDisplay['cardPrimaryFields'],
    cardSeparator: profileSettings.cardSeparator ?? ' - ',
    hoverFields: profileSettings.hoverFields ?? [],
    showJobsOnHover: profileSettings.showJobsOnHover ?? true,
    colorBy: profileSettings.colorBy ?? 'status',
    showDurationLabels: profileSettings.showDurationLabels ?? true,
  }), [profileSettings.cardPrimaryFields, profileSettings.cardSeparator, profileSettings.hoverFields, profileSettings.showJobsOnHover, profileSettings.colorBy, profileSettings.showDurationLabels]);

  return (
    <PlanningDisplayProvider value={planningDisplay}>
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden relative">
      {/* Header (consistent with Articles/Contacts pattern) */}
      <header className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{t('dispatcher.title')}</h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">{t('dispatcher.description')}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.calendarView', 'Calendar')}</span>
            </Button>
            <Button
              variant={viewMode === 'map' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="gap-2"
            >
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.mapView', 'Map')}</span>
            </Button>
          </div>

          {/* Watch Demo */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDemoOpen(true)}
            className="hidden sm:inline-flex gap-1.5 shrink-0"
          >
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dispatcher.watchDemo', 'Watch Demo')}</span>
          </Button>

          {/* Smart Planning group — always visible, clearly labeled */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-primary/30 bg-primary/5">
            <span className="hidden md:inline text-[11px] font-medium text-primary uppercase tracking-wide pr-1">
              {t('dispatcher.smart_planning', { defaultValue: 'Smart Planning' })}
            </span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="default" size="sm" className="gap-2 h-8">
                  <Sparkles className="h-4 w-4" />
                  <span>{t('dispatcher.suggest.button', { defaultValue: 'Suggest' })}</span>
                  {jobs.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{jobs.length}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96 p-0">
                <div className="px-4 py-3 border-b">
                  <div className="text-sm font-semibold">{t('dispatcher.suggest.title', { defaultValue: 'Best-fit technicians' })}</div>
                  <div className="text-xs text-muted-foreground">{t('dispatcher.suggest.subtitle', { defaultValue: 'Top picks for your unassigned jobs (skills + availability + distance).' })}</div>
                </div>
                <div className="max-h-80 overflow-auto divide-y">
                  {suggestions.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">{t('dispatcher.suggest.empty', { defaultValue: 'No unassigned jobs to suggest for.' })}</div>
                  )}
                  {suggestions.map(({ job, ranked }) => (
                    <div key={job.id} className="p-3">
                      <div className="text-sm font-medium truncate">{job.title}</div>
                      <div className="text-[11px] text-muted-foreground mb-2 truncate">{job.customerName}</div>
                      {ranked.length === 0 ? (
                        <div className="text-xs text-muted-foreground">{t('dispatcher.suggest.no_tech', { defaultValue: 'No technicians available' })}</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {ranked.map((r, idx) => (
                            <Badge key={r.technician.id} variant={idx === 0 ? 'default' : 'secondary'} className="gap-1 font-normal">
                              {r.technician.firstName} {r.technician.lastName}
                              <span className="opacity-70">· {r.score}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (jobs.length === 0) {
                  toast.info(t('dispatcher.autofill.no_jobs', { defaultValue: 'No unassigned jobs to plan.' }));
                  return;
                }
                if (!profileSettings.allowSchedulingJobs) {
                  toast.error(t('dispatcher.profiles.scheduling_disabled', { defaultValue: 'Scheduling new jobs is disabled in your planning profile.' }));
                  return;
                }
                setAutoFillOpen(true);
              }}
              disabled={autoFilling || viewAllGuard.disabled}
              title={viewAllGuard.disabled
                ? t('dispatcher.autofill.select_company', { defaultValue: 'Select a company first — auto-fill is disabled while viewing all companies.' })
                : undefined}
              className="gap-2 h-8"
            >
              <Wand2 className={`h-4 w-4 ${autoFilling ? 'animate-pulse' : ''}`} />
              <span>{t('dispatcher.autofill.button', { defaultValue: 'Auto-fill day' })}</span>
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('common.update', { defaultValue: 'Update' })}
          </Button>
        </div>
      </header>

      <AlertDialog open={autoFillOpen} onOpenChange={setAutoFillOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dispatcher.autofill.confirm_title', { defaultValue: "Auto-fill today's planning?" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dispatcher.autofill.confirm_desc', {
                defaultValue: 'This will assign up to {{n}} unassigned job(s) to your {{m}} visible technician(s), placed back-to-back inside their working hours. You can adjust afterwards.',
                n: jobs.length,
                m: visibleTechnicians.length,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={autoFilling}>{t('common.cancel', { defaultValue: 'Cancel' })}</AlertDialogCancel>
            <AlertDialogAction onClick={runAutoFill} disabled={autoFilling}>
              {autoFilling ? t('common.loading', { defaultValue: 'Loading…' }) : t('dispatcher.autofill.run', { defaultValue: 'Run auto-fill' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      {/* Desktop Layout */}
      {!isMobile && (
        <div className="flex-1 flex w-full overflow-hidden min-h-0">
          {viewMode === 'calendar' ? (
            <>
              {/* Center - Calendar with horizontal scroll container */}
              <div className="flex-1 min-w-0 max-w-[calc(100vw-240px)]">
                <CustomCalendar
                  view={calendarView}
                  technicians={visibleTechnicians}
                  selectedTechnician={selectedTechnician}
                  onJobAssignment={handleJobAssignment}
                  onDispatchDeleted={handleRefresh}
                  refreshTrigger={calendarRefreshTrigger}
                  conversionMode={conversionMode || 'installation'}
                  onViewRangeChange={setViewedRange}
                />
              </div>

              {/* Right Sidebar - Always visible, fixed width */}
              <div className="w-60 max-w-60 border-l bg-card flex-shrink-0 overflow-hidden">
                <UnassignedJobsList
                  jobs={jobs}
                  isLoading={!loadingState.serviceOrdersLoaded || isRefreshing}
                  onJobUpdate={handleRefresh}
                  planningMode={planningMode}
                  onPlanningModeChange={setPlanningMode}
                  conversionMode={conversionMode || 'installation'}
                />
              </div>
            </>
          ) : (
            /* Map View */
            <div className="flex-1 p-4">
              <DispatcherMapView
                jobs={jobs}
                technicians={visibleTechnicians}
                onJobClick={handleMapJobClick}
                onJobAssigned={handleRefresh}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <div className="flex-1 w-full overflow-hidden">
          {viewMode === 'calendar' ? (
            <CustomCalendar
              view={calendarView}
              technicians={visibleTechnicians}
              selectedTechnician={selectedTechnician}
              onJobAssignment={handleJobAssignment}
              onDispatchDeleted={handleRefresh}
              refreshTrigger={calendarRefreshTrigger}
              isMobile={true}
              conversionMode={conversionMode || 'installation'}
              onViewRangeChange={setViewedRange}
            />
          ) : (
            <div className="p-4 h-full">
              <DispatcherMapView
                jobs={jobs}
                technicians={visibleTechnicians}
                onJobClick={handleMapJobClick}
                onJobAssigned={handleRefresh}
              />
            </div>
          )}
        </div>
      )}

      {/* FAB + Sheet — rendered at root level so no overflow-hidden clips them */}
      {isMobile && (
        <>
          <button
            onClick={() => setIsJobsSheetOpen(true)}
            className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 px-4 py-3 text-sm font-medium active:scale-95 transition-transform"
            aria-label={t('dispatcher.unassigned_jobs', { defaultValue: 'Unassigned jobs' })}
          >
            <ClipboardList className="h-4 w-4 flex-shrink-0" />
            <span>{t('dispatcher.jobs', { defaultValue: 'Jobs' })}</span>
            {jobs.length > 0 && (
              <span className="flex items-center justify-center rounded-full bg-primary-foreground text-primary text-[11px] font-bold h-5 min-w-[20px] px-1 -mr-1">
                {jobs.length}
              </span>
            )}
          </button>

          <Sheet open={isJobsSheetOpen} onOpenChange={setIsJobsSheetOpen}>
            <SheetContent
              side="bottom"
              className="h-[82dvh] rounded-t-2xl p-0 flex flex-col"
            >
              <SheetHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  {t('dispatcher.unassigned_jobs', { defaultValue: 'Unassigned jobs' })}
                  {jobs.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{jobs.length}</Badge>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 min-h-0 overflow-hidden">
                <UnassignedJobsList
                  jobs={jobs}
                  isLoading={!loadingState.serviceOrdersLoaded || isRefreshing}
                  onJobUpdate={handleRefresh}
                  onJobClick={handleJobClick}
                  isMobile={true}
                  planningMode={planningMode}
                  onPlanningModeChange={setPlanningMode}
                  conversionMode={conversionMode || 'installation'}
                />
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* Autopilot product demo */}
      <PlanningAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
    </PlanningDisplayProvider>
  );
}
