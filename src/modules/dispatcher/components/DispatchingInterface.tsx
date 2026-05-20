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
} from "lucide-react";

import { CustomCalendar } from "./CustomCalendar";
import { UnassignedJobsList, type PlanningMode } from "./UnassignedJobsList";
import { DispatcherMapView } from "./DispatcherMapView";
import { useDispatcherProgressiveLoad } from "../hooks/useDispatcherProgressiveLoad";
import { useActivePlanningProfile } from "../hooks/usePlanningProfile";
import type { Job, CalendarViewType, Technician } from "../types";
import { appSettingsApi } from "@/services/api/appSettingsApi";
import { startOfWeek, endOfWeek, addDays } from "date-fns";

export function DispatchingInterface() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Progressive loading hook
  const { technicians, jobs, loadingState, isFullyLoaded, refresh } = useDispatcherProgressiveLoad();

  // Active planning profile drives board behavior
  const { profile: activeProfile, settings: profileSettings, visibleUserIds } = useActivePlanningProfile();

  const [selectedTechnician] = useState<string | null>(null);

  // Calendar view follows profile.defaultView
  const calendarView = useMemo<CalendarViewType>(() => {
    const today = new Date();
    if (profileSettings.defaultView === 'day') {
      return { type: 'day', startDate: today, endDate: addDays(today, 0) };
    }
    return { type: 'week', startDate: startOfWeek(today), endDate: endOfWeek(today) };
  }, [profileSettings.defaultView]);

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

  // Filter visible technicians by active profile
  const visibleTechnicians = useMemo<Technician[]>(() => {
    let list = technicians;
    if (visibleUserIds && visibleUserIds.length > 0) {
      const set = new Set(visibleUserIds.map(String));
      list = list.filter(tech => set.has(String(tech.id)) || set.has(tech.id.match(/\d+/)?.[0] ?? ''));
    }
    if (profileSettings.hideUsersWithoutWorkingHours) {
      list = list.filter(tech => {
        const wh = tech.workingHours;
        return wh && wh.start && wh.end && wh.start !== wh.end;
      });
    }
    return list;
  }, [technicians, visibleUserIds, profileSettings.hideUsersWithoutWorkingHours]);
  
  // Track if we're refreshing (separate from initial load)
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // View mode: 'calendar' or 'map'
  const [viewMode, setViewMode] = useState<'calendar' | 'map'>('calendar');

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

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden relative">
      {/* Header (consistent with Articles/Contacts pattern) */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground truncate">{t('dispatcher.title')}</h1>
            <p className="text-[11px] text-muted-foreground truncate">{t('dispatcher.description')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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


      {/* Desktop Layout */}
      {!isMobile && (
        <div className="flex-1 flex w-full overflow-hidden min-h-0">
          {viewMode === 'calendar' ? (
            <>
              {/* Center - Calendar with horizontal scroll container */}
              <div className="flex-1 min-w-0 max-w-[calc(100vw-288px)]">
                <CustomCalendar
                  view={calendarView}
                  technicians={visibleTechnicians}
                  selectedTechnician={selectedTechnician}
                  onJobAssignment={handleJobAssignment}
                  onDispatchDeleted={handleRefresh}
                  refreshTrigger={calendarRefreshTrigger}
                  conversionMode={conversionMode || 'installation'}
                />
              </div>

              {/* Right Sidebar - Always visible, fixed width */}
              <div className="w-72 max-w-72 border-l bg-card flex-shrink-0 overflow-hidden">
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
    </div>
  );
}
