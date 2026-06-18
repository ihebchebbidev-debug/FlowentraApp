import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { addHours, addDays, format, isSameDay, isWithinInterval, startOfDay, endOfDay, differenceInCalendarDays } from "date-fns";
import { useTranslation } from "react-i18next";
import type { CalendarViewType, Technician, Job, DragData, ServiceOrder, InstallationGroup } from "../../types";
import { DispatcherService, CollisionService } from "../../services/dispatcher.service";
import { CalendarControls } from "./CalendarControls";
import { CalendarSettingsPanel } from "./CalendarSettings";
import { CalendarHeader } from "./CalendarHeader";
import { TechnicianList } from "./TechnicianList";
import { CalendarGrid } from "./CalendarGrid";
import { OverviewCalendarGrid } from "./OverviewCalendarGrid";
import { JobConfirmationModal } from "../JobConfirmationModal";
import { AssignmentConfirmationModal, type DispatchPriority } from "../AssignmentConfirmationModal";
import { RescheduleConfirmationModal } from "../RescheduleConfirmationModal";
import { BatchAssignmentModal } from "../BatchAssignmentModal";
import { InstallationAssignmentModal } from "../InstallationAssignmentModal";
import { OverlapConfirmDialog } from "../OverlapConfirmDialog";
import type { ZoomLevel, CalendarSettings, ZoomDimensions, TechnicianAvailability } from "./types";
import { toast } from "sonner";
import { schedulesApi, type UserLeave, type UserFullSchedule } from "@/services/api/schedulesApi";
import { maxLanes as computeMaxLanes } from "../../utils/lanes";
import { useActivePlanningProfile } from "../../hooks/usePlanningProfile";

// Leave data structure for calendar display
export interface TechnicianLeave {
  id: number;
  technicianId: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  status: string;
  reason?: string;
}

interface CustomCalendarProps {
  view: CalendarViewType;
  technicians: Technician[];
  selectedTechnician: string | null;
  onJobAssignment: (jobId: string, technicianId: string, scheduledStart: Date, scheduledEnd: Date) => void;
  onDispatchDeleted?: () => void; // Callback when a dispatch is deleted
  onRefreshRequest?: () => void; // Callback to expose refresh capability to parent
  refreshTrigger?: number; // Increment to trigger refresh from parent
  isMobile?: boolean;
  conversionMode?: 'installation' | 'service'; // From Settings > JobConversionMode
  /** Reports the currently-viewed date range up to the parent (e.g. so Auto-fill
   *  targets the day the dispatcher is actually looking at, not always "today"). */
  onViewRangeChange?: (range: { from: Date; to: Date }) => void;
}

// Pending assignment state for confirmation
interface PendingAssignment {
  job: Job;
  technicianId: string;
  technician: Technician | null;
  scheduledStart: Date;
  scheduledEnd: Date;
}

// Status filter options
type StatusFilter = 'all' | string;

// Pending reschedule state
interface PendingReschedule {
  job: Job;
  technicianId: string;
  technician: Technician | null;
  newScheduledStart: Date;
  newScheduledEnd: Date;
  originalStart: Date;
  originalEnd: Date;
}

export function CustomCalendar({ view, technicians, selectedTechnician, onJobAssignment, onDispatchDeleted, onRefreshRequest, refreshTrigger, isMobile, conversionMode = 'installation', onViewRangeChange }: CustomCalendarProps) {
  // Active planning profile drives display/permission behavior
  const { settings: profileSettings } = useActivePlanningProfile();

  const [assignedJobs, setAssignedJobs] = useState<Record<string, Job[]>>({});
  // transient previews for fast UI feedback during drag/resize
  const [previewJobs, setPreviewJobs] = useState<Record<string, Job[]>>({});
  const [dragOverSlot, setDragOverSlot] = useState<{ technicianId: string; date: Date; hour: number } | null>(null);
  // Locked to week view per requirements (remove other view options)
  const viewType = 'week';
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('md');
  // Calendar settings are now sourced from the active planning profile
  const settings: CalendarSettings = { includeWeekends: profileSettings.includeWeekends };
  const [showSettings, setShowSettings] = useState(false);
  // Initialise the visible date window from the view prop so "7d" is shown on first
  // open (previously hardcoded to today+2 = only 3 days, ignoring the view prop).
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => ({
    from: view.startDate,
    to: view.endDate,
  }));

  // Reset the date window when the profile's default view type changes (day ↔ week).
  // We only watch view.type, NOT the date values, so user navigation isn't undone.
  useEffect(() => {
    setDateRange({ from: view.startDate, to: view.endDate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.type]);

  // Measure the calendar's date area so day columns fit exactly. We measure the
  // scroll VIEWPORT's clientWidth (which already excludes the vertical scrollbar,
  // on every platform) and subtract the fixed technician column. No scrollbar
  // guessing → no empty gap before the sidebar.
  const TECH_COL_WIDTH = 208; // matches TechnicianList `w-52`
  const MIN_HOUR_WIDTH = 11;  // smallest readable hour cell before falling back to scroll
  const calendarRootRef = useRef<HTMLDivElement>(null);
  const [dateAreaWidth, setDateAreaWidth] = useState(0);
  const viewportRoRef = useRef<ResizeObserver | null>(null);
  // Callback ref: (re)attaches a ResizeObserver to the scroll viewport whenever
  // it mounts/unmounts (e.g. switching between detailed and overview modes).
  const setViewportRef = useCallback((node: HTMLDivElement | null) => {
    viewportRoRef.current?.disconnect();
    viewportRoRef.current = null;
    if (!node) return;
    const measure = () => setDateAreaWidth(Math.max(0, node.clientWidth - TECH_COL_WIDTH));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    viewportRoRef.current = ro;
  }, []);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // New state for pending assignment confirmation
  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Status filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Reschedule state
  const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Batch assignment state for service orders
  const [pendingBatchAssignment, setPendingBatchAssignment] = useState<{
    serviceOrder: ServiceOrder;
    technicianId: string;
    technician: Technician | null;
    scheduledStart: Date;
  } | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);

  // Installation assignment state
  const [pendingInstallationAssignment, setPendingInstallationAssignment] = useState<{
    group: InstallationGroup;
    technicianId: string;
    technician: Technician | null;
    scheduledStart: Date;
    scheduledEnd: Date;
  } | null>(null);
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [isInstallationAssigning, setIsInstallationAssigning] = useState(false);

  // Overlap confirmation state — used by all drop paths when a collision is detected.
  // `proceed` is a continuation: (chosenStart) => void. Pass the original start to keep overlap,
  // or pass the suggested shift to auto-shift.
  const [pendingOverlap, setPendingOverlap] = useState<{
    overlappingJobs: Job[];
    proposedStart: Date;
    proposedEnd: Date;
    suggestedShiftTo: Date | null;
    proceed: (chosenStart: Date) => void;
  } | null>(null);

  const { t } = useTranslation();

  // Leaves state for calendar display
  const [technicianLeaves, setTechnicianLeaves] = useState<TechnicianLeave[]>([]);
  
  // Availability state for calendar display (working hours, status)
  const [technicianAvailability, setTechnicianAvailability] = useState<TechnicianAvailability[]>([]);

  const workingHours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM
  const baseDisplayed = selectedTechnician
    ? technicians.filter(t => t.id === selectedTechnician)
    : technicians;

  // Additional profile-driven filter: hide users on leave today.
  // (visibleUserIds + no-hours filters are applied upstream in DispatchingInterface.)
  const displayedTechnicians = useMemo(() => {
    if (!profileSettings.hideUsersOnLeaveToday) return baseDisplayed;
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const onLeaveIds = new Set(
      technicianLeaves
        .filter(l => l.status === 'approved' || l.status === 'pending')
        .filter(l => {
          const s = format(l.startDate, 'yyyy-MM-dd');
          const e = format(l.endDate, 'yyyy-MM-dd');
          return s <= todayStr && todayStr <= e;
        })
        .map(l => l.technicianId)
    );
    return baseDisplayed.filter(t => !onLeaveIds.has(t.id));
  }, [baseDisplayed, profileSettings.hideUsersOnLeaveToday, technicianLeaves]);

  // Report the viewed range up so the parent (Auto-fill) targets the day on screen.
  useEffect(() => {
    onViewRangeChange?.(dateRange);
  }, [dateRange, onViewRangeChange]);

  // Generate date array from dateRange
  const dates = useMemo(() => {
    const dayCount = differenceInCalendarDays(dateRange.to, dateRange.from) + 1;
    return Array.from({ length: Math.max(1, dayCount) }, (_, i) => addDays(dateRange.from, i));
  }, [dateRange]);

  // Get zoom-based dimensions that ONLY affect calendar grid.
  // In auto mode (≤7 days) hourWidth is derived from the measured date area so the
  // days fill the full width edge-to-edge — all days visible, no horizontal scroll,
  // no empty gap. Job blocks use this same hourWidth, so they stay pixel-aligned.
  const getZoomDimensions = (): ZoomDimensions => {
    const zoomMap = {
      xs:  { dateWidth: 180, hourWidth: 18, hourTextSize: '10px' },
      sm:  { dateWidth: 220, hourWidth: 22, hourTextSize: '11px' },
      md:  { dateWidth: 280, hourWidth: 28, hourTextSize: '12px' },
      lg:  { dateWidth: 340, hourWidth: 34, hourTextSize: '13px' },
      xl:  { dateWidth: 400, hourWidth: 40, hourTextSize: '14px' },
      xxl: { dateWidth: 500, hourWidth: 50, hourTextSize: '15px' },
    } as const;
    const z = zoomMap[zoomLevel];
    const hours = Math.max(1, workingHours.length);

    // xl / xxl are explicit "zoom in" levels → always horizontal scroll.
    if (zoomLevel === 'xl' || zoomLevel === 'xxl') {
      return { dateWidth: z.dateWidth, hourWidth: z.hourWidth, widthMode: 'scroll', showHourLabels: true, hourTextSize: z.hourTextSize };
    }

    // More than 7 days → overview grid handles layout; keep nominal scroll sizing.
    if (dates.length > 7) {
      return { dateWidth: z.dateWidth, hourWidth: z.hourWidth, widthMode: 'scroll', showHourLabels: true, hourTextSize: z.hourTextSize };
    }

    const dateArea = dateAreaWidth;

    // Not measured yet → fall back to nominal auto (corrected on next layout pass).
    if (dateArea <= 0) {
      return { dateWidth: z.dateWidth, hourWidth: z.hourWidth, widthMode: 'auto', showHourLabels: true, hourTextSize: z.hourTextSize };
    }

    // Distribute the FULL available width across all visible days so the grid
    // always fills edge-to-edge (no empty gap before the sidebar). Fractional
    // px is fine — job blocks use this same hourWidth, so alignment is exact.
    const fillHour = dateArea / (dates.length * hours);

    // Too cramped to read at this many days → horizontal scroll at min width.
    if (fillHour < MIN_HOUR_WIDTH) {
      return { dateWidth: MIN_HOUR_WIDTH * hours, hourWidth: MIN_HOUR_WIDTH, widthMode: 'scroll', showHourLabels: true, hourTextSize: z.hourTextSize };
    }

    const hourTextSize = fillHour >= 34 ? '13px' : fillHour >= 26 ? '12px' : fillHour >= 20 ? '11px' : '10px';
    return { dateWidth: fillHour * hours, hourWidth: fillHour, widthMode: 'auto', showHourLabels: true, hourTextSize };
  };

  const dimensions = getZoomDimensions();

  // Filter jobs by status and active planning profile settings
  const filteredAssignedJobs = useMemo(() => {
    const merged = { ...assignedJobs, ...previewJobs };
    const {
      displayClosedDispatches,
      displayRejectedDispatches,
      displayCancelledDispatches,
      autoCollapseCompleted,
    } = profileSettings;

    const filtered: Record<string, Job[]> = {};
    for (const key of Object.keys(merged)) {
      filtered[key] = merged[key].filter(job => {
        const jobStatus = (job.status || 'pending').toLowerCase();
        // Profile-driven dispatch visibility
        if (!displayClosedDispatches && (jobStatus === 'closed' || jobStatus === 'completed')) return false;
        if (!displayRejectedDispatches && jobStatus === 'rejected') return false;
        if (!displayCancelledDispatches && jobStatus === 'cancelled') return false;
        if (autoCollapseCompleted && (jobStatus === 'completed' || jobStatus === 'closed')) return false;
        // Manual status filter from CalendarControls
        if (statusFilter !== 'all' && jobStatus !== statusFilter) return false;
        return true;
      });
    }
    return filtered;
  }, [assignedJobs, previewJobs, statusFilter, profileSettings]);

  // Per-technician dynamic row heights driven by stacked-lane count.
  // Keep in sync with CalendarGrid LANE_HEIGHT constant.
  const LANE_HEIGHT = profileSettings.compactRows ? 26 : 36;
  const MIN_ROW_HEIGHT = profileSettings.compactRows ? 56 : 80;
  const rowHeights = useMemo(() => {
    const heights: Record<string, number> = {};
    for (const tech of displayedTechnicians) {
      const buckets: Job[][] = [];
      for (const date of dates) {
        const key = `${tech.id}-${format(date, 'yyyy-MM-dd')}`;
        const list = filteredAssignedJobs[key];
        if (list && list.length > 0) buckets.push(list);
      }
      const lanes = buckets.length > 0 ? computeMaxLanes(buckets) : 1;
      heights[tech.id] = Math.max(MIN_ROW_HEIGHT, lanes * LANE_HEIGHT + 12);
    }
    return heights;
  }, [displayedTechnicians, dates, filteredAssignedJobs]);

  useEffect(() => {
    void loadAssignedJobs();
    loadTechnicianLeaves();
    loadTechnicianAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedTechnicians, dateRange, settings.includeWeekends, refreshTrigger]);

  const handleDragOver = (e: React.DragEvent, technicianId: string, date: Date, hour: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    // Enhanced drag over feedback with debouncing
    const newSlot = { technicianId, date, hour };
    if (!dragOverSlot || 
        dragOverSlot.technicianId !== newSlot.technicianId ||
        !isSameDay(dragOverSlot.date, newSlot.date) ||
        dragOverSlot.hour !== newSlot.hour) {
      setDragOverSlot(newSlot);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear drag over if we're actually leaving the calendar area
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.calendar-drop-zone')) {
      setDragOverSlot(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, technicianId: string, date: Date, hour: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);

    // Profile-driven safety gate: scheduling in the past
    if (!profileSettings.allowSchedulingInPast) {
      const slot = new Date(date);
      slot.setHours(hour, 0, 0, 0);
      if (slot.getTime() < Date.now() - 60 * 60 * 1000) {
        toast.error(t('dispatcher.profiles.cannot_schedule_past', { defaultValue: 'Scheduling in the past is disabled in your planning profile.' }));
        return;
      }
    }

    try {
      const dataText = e.dataTransfer.getData('application/json');
      if (!dataText) {
        throw new Error('No drag data found');
      }

      const data: DragData & { timestamp?: number; isReschedule?: boolean } = JSON.parse(dataText);

      // Validate drag data
      if (!data.type || !data.item) {
        throw new Error('Invalid drag data format');
      }

      // Profile-driven safety gate: scheduling jobs at all
      if (!data.isReschedule && !profileSettings.allowSchedulingJobs) {
        toast.error(t('dispatcher.profiles.scheduling_disabled', { defaultValue: 'Scheduling new jobs is disabled in your planning profile.' }));
        return;
      }
      // Profile-driven safety gate: moving existing dispatches
      if (data.isReschedule && !profileSettings.allowChangingDispatches) {
        toast.error(t('dispatcher.profiles.changing_disabled', { defaultValue: 'Changing dispatches is disabled in your planning profile.' }));
        return;
      }
      
      // Handle service order batch assignment
      if (data.type === 'serviceOrder') {
        const serviceOrder = data.item as ServiceOrder;
        const newScheduledStart = new Date(date);
        newScheduledStart.setHours(hour, 0, 0, 0);
        const technician = technicians.find(t => t.id === technicianId) || null;

        // Installation mode: split SO into installation groups -> 1 dispatch per installation.
        // Skip the per-job batch modal entirely and create dispatches directly.
        if (conversionMode === 'installation') {
          try {
            setIsBatchAssigning(true);
            const technicianName = technician ? `${technician.firstName} ${technician.lastName}` : undefined;
            const installationCount = new Set(
              (serviceOrder.jobs || [])
                .filter(j => j.installationId !== undefined && j.installationId !== null)
                .map(j => String(j.installationId))
            ).size;
            const ungroupedCount = (serviceOrder.jobs || []).filter(
              j => j.installationId === undefined || j.installationId === null
            ).length;

            const result = await DispatcherService.assignServiceOrderByInstallations(
              serviceOrder,
              technicianId,
              newScheduledStart,
              technicianName,
              'medium'
            );

            if (result.success.length > 0) {
              const summary = installationCount > 0
                ? `${installationCount} installation dispatch(es) created` + (ungroupedCount > 0 ? `, ${ungroupedCount} job(s) without installation dispatched individually` : '')
                : `${result.success.length} dispatch(es) created`;
              toast.success(summary);
            }
            if (result.failed.length > 0) {
              toast.warning(`${result.failed.length} job(s) failed to assign`);
            }
            // Notify parent + reload
            onJobAssignment(serviceOrder.id, technicianId, newScheduledStart, newScheduledStart);
            await loadAssignedJobs();
          } catch (err) {
            console.error('Failed installation-split assignment:', err);
            toast.error(err instanceof Error ? err.message : t('dispatcher.failed_to_assign_jobs'));
          } finally {
            setIsBatchAssigning(false);
          }
          return;
        }

        console.log('Preparing batch assignment:', {
          serviceOrderId: serviceOrder.id,
          jobCount: serviceOrder.jobs?.length || 0,
          technicianId
        });

        setPendingBatchAssignment({
          serviceOrder,
          technicianId,
          technician,
          scheduledStart: newScheduledStart
        });
        setShowBatchModal(true);
        return;
      }

      // Handle installation group → single dispatch assignment
      if (data.type === 'installationGroup') {
        const group = data.item as InstallationGroup;
        const newScheduledStart = new Date(date);
        newScheduledStart.setHours(hour, 0, 0, 0);
        const technician = technicians.find(t => t.id === technicianId) || null;

        // Calculate total duration from all jobs
        const totalDurationMinutes = group.jobs.reduce((sum, j) => sum + (j.estimatedDuration || 60), 0);
        const scheduledEnd = new Date(newScheduledStart.getTime() + totalDurationMinutes * 60 * 1000);

        // Collision check using total duration
        const dateKey = `${technicianId}-${format(date, 'yyyy-MM-dd')}`;
        const existingJobs = filteredAssignedJobs[dateKey] || [];
        const collision = CollisionService.checkCollision(newScheduledStart, scheduledEnd, existingJobs);

        const openInstallationModal = (chosenStart: Date) => {
          const chosenEnd = new Date(chosenStart.getTime() + totalDurationMinutes * 60 * 1000);
          setPendingInstallationAssignment({
            group,
            technicianId,
            technician,
            scheduledStart: chosenStart,
            scheduledEnd: chosenEnd,
          });
          setShowInstallationModal(true);
        };

        if (collision.hasCollision) {
          const nextSlot = CollisionService.findNextAvailableSlot(newScheduledStart, totalDurationMinutes, existingJobs);
          if (!profileSettings.confirmOnOverlap) {
            openInstallationModal(nextSlot ?? newScheduledStart);
            return;
          }
          setPendingOverlap({
            overlappingJobs: collision.overlappingJobs,
            proposedStart: newScheduledStart,
            proposedEnd: scheduledEnd,
            suggestedShiftTo: nextSlot,
            proceed: openInstallationModal,
          });
          return;
        }

        openInstallationModal(newScheduledStart);
        return;
      }
      
      // Check for stale drag data (older than 30 seconds)
      if (data.timestamp && Date.now() - data.timestamp > 30000) {
        throw new Error('Drag operation timed out');
      }
      
      const job = data.item as Job;
      
      // Use exact date and hour from drop location
      const newScheduledStart = new Date(date);
      newScheduledStart.setHours(hour, 0, 0, 0);
      
      // Find the technician for display
      const technician = technicians.find(t => t.id === technicianId) || null;
      
      // Check if this is a reschedule (existing dispatch) or new assignment
      if (data.isReschedule && job.scheduledStart && job.scheduledEnd) {
        // Ensure dates are proper Date objects (may come as strings from API)
        const jobStartDate = job.scheduledStart instanceof Date ? job.scheduledStart : new Date(job.scheduledStart);
        const jobEndDate = job.scheduledEnd instanceof Date ? job.scheduledEnd : new Date(job.scheduledEnd);
        
        // Calculate duration from original job
        const originalDuration = jobEndDate.getTime() - jobStartDate.getTime();
        const newScheduledEnd = new Date(newScheduledStart.getTime() + originalDuration);
        
        console.log('Preparing reschedule confirmation:', {
          jobId: job.id,
          technicianId,
          originalStart: jobStartDate.toISOString(),
          newScheduledStart: newScheduledStart.toISOString(),
          newScheduledEnd: newScheduledEnd.toISOString()
        });
        
        // Set pending reschedule and show confirmation modal
        setPendingReschedule({
          job,
          technicianId,
          technician,
          newScheduledStart,
          newScheduledEnd,
          originalStart: job.scheduledStart,
          originalEnd: job.scheduledEnd
        });
        setShowRescheduleModal(true);
      } else {
        // New assignment - use default 3 hour duration
        const scheduledEnd = addHours(newScheduledStart, 3);

        // Check for collisions with existing jobs
        const dateKey = `${technicianId}-${format(date, 'yyyy-MM-dd')}`;
        const existingJobs = filteredAssignedJobs[dateKey] || [];
        const collision = CollisionService.checkCollision(newScheduledStart, scheduledEnd, existingJobs);

        const techForJob = technicians.find(t => t.id === technicianId) || null;

        const openAssignmentModal = (chosenStart: Date) => {
          const chosenEnd = addHours(chosenStart, 3);
          setPendingAssignment({
            job,
            technicianId,
            technician: techForJob,
            scheduledStart: chosenStart,
            scheduledEnd: chosenEnd,
          });
          setShowAssignmentModal(true);
        };

        if (collision.hasCollision) {
          const nextSlot = CollisionService.findNextAvailableSlot(newScheduledStart, 180, existingJobs);
          if (!profileSettings.confirmOnOverlap) {
            openAssignmentModal(nextSlot ?? newScheduledStart);
            return;
          }
          setPendingOverlap({
            overlappingJobs: collision.overlappingJobs,
            proposedStart: newScheduledStart,
            proposedEnd: scheduledEnd,
            suggestedShiftTo: nextSlot,
            proceed: openAssignmentModal,
          });
          return;
        }

        openAssignmentModal(newScheduledStart);
      }
      
    } catch (error) {
      console.error('Failed to process drop:', error);
      const errorMessage = error instanceof Error ? error.message : t('dispatcher.failed_to_process_drop');
      toast.error(errorMessage);
    }
  };

  // Handle confirmed assignment with priority
  const handleConfirmAssignment = async (
    priority: DispatchPriority,
    scheduledStart: Date,
    scheduledEnd: Date,
  ) => {
    if (!pendingAssignment) return;

    setIsAssigning(true);

    try {
      const { job, technicianId, technician } = pendingAssignment;
      const technicianName = technician ? `${technician.firstName} ${technician.lastName}` : undefined;

      console.log('Confirming assignment:', {
        jobId: job.id,
        technicianId,
        technicianName,
        priority,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString()
      });

      await DispatcherService.assignJob(job.id, technicianId, scheduledStart, scheduledEnd, technicianName, priority);
      onJobAssignment(job.id, technicianId, scheduledStart, scheduledEnd);
      
      // Reload assigned jobs to show the new assignment
      await loadAssignedJobs();
      
      toast.success(t('dispatcher.job_assigned_success'));
      
      // Close modal and clear pending assignment
      setShowAssignmentModal(false);
      setPendingAssignment(null);
      
    } catch (error) {
      console.error('Failed to assign job:', error);
      const errorMessage = error instanceof Error ? error.message : t('dispatcher.failed_to_assign_job');
      toast.error(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle cancelled assignment
  const handleCancelAssignment = () => {
    setShowAssignmentModal(false);
    setPendingAssignment(null);
  };

  // Handle confirmed reschedule
  const handleConfirmReschedule = async () => {
    if (!pendingReschedule) return;
    
    setIsRescheduling(true);
    
    try {
      const { job, newScheduledStart } = pendingReschedule;
      
      console.log('Confirming reschedule:', {
        dispatchId: job.id,
        newScheduledStart: newScheduledStart.toISOString()
      });
      
      await DispatcherService.rescheduleDispatch(job.id, newScheduledStart);
      
      // Reload assigned jobs to show the update
      await loadAssignedJobs();
      
      toast.success(t('dispatcher.dispatch_rescheduled_success'));
      
      // Close modal and clear pending reschedule
      setShowRescheduleModal(false);
      setPendingReschedule(null);
      
    } catch (error) {
      console.error('Failed to reschedule dispatch:', error);
      const errorMessage = error instanceof Error ? error.message : t('dispatcher.failed_to_reschedule');
      toast.error(errorMessage);
    } finally {
      setIsRescheduling(false);
    }
  };

  // Handle cancelled reschedule
  const handleCancelReschedule = () => {
    setShowRescheduleModal(false);
    setPendingReschedule(null);
  };

  // Handle confirmed batch assignment (service order)
  const handleConfirmBatchAssignment = async (
    jobPriorities: Array<{ jobId: string; priority: 'low' | 'medium' | 'high' | 'urgent' }>,
    scheduledStart: Date,
  ) => {
    if (!pendingBatchAssignment) return;

    setIsBatchAssigning(true);

    try {
      const { serviceOrder, technicianId, technician } = pendingBatchAssignment;
      const technicianName = technician ? `${technician.firstName} ${technician.lastName}` : undefined;
      
      // Create a map for quick priority lookup
      const priorityMap = new Map(jobPriorities.map(jp => [jp.jobId, jp.priority]));
      
      console.log('Confirming batch assignment:', {
        serviceOrderId: serviceOrder.id,
        jobCount: serviceOrder.jobs.length,
        technicianId,
        technicianName,
        scheduledStart: scheduledStart.toISOString(),
        jobPriorities
      });
      
      // Prepare jobs array for batch assignment with priorities
      const jobsToAssign = serviceOrder.jobs.map(job => ({
        id: job.id,
        estimatedDuration: job.estimatedDuration || 60,
        priority: priorityMap.get(job.id) || 'medium' as const
      }));
      
      // Assign all jobs in the service order sequentially
      await DispatcherService.assignServiceOrderJobs(
        serviceOrder.id,
        jobsToAssign,
        technicianId,
        scheduledStart,
        technicianName
      );
      
      // Notify parent for each job assignment
      let currentStart = new Date(scheduledStart);
      for (const job of serviceOrder.jobs) {
        const duration = job.estimatedDuration || 60;
        const jobEnd = new Date(currentStart.getTime() + duration * 60 * 1000);
        onJobAssignment(job.id, technicianId, currentStart, jobEnd);
        currentStart = jobEnd;
      }
      
      // Reload assigned jobs to show the new assignments
      await loadAssignedJobs();
      
      toast.success(t('dispatcher.jobs_assigned_success', { count: serviceOrder.jobs.length }));
      
      // Close modal and clear pending assignment
      setShowBatchModal(false);
      setPendingBatchAssignment(null);
      
    } catch (error) {
      console.error('Failed to batch assign jobs:', error);
      const errorMessage = error instanceof Error ? error.message : t('dispatcher.failed_to_assign_jobs');
      toast.error(errorMessage);
    } finally {
      setIsBatchAssigning(false);
    }
  };

  // Handle cancelled batch assignment
  const handleCancelBatchAssignment = () => {
    setShowBatchModal(false);
    setPendingBatchAssignment(null);
  };

  // Handle confirmed installation assignment
  const handleConfirmInstallationAssignment = async (
    priority: 'low' | 'medium' | 'high' | 'urgent',
    scheduledStart: Date,
    scheduledEnd: Date,
  ) => {
    if (!pendingInstallationAssignment) return;

    setIsInstallationAssigning(true);

    try {
      const { group, technicianId, technician } = pendingInstallationAssignment;
      const technicianName = technician ? `${technician.firstName} ${technician.lastName}` : undefined;

      await DispatcherService.assignInstallationGroup(group, technicianId, scheduledStart, scheduledEnd, technicianName, priority);

      // Notify parent
      onJobAssignment(group.installationId, technicianId, scheduledStart, scheduledEnd);

      await loadAssignedJobs();

      toast.success(t('dispatcher.installation_assigned_success', {
        name: group.installationName,
        count: group.jobs.length
      }));

      setShowInstallationModal(false);
      setPendingInstallationAssignment(null);
    } catch (error) {
      console.error('Failed to assign installation:', error);
      const errorMessage = error instanceof Error ? error.message : t('dispatcher.failed_to_assign_installation');
      toast.error(errorMessage);
    } finally {
      setIsInstallationAssigning(false);
    }
  };

  const handleCancelInstallationAssignment = () => {
    setShowInstallationModal(false);
    setPendingInstallationAssignment(null);
  };

  const handleJobResize = useCallback(async (jobId: string, newEnd: Date) => {
    try {
      await DispatcherService.resizeJob(jobId, newEnd);
      const refreshedJobs = await loadAssignedJobs();
      const updatedJob = Object.values(refreshedJobs).flat().find(job => job.id === jobId) || null;
      if (updatedJob) setSelectedJob(updatedJob);
      toast.success(t('dispatcher.job_duration_updated'));
    } catch (error) {
      console.error('Failed to resize job:', error);
      toast.error(t('dispatcher.failed_to_resize_job'));
    }
  }, [loadAssignedJobs, t]);

  const handleJobClick = useCallback((job: Job) => {
    // Allow clicking on locked jobs to show their locked status
    setSelectedJob(job);
    setShowConfirmModal(true);
  }, []);

  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmJob = async () => {
    if (!selectedJob) return;
    
    // Check if already locked
    if (DispatcherService.isDispatchLocked(selectedJob.id)) {
      toast.info("This dispatch is already locked");
      return;
    }
    
    setIsConfirming(true);
    try {
      await DispatcherService.lockJob(selectedJob.id);
      await loadAssignedJobs();
      setShowConfirmModal(false);
      setSelectedJob(null);
      toast.success(t('dispatcher.dispatch_confirmed_locked_success'));
    } catch (error) {
      console.error('Failed to lock job:', error);
      toast.error(t('dispatcher.failed_to_confirm_job'));
    } finally {
      setIsConfirming(false);
    }
  };

  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlockJob = async () => {
    if (!selectedJob) return;
    
    setIsUnlocking(true);
    try {
      await DispatcherService.unlockJob(selectedJob.id);
      await loadAssignedJobs();
      // Refresh dispatches cache so lock status updates
      await DispatcherService.fetchDispatches();
      setShowConfirmModal(false);
      setSelectedJob(null);
      toast.success(t('dispatcher.dispatch_unlocked_success', 'Dispatch unlocked successfully'));
    } catch (error) {
      console.error('Failed to unlock job:', error);
      toast.error(t('dispatcher.failed_to_unlock_job', 'Failed to unlock dispatch'));
    } finally {
      setIsUnlocking(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleUnassignJob = async () => {
    if (!selectedJob) return;

    // Profile-driven safety gate
    if (!profileSettings.allowUnassigningDispatches) {
      toast.error(t('dispatcher.profiles.unassign_disabled', { defaultValue: 'Unassigning dispatches is disabled in your planning profile.' }));
      return;
    }

    // Check if locked
    if (DispatcherService.isDispatchLocked(selectedJob.id)) {
      toast.error(t('dispatcher.dispatch_locked_error'));
      return;
    }
    
    setIsDeleting(true);
    try {
      await DispatcherService.unassignJob(selectedJob.id);
      // Reload assigned jobs to update calendar
      await loadAssignedJobs();
      setShowConfirmModal(false);
      setSelectedJob(null);
      toast.success(t('dispatcher.dispatch_deleted_success'));
      // Notify parent to refresh unassigned jobs list
      onDispatchDeleted?.();
    } catch (error) {
      console.error('Failed to delete dispatch:', error);
      const errorMessage = error instanceof Error ? error.message : t('dispatcher.failed_to_delete_dispatch');
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleScheduleChange = async (jobId: string, newStart: Date, newEnd: Date) => {
    try {
      const durationMinutes = Math.round((newEnd.getTime() - newStart.getTime()) / 60000);
      if (durationMinutes < 15) {
        toast.error(t('dispatcher.duration_too_short', 'Duration must be at least 15 minutes'));
        throw new Error('Duration too short');
      }

      await DispatcherService.updateSchedule(jobId, newStart, newEnd);
      const refreshedJobs = await loadAssignedJobs();
      const updatedJob = Object.values(refreshedJobs).flat().find(job => job.id === jobId) || null;
      if (updatedJob) setSelectedJob(updatedJob);
      onDispatchDeleted?.(); // refresh unassigned list too
      toast.success(t('dispatcher.schedule_updated'));
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast.error(t('dispatcher.schedule_update_failed'));
      throw error;
    }
  };

  const loadAssignedJobs = useCallback(async (): Promise<Record<string, Job[]>> => {
    if (displayedTechnicians.length === 0 || dates.length === 0) return {};

    try {
      const techIds = displayedTechnicians.map(t => t.id);
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      
      // Use bulk fetch for better performance - single API call for all technicians and dates
      const allJobs = await DispatcherService.getAssignedJobsForDateRange(techIds, startDate, endDate);
      
      // Ensure all expected keys exist (even if empty)
      const jobs: Record<string, Job[]> = {};
      for (const technician of displayedTechnicians) {
        for (const date of dates) {
          const key = `${technician.id}-${format(date, 'yyyy-MM-dd')}`;
          jobs[key] = allJobs[key] || [];
        }
      }
      
      setAssignedJobs(jobs);
      return jobs;
    } catch (error) {
      console.error('Failed to load assigned jobs:', error);
      return {};
    }
  }, [displayedTechnicians, dates]);

  const loadTechnicianLeaves = async () => {
    console.log('Loading technician leaves...');
    const allLeaves: TechnicianLeave[] = [];
    
    try {
      // Fetch leaves for all displayed technicians
      const fetchPromises = displayedTechnicians.map(async (technician) => {
        try {
          // Extract numeric ID from technician.id (handles formats like 'admin-22')
          const numericId = technician.id.match(/\d+/)?.[0] || technician.id;
          const leaves = await schedulesApi.getLeaves(numericId);
          
          return leaves.map((leave: UserLeave) => ({
            id: leave.id,
            technicianId: technician.id,
            leaveType: leave.leaveType,
            startDate: new Date(leave.startDate),
            endDate: new Date(leave.endDate),
            status: leave.status,
            reason: leave.reason
          }));
        } catch (err) {
          console.warn(`Failed to load leaves for technician ${technician.id}:`, err);
          return [];
        }
      });
      
      const results = await Promise.all(fetchPromises);
      results.forEach(techLeaves => allLeaves.push(...techLeaves));
      
      console.log('All technician leaves loaded:', allLeaves);
      setTechnicianLeaves(allLeaves);
    } catch (error) {
      console.error('Failed to load technician leaves:', error);
    }
  };

  // Load technician availability (working hours, status) for calendar display
  const loadTechnicianAvailability = async () => {
    console.log('Loading technician availability...');
    const allAvailability: TechnicianAvailability[] = [];
    
    try {
      const fetchPromises = displayedTechnicians.map(async (technician) => {
        try {
          const numericId = technician.id.match(/\d+/)?.[0] || technician.id;
          const schedule = await schedulesApi.getSchedule(numericId);
          
          return {
            technicianId: technician.id,
            status: schedule.status || 'available',
            scheduleNote: schedule.scheduleNote,
            daySchedules: schedule.daySchedules || {}
          } as TechnicianAvailability;
        } catch (err) {
          console.warn(`Failed to load availability for technician ${technician.id}:`, err);
          // Return default availability (all days working, available status)
          return {
            technicianId: technician.id,
            status: 'available',
            daySchedules: {}
          } as TechnicianAvailability;
        }
      });
      
      const results = await Promise.all(fetchPromises);
      allAvailability.push(...results);
      
      console.log('All technician availability loaded:', allAvailability);
      setTechnicianAvailability(allAvailability);
    } catch (error) {
      console.error('Failed to load technician availability:', error);
    }
  };

  // preview handler updates previewJobs map without persisting to service
  const handlePreviewResize = useCallback((jobId: string, newEnd: Date) => {
    setPreviewJobs(prev => {
      // find job location in current assignedJobs
      const updated = { ...prev };
      for (const key of Object.keys(assignedJobs)) {
        const idx = assignedJobs[key].findIndex(j => j.id === jobId);
        if (idx >= 0) {
          const cloned = assignedJobs[key].map(j => ({ ...j }));
          cloned[idx].scheduledEnd = newEnd;
          updated[key] = cloned;
          return updated;
        }
      }
      return prev;
    });
  }, [assignedJobs]);

  const navigateDays = (direction: 'prev' | 'next') => {
    const span = differenceInCalendarDays(dateRange.to, dateRange.from) + 1;
    const step = direction === 'next' ? span : -span;
    setDateRange(prev => ({
      from: addDays(prev.from, step),
      to: addDays(prev.to, step),
    }));
  };

  const goToToday = () => {
    const span = differenceInCalendarDays(dateRange.to, dateRange.from);
    const today = new Date();
    setDateRange({ from: today, to: addDays(today, span) });
  };

  const isOverviewMode = dates.length > 7;

  return (
    <div ref={calendarRootRef} className="h-full flex flex-col overflow-hidden bg-background">
      <CalendarControls
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onNavigateDays={navigateDays}
        onGoToToday={goToToday}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {showSettings && (
        <CalendarSettingsPanel
          settings={settings}
          onSettingsChange={() => { /* managed by active planning profile */ }}
        />
      )}

      {isOverviewMode ? (
        /* Overview Calendar Mode (>7 days) */
        <OverviewCalendarGrid
          dates={dates}
          technicians={displayedTechnicians}
          assignedJobs={filteredAssignedJobs}
          leaves={technicianLeaves}
          availability={technicianAvailability}
          includeWeekends={settings.includeWeekends}
          onDrop={handleDrop}
          onJobClick={handleJobClick}
        />
      ) : (
        /* Detailed Planning Mode (≤7 days) */
        <>
          <CalendarHeader
            dates={dates}
            workingHours={workingHours}
            dimensions={dimensions}
            includeWeekends={settings.includeWeekends}
          />
          
          <div ref={setViewportRef} className="flex-1 overflow-y-auto">
            <div className="flex h-full">
              <TechnicianList technicians={displayedTechnicians} rowHeights={rowHeights} />
              
              <CalendarGrid
                dates={dates}
                technicians={displayedTechnicians}
                workingHours={workingHours}
                assignedJobs={filteredAssignedJobs}
                leaves={technicianLeaves}
                availability={technicianAvailability}
                dimensions={dimensions}
                dragOverSlot={dragOverSlot}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onJobResize={handleJobResize}
                onJobClick={handleJobClick}
                onPreviewResize={handlePreviewResize}
                includeWeekends={settings.includeWeekends}
              />
            </div>
          </div>
        </>
      )}
      
      {/* Modals - always rendered */}
      <JobConfirmationModal
        job={selectedJob}
        technician={selectedJob ? displayedTechnicians.find(t => t.id === selectedJob.assignedTechnicianId) || null : null}
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmJob}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedJob(null);
        }}
        onUnassign={handleUnassignJob}
        onUnlock={handleUnlockJob}
        onDurationChange={handleJobResize}
        onScheduleChange={handleScheduleChange}
        isDeleting={isDeleting}
        isConfirming={isConfirming}
        isUnlocking={isUnlocking}
      />
      
      <AssignmentConfirmationModal
        job={pendingAssignment?.job || null}
        technician={pendingAssignment?.technician || null}
        scheduledDate={pendingAssignment?.scheduledStart || null}
        scheduledStart={pendingAssignment?.scheduledStart || null}
        scheduledEnd={pendingAssignment?.scheduledEnd || null}
        open={showAssignmentModal}
        onOpenChange={setShowAssignmentModal}
        onConfirm={handleConfirmAssignment}
        onCancel={handleCancelAssignment}
        isLoading={isAssigning}
      />
      
      <RescheduleConfirmationModal
        job={pendingReschedule?.job || null}
        technician={pendingReschedule?.technician || null}
        originalStart={pendingReschedule?.originalStart || null}
        originalEnd={pendingReschedule?.originalEnd || null}
        newScheduledStart={pendingReschedule?.newScheduledStart || null}
        newScheduledEnd={pendingReschedule?.newScheduledEnd || null}
        open={showRescheduleModal}
        onOpenChange={setShowRescheduleModal}
        onConfirm={handleConfirmReschedule}
        onCancel={handleCancelReschedule}
        isLoading={isRescheduling}
      />
      
      <BatchAssignmentModal
        serviceOrder={pendingBatchAssignment?.serviceOrder || null}
        technician={pendingBatchAssignment?.technician || null}
        scheduledStart={pendingBatchAssignment?.scheduledStart || null}
        open={showBatchModal}
        onOpenChange={setShowBatchModal}
        onConfirm={handleConfirmBatchAssignment}
        onCancel={handleCancelBatchAssignment}
        isLoading={isBatchAssigning}
      />

      <InstallationAssignmentModal
        installationGroup={pendingInstallationAssignment?.group || null}
        technician={pendingInstallationAssignment?.technician || null}
        scheduledStart={pendingInstallationAssignment?.scheduledStart || null}
        scheduledEnd={pendingInstallationAssignment?.scheduledEnd || null}
        open={showInstallationModal}
        onOpenChange={setShowInstallationModal}
        onConfirm={handleConfirmInstallationAssignment}
        onCancel={handleCancelInstallationAssignment}
        isLoading={isInstallationAssigning}
      />

      {pendingOverlap && (
        <OverlapConfirmDialog
          open={!!pendingOverlap}
          overlappingJobs={pendingOverlap.overlappingJobs}
          proposedStart={pendingOverlap.proposedStart}
          proposedEnd={pendingOverlap.proposedEnd}
          suggestedShiftTo={pendingOverlap.suggestedShiftTo}
          onForce={() => {
            const p = pendingOverlap;
            setPendingOverlap(null);
            p.proceed(p.proposedStart);
          }}
          onAutoShift={() => {
            const p = pendingOverlap;
            if (!p.suggestedShiftTo) return;
            setPendingOverlap(null);
            toast.info(`Shifted to ${format(p.suggestedShiftTo, 'HH:mm')}`);
            p.proceed(p.suggestedShiftTo);
          }}
          onCancel={() => setPendingOverlap(null)}
        />
      )}
    </div>
  );
}