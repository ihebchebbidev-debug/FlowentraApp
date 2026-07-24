import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, AlertTriangle, Building2, ArrowLeft, Users, Clock as ClockIcon, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usersApi } from "@/services/api/usersApi";
import { dispatchesApi, type Dispatch } from "@/services/api/dispatchesApi";
import { skillsApi, type Skill, type UserSkill } from "@/services/api/skillsApi";
import type { User } from "@/types/users";

interface JobOption {
  id: string;
  title: string;
  status: string;
  installationId?: string;
  installationName?: string;
  estimatedDuration?: number;
}

interface ServiceOrderLite {
  id: number | string;
  siteAddress?: string;
  contactId?: number;
}

interface PlanDispatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrder: ServiceOrderLite;
  jobs: JobOption[];
  jobConversionMode: 'installation' | 'service';
  onCreated: () => void;
}

type Priority = 'low' | 'medium' | 'high' | 'urgent';

function pad(n: number) { return String(n).padStart(2, '0'); }
function toTimeSpan(t: string) { return t.length === 5 ? `${t}:00` : t; }
function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(24 * 60 - 1, Math.max(0, h * 60 + m + Math.max(0, minutes)));
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${pad(nh)}:${pad(nm)}`;
}
function addHoursToTime(time: string, hours: number): string {
  return addMinutesToTime(time, hours * 60);
}

export function PlanDispatchModal({
  open,
  onOpenChange,
  serviceOrder,
  jobs,
  jobConversionMode,
  onCreated,
}: PlanDispatchModalProps) {
  const { t } = useTranslation('service_orders');
  // Eligible jobs = not dispatched / not cancelled
  const eligibleJobs = useMemo(
    () => jobs.filter(j => j.status !== 'dispatched' && j.status !== 'cancelled'),
    [jobs]
  );

  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [startTime, setStartTime] = useState<string>(() => {
    const now = new Date();
    const nextHour = (now.getHours() + 1) % 24;
    return `${pad(nextHour)}:00`;
  });
  const [endTime, setEndTime] = useState<string>(() => {
    const now = new Date();
    const nextHour = (now.getHours() + 1) % 24;
    return `${pad((nextHour + 2) % 24)}:00`;
  });
  const [technicianIds, setTechnicianIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes] = useState<string>('');
  const [siteAddress, setSiteAddress] = useState<string>(serviceOrder.siteAddress || '');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [techSearch, setTechSearch] = useState<string>('');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillFilterIds, setSkillFilterIds] = useState<number[]>([]);
  const [userSkillsMap, setUserSkillsMap] = useState<Record<string, number[]>>({});
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictsByTech, setConflictsByTech] = useState<Record<string, Dispatch[]>>({});
  const [splitByInstallation, setSplitByInstallation] = useState<boolean>(true);
  const [sequenceBackToBack, setSequenceBackToBack] = useState<boolean>(true);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [focusedConflict, setFocusedConflict] = useState<{
    techId: string;
    dispatchId: string | number;
    dispatchNumber?: string | number;
    startStr: string;
    endStr: string;
    status?: string;
  } | null>(null);
  const scheduleRef = useRef<HTMLDivElement | null>(null);
  const groupRefsRef = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const setGroupRef = useCallback((key: string) => (el: HTMLDivElement | null) => {
    groupRefsRef.current.set(key, el);
  }, []);

  // Preselect all eligible jobs on open
  useEffect(() => {
    if (open) {
      setSelectedJobIds(eligibleJobs.map(j => j.id));
      setSiteAddress(serviceOrder.siteAddress || '');
      setShowPreview(false);
      setFocusedConflict(null);
      setSequenceBackToBack(true);
    }
  }, [open, eligibleJobs, serviceOrder.siteAddress]);

  // Load users for technician picker
  useEffect(() => {
    if (!open) return;
    setLoadingUsers(true);
    usersApi.getAll()
      .then(res => setUsers(res.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [open]);

  // Reset skill filter + search each time the modal opens
  useEffect(() => {
    if (open) {
      setTechSearch('');
      setSkillFilterIds([]);
    }
  }, [open]);

  // Load all skills (for filter chips) when the modal opens
  useEffect(() => {
    if (!open) return;
    skillsApi.getAll()
      .then(list => setAllSkills(Array.isArray(list) ? list : []))
      .catch(() => setAllSkills([]));
  }, [open]);

  // Load per-user skill assignments in parallel once users are known
  useEffect(() => {
    if (!open || users.length === 0) {
      setUserSkillsMap({});
      return;
    }
    let cancelled = false;
    setLoadingSkills(true);
    const active = users.filter(u => u.isActive !== false);
    Promise.all(
      active.map(u =>
        skillsApi.getUserSkills(u.id)
          .then((list: UserSkill[]) => [String(u.id), (list || []).map(s => s.skillId)] as const)
          .catch(() => [String(u.id), [] as number[]] as const)
      )
    ).then(entries => {
      if (cancelled) return;
      const map: Record<string, number[]> = {};
      for (const [id, ids] of entries) map[id] = ids;
      setUserSkillsMap(map);
    }).finally(() => {
      if (!cancelled) setLoadingSkills(false);
    });
    return () => { cancelled = true; };
  }, [open, users]);


  const selectedJobs = useMemo(
    () => eligibleJobs.filter(j => selectedJobIds.includes(j.id)),
    [eligibleJobs, selectedJobIds]
  );

  // Group selected jobs by installationId ('' = no installation).
  const jobsByInstallation = useMemo(() => {
    const groups = new Map<string, JobOption[]>();
    for (const j of selectedJobs) {
      const key = j.installationId || '';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(j);
    }
    return groups;
  }, [selectedJobs]);

  const mixedInstallations = useMemo(() => {
    if (selectedJobs.length < 2) return false;
    const ids = new Set(selectedJobs.map(j => j.installationId || '__none__'));
    return ids.size > 1;
  }, [selectedJobs]);

  const willSplit = mixedInstallations && splitByInstallation && jobConversionMode === 'installation';

  // Decide creation path (mirrors DispatchingInterface logic)
  const creationPath = useMemo(() => {
    if (selectedJobs.length === 0) return null;
    if (willSplit) return 'split-by-installation' as const;
    if (selectedJobs.length === 1) return 'from-job' as const;
    const installationIds = new Set(selectedJobs.map(j => j.installationId || ''));
    const singleInstallation = installationIds.size === 1 && !installationIds.has('');
    if (singleInstallation && jobConversionMode === 'installation') return 'from-installation' as const;
    return 'from-service-order' as const;
  }, [selectedJobs, jobConversionMode, willSplit]);

  // Per-group start/end when sequencing back-to-back. Uses each group's aggregate
  // estimatedDuration (fallback 60min) staggered from the form start time.
  const groupSchedules = useMemo(() => {
    const map = new Map<string, { start: string; end: string }>();
    if (!willSplit) return map;
    let cursor = startTime;
    for (const [key, jobs] of jobsByInstallation.entries()) {
      const duration = jobs.reduce((s, j) => s + (j.estimatedDuration || 0), 0) || 60;
      const gStart = sequenceBackToBack ? cursor : startTime;
      const gEnd = sequenceBackToBack ? addMinutesToTime(cursor, duration) : endTime;
      map.set(key, { start: gStart, end: gEnd });
      if (sequenceBackToBack) cursor = gEnd;
    }
    return map;
  }, [willSplit, sequenceBackToBack, jobsByInstallation, startTime, endTime]);


  // Validation
  const timeValid = endTime > startTime;
  // Reject dates clearly in the past (before today, browser-local). Same-day past
  // times are allowed since same-day "log after the fact" is a real workflow.
  const dateValid = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const picked = new Date(date);
    picked.setHours(0, 0, 0, 0);
    return picked.getTime() >= today.getTime();
  })();
  // Guard against zero/negative duration (defensive; timeValid already covers <=).
  const durationValid = (() => {
    if (!timeValid) return false;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm) >= 1;
  })();
  const hasConflicts = Object.values(conflictsByTech).some(list => list.length > 0);
  const canSubmit =
    selectedJobIds.length > 0 &&
    technicianIds.length > 0 &&
    timeValid &&
    dateValid &&
    durationValid &&
    !hasConflicts &&
    !checkingConflicts &&
    !submitting;

  // Compute proposed slot as a stable key for the effect
  const proposedStartISO = useMemo(() => {
    if (!timeValid) return null;
    const d = new Date(date);
    const [h, m] = startTime.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }, [date, startTime, timeValid]);
  // Effective end time for conflict checking. When split-mode sequencing is enabled,
  // per-group windows may extend past the user's picked endTime. Take the max so the
  // outer envelope covers every sequenced group, otherwise a technician can be booked
  // elsewhere during the tail and we'd miss the conflict.
  const effectiveEndTime = useMemo(() => {
    if (!willSplit || !sequenceBackToBack || groupSchedules.size === 0) return endTime;
    let maxEnd = endTime;
    for (const slot of groupSchedules.values()) {
      if (slot.end > maxEnd) maxEnd = slot.end;
    }
    return maxEnd;
  }, [willSplit, sequenceBackToBack, groupSchedules, endTime]);

  const proposedEndISO = useMemo(() => {
    if (!timeValid) return null;
    const d = new Date(date);
    const [h, m] = effectiveEndTime.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }, [date, effectiveEndTime, timeValid]);

  // Fetch existing dispatches per selected tech on the picked date and detect overlaps
  useEffect(() => {
    if (!open) return;
    if (!proposedStartISO || !proposedEndISO || technicianIds.length === 0) {
      setConflictsByTech({});
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      setCheckingConflicts(true);
      try {
        const day = new Date(date);
        day.setHours(0, 0, 0, 0);
        const dateFrom = day.toISOString();
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        const dateTo = dayEnd.toISOString();

        const propStart = new Date(proposedStartISO).getTime();
        const propEnd = new Date(proposedEndISO).getTime();

        const results = await Promise.all(
          technicianIds.map(async (techId) => {
            const res = await dispatchesApi.getAll({ technicianId: techId, dateFrom, dateTo, pageSize: 100 });
            const overlaps = (res.data || []).filter((d) => {
              if (!d) return false;
              if (d.status === 'cancelled' || d.status === 'completed' || d.status === 'rejected') return false;
              const scheduledDateStr = d.scheduling?.scheduledDate || d.scheduledDate;
              const startStr = d.scheduling?.scheduledStartTime || d.scheduledStartTime;
              const endStr = d.scheduling?.scheduledEndTime || d.scheduledEndTime;
              if (!scheduledDateStr || !startStr || !endStr) return false;
              const base = new Date(scheduledDateStr);
              const [sh, sm] = String(startStr).split(':').map(Number);
              const [eh, em] = String(endStr).split(':').map(Number);
              const dStart = new Date(base); dStart.setHours(sh, sm || 0, 0, 0);
              const dEnd = new Date(base); dEnd.setHours(eh, em || 0, 0, 0);
              // Belt-and-suspenders: also ensure the tech is actually assigned to this dispatch
              const assigned = (d.assignedTechnicianIds || []).map(String);
              const techAssigned = assigned.length === 0 ? true : assigned.includes(techId);
              return techAssigned && dStart.getTime() < propEnd && propStart < dEnd.getTime();
            });
            return [techId, overlaps] as const;
          })
        );
        if (cancelled) return;
        const next: Record<string, Dispatch[]> = {};
        for (const [techId, list] of results) next[techId] = list;
        setConflictsByTech(next);
      } catch (err) {
        console.error('Conflict check failed:', err);
        if (!cancelled) setConflictsByTech({});
      } finally {
        if (!cancelled) setCheckingConflicts(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [open, date, proposedStartISO, proposedEndISO, technicianIds]);


  const toggleJob = (id: string) => {
    setSelectedJobIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleTech = (id: string) => {
    setTechnicianIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !creationPath) return;
    setSubmitting(true);
    try {
      const scheduledDate = new Date(date);
      scheduledDate.setHours(0, 0, 0, 0);
      const common = {
        assignedTechnicianIds: technicianIds,
        scheduledDate: scheduledDate.toISOString(),
        scheduledStartTime: toTimeSpan(startTime),
        scheduledEndTime: toTimeSpan(endTime),
        priority,
        notes: notes || undefined,
        siteAddress: siteAddress || undefined,
      };

      if (creationPath === 'from-job') {
        const jobId = parseInt(selectedJobs[0].id, 10);
        await dispatchesApi.createFromJob(jobId, common);
      } else if (creationPath === 'from-installation') {
        const j = selectedJobs[0];
        await dispatchesApi.createFromInstallation({
          ...common,
          installationId: parseInt(j.installationId!, 10),
          installationName: j.installationName || `Installation #${j.installationId}`,
          jobIds: selectedJobs.map(x => parseInt(x.id, 10)).filter(n => !isNaN(n)),
          contactId: serviceOrder.contactId,
          serviceOrderId: parseInt(String(serviceOrder.id), 10),
        });
      } else if (creationPath === 'split-by-installation') {
        // Create one dispatch per installation group; jobs without an installation
        // are bundled into a single from-service-order dispatch. When
        // sequenceBackToBack is enabled, each dispatch gets its own start/end
        // (staggered by group duration) so the technicians are not double-booked
        // across sibling dispatches.
        const soId = parseInt(String(serviceOrder.id), 10);
        const tasks: Promise<unknown>[] = [];
        for (const [installKey, groupJobs] of jobsByInstallation.entries()) {
          const jobIds = groupJobs.map(x => parseInt(x.id, 10)).filter(n => !isNaN(n));
          if (jobIds.length === 0) continue;
          const slot = groupSchedules.get(installKey);
          const groupCommon = {
            ...common,
            scheduledStartTime: toTimeSpan(slot?.start ?? startTime),
            scheduledEndTime: toTimeSpan(slot?.end ?? endTime),
          };
          if (installKey === '') {
            tasks.push(dispatchesApi.createFromServiceOrder({
              ...groupCommon,
              serviceOrderId: soId,
              jobIds,
              contactId: serviceOrder.contactId,
            }));
          } else {
            const first = groupJobs[0];
            tasks.push(dispatchesApi.createFromInstallation({
              ...groupCommon,
              installationId: parseInt(installKey, 10),
              installationName: first.installationName || `Installation #${installKey}`,
              jobIds,
              contactId: serviceOrder.contactId,
              serviceOrderId: soId,
            }));
          }
        }
        await Promise.all(tasks);
        toast.success(
          t('plan_dispatch.split_success', {
            count: tasks.length,
            defaultValue: '{{count}} dispatches created (one per installation).',
          })
        );
        onCreated();
        onOpenChange(false);
        return;
      } else {
        await dispatchesApi.createFromServiceOrder({
          ...common,
          serviceOrderId: parseInt(String(serviceOrder.id), 10),
          jobIds: selectedJobs.map(x => parseInt(x.id, 10)).filter(n => !isNaN(n)),
          contactId: serviceOrder.contactId,
        });
      }

      toast.success(t('plan_dispatch.success'));
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to plan dispatch:', err);
      toast.error(err?.message || t('plan_dispatch.error'));
    } finally {
      setSubmitting(false);
    }
  };




  const techNamesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) map.set(String(u.id), `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `#${u.id}`);
    return map;
  }, [users]);

  const previewGroups = useMemo(() => {
    return Array.from(jobsByInstallation.entries()).map(([key, jobs]) => {
      const first = jobs[0];
      const label = key === ''
        ? t('plan_dispatch.no_installation_label', 'No installation')
        : (first.installationName || `Installation #${key}`);
      const duration = jobs.reduce((sum, j) => sum + (j.estimatedDuration || 0), 0);
      const slot = groupSchedules.get(key);
      return {
        key,
        label,
        jobs,
        duration,
        viaServiceOrder: key === '',
        start: slot?.start ?? startTime,
        end: slot?.end ?? endTime,
      };
    });
  }, [jobsByInstallation, t, groupSchedules, startTime, endTime]);

  const handlePrimary = () => {
    if (willSplit && !showPreview) {
      setShowPreview(true);
      return;
    }
    handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[95vw] max-w-[calc(100vw-1rem)] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 gap-3 sm:gap-4">
        <DialogHeader>
          <DialogTitle>
            {showPreview
              ? t('plan_dispatch.preview_title', { count: previewGroups.length, defaultValue: 'Review split · {{count}} dispatches' })
              : t('plan_dispatch.title')}
          </DialogTitle>
          <DialogDescription>
            {showPreview
              ? t('plan_dispatch.preview_description', 'Review how selected jobs will be grouped before creating the dispatches.')
              : t('plan_dispatch.description')}
          </DialogDescription>
        </DialogHeader>

        {showPreview ? (
          <ScrollArea className="flex-1 pr-3 -mr-3">
            <div className="space-y-4 pb-2">
              {/* Shared schedule summary */}
              <div
                ref={scheduleRef}
                className={cn(
                  "rounded-md border bg-muted/30 p-3 grid grid-cols-2 gap-2 text-xs transition-all",
                  focusedConflict && "ring-2 ring-destructive/60 border-destructive/40 bg-destructive/5"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{format(date, 'PPP')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{startTime} → {endTime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium truncate">
                    {technicianIds.length === 0
                      ? t('plan_dispatch.preview_no_techs', 'No technicians')
                      : technicianIds.map(id => (
                          <span
                            key={id}
                            className={cn(
                              "inline-block",
                              focusedConflict?.techId === String(id) && "text-destructive font-semibold underline decoration-destructive/60"
                            )}
                          >
                            {techNamesById.get(String(id)) || `#${id}`}
                            {technicianIds.indexOf(id) < technicianIds.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium capitalize">{priority}</span>
                </div>
                {focusedConflict && (
                  <div className="col-span-2 mt-1 rounded-sm border border-destructive/40 bg-destructive/10 px-2 py-1.5 flex items-center justify-between gap-2">
                    <span className="text-px-11 text-destructive font-medium truncate">
                      {t('plan_dispatch.preview_focused_overlap', {
                        number: focusedConflict.dispatchNumber || focusedConflict.dispatchId,
                        start: focusedConflict.startStr,
                        end: focusedConflict.endStr,
                        name: techNamesById.get(focusedConflict.techId) || `#${focusedConflict.techId}`,
                        defaultValue: 'Overlaps with #{{number}} · {{start}}–{{end}} on {{name}}',
                      })}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-px-11 text-destructive hover:text-destructive"
                      onClick={() => setFocusedConflict(null)}
                    >
                      {t('plan_dispatch.preview_clear_focus', 'Clear')}
                    </Button>
                  </div>
                )}
              </div>

              {hasConflicts && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">
                      {t('plan_dispatch.preview_conflicts_warning', 'Some technicians have overlapping dispatches at this slot.')}
                      {' '}
                      <span className="font-normal opacity-80">
                        {t('plan_dispatch.preview_conflicts_click', 'Click a conflict to see which time window and installations are affected.')}
                      </span>
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {technicianIds.map(techId => {
                      const list = conflictsByTech[techId] || [];
                      if (list.length === 0) return null;
                      const name = techNamesById.get(String(techId)) || `#${techId}`;
                      return (
                        <div key={techId} className="space-y-1">
                          <div className="text-px-11 font-semibold">
                            {t('plan_dispatch.conflict_tech_line', { name, count: list.length })}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {list.map(d => {
                              const sStr = String(d.scheduling?.scheduledStartTime || d.scheduledStartTime || '').slice(0, 5);
                              const eStr = String(d.scheduling?.scheduledEndTime || d.scheduledEndTime || '').slice(0, 5);
                              const active = focusedConflict?.techId === String(techId) && String(focusedConflict?.dispatchId) === String(d.id);
                              return (
                                <button
                                  key={`${techId}-${d.id}`}
                                  type="button"
                                  onClick={() => {
                                    setFocusedConflict({
                                      techId: String(techId),
                                      dispatchId: d.id,
                                      dispatchNumber: d.dispatchNumber,
                                      startStr: sStr,
                                      endStr: eStr,
                                      status: d.status,
                                    });
                                    // Scroll schedule card into view then pulse groups
                                    requestAnimationFrame(() => {
                                      scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    });
                                  }}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-px-11 font-medium transition-colors",
                                    active
                                      ? "border-destructive bg-destructive text-destructive-foreground"
                                      : "border-destructive/40 bg-background hover:bg-destructive/10"
                                  )}
                                  aria-pressed={active}
                                >
                                  <ClockIcon className="h-3 w-3" />
                                  #{d.dispatchNumber || d.id} · {sStr}–{eStr}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {focusedConflict && (
                    <p className="text-px-11 pl-6 italic opacity-90">
                      {t('plan_dispatch.preview_affected_note', {
                        count: previewGroups.length,
                        defaultValue: 'All {{count}} installation group(s) below share this technician and time window.',
                      })}
                    </p>
                  )}
                </div>
              )}


              {/* Sequencing / parallel-overlap control */}
              {previewGroups.length > 1 && (
                <div className={cn(
                  "rounded-md border p-2.5 text-xs space-y-2",
                  sequenceBackToBack
                    ? "border-emerald-300/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200"
                    : "border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
                )}>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={sequenceBackToBack}
                      onCheckedChange={(v) => setSequenceBackToBack(v === true)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-medium">
                        {t('plan_dispatch.sequence_back_to_back', 'Sequence back-to-back (avoid self-overlap)')}
                      </div>
                      <div className="opacity-90 mt-0.5">
                        {sequenceBackToBack
                          ? t('plan_dispatch.sequence_active', {
                              count: previewGroups.length,
                              defaultValue: 'Each of the {{count}} dispatches gets its own start time, staggered by the group\'s estimated duration.',
                            })
                          : t('plan_dispatch.parallel_warning', {
                              count: previewGroups.length,
                              defaultValue: 'All {{count}} dispatches will run in parallel on the same technicians — each technician will be double-booked across them.',
                            })}
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* Per-installation preview cards */}
              <div className="space-y-3">
                {previewGroups.map((g, idx) => (
                  <div
                    key={g.key}
                    ref={setGroupRef(g.key)}
                    className={cn(
                      "rounded-lg border overflow-hidden transition-all",
                      focusedConflict && "ring-2 ring-destructive/50 border-destructive/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-primary/5 border-b border-primary/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-px-11 font-semibold text-primary">
                          {idx + 1}
                        </span>
                        <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-semibold truncate">{g.label}</span>
                        {g.viaServiceOrder && (
                          <Badge variant="outline" className="text-px-10">
                            {t('plan_dispatch.preview_via_so', 'via service order')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge variant="secondary" className="text-px-11 gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {g.start}–{g.end}
                        </Badge>
                        <Badge variant="secondary" className="text-px-11">
                          {t('plan_dispatch.preview_jobs_count', { count: g.jobs.length, defaultValue: '{{count}} jobs' })}
                        </Badge>
                        {g.duration > 0 && (
                          <Badge variant="outline" className="text-px-11">
                            {Math.floor(g.duration / 60) > 0 ? `${Math.floor(g.duration / 60)}h ` : ''}{g.duration % 60}m
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ul className="divide-y">
                      {g.jobs.map(j => (
                        <li key={j.id} className="flex items-center justify-between gap-2 px-3 py-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{j.title || `Job #${j.id}`}</div>
                            <div className="text-px-11 text-muted-foreground truncate">#{j.id}</div>
                          </div>
                          {j.estimatedDuration ? (
                            <span className="text-px-11 text-muted-foreground whitespace-nowrap">
                              {Math.floor(j.estimatedDuration / 60) > 0 ? `${Math.floor(j.estimatedDuration / 60)}h ` : ''}{j.estimatedDuration % 60}m
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="text-px-11 text-muted-foreground">
                {t('plan_dispatch.preview_footnote', {
                  count: previewGroups.length,
                  jobs: selectedJobs.length,
                  defaultValue: '{{count}} dispatches will be created for {{jobs}} jobs. Each dispatch shares the technicians and priority shown above.',
                })}
              </p>
            </div>
          </ScrollArea>
        ) : (
        <ScrollArea className="flex-1 pr-3 -mr-3">
          <div className="space-y-6 pb-2">
            {/* 1. Jobs */}
            <section className="space-y-2">
              <Label className="text-sm font-semibold">{t('plan_dispatch.jobs')}</Label>
              {eligibleJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('plan_dispatch.no_eligible_jobs')}
                </p>
              ) : (
                <div className="space-y-1 rounded-md border p-2 max-h-52 overflow-y-auto">
                  {eligibleJobs.map(j => (
                    <label
                      key={j.id}
                      className="flex items-start gap-2 rounded-sm px-2 py-1.5 hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedJobIds.includes(j.id)}
                        onCheckedChange={() => toggleJob(j.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{j.title}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {j.installationName && (
                            <Badge variant="outline" className="text-px-10 py-0 h-4">
                              {j.installationName}
                            </Badge>
                          )}
                          {j.estimatedDuration ? (
                            <span className="text-px-11 text-muted-foreground">
                              {t('plan_dispatch.duration_minutes', { minutes: j.estimatedDuration })}
                            </span>
                          ) : null}
                          <span className="text-px-11 text-muted-foreground capitalize">
                            {j.status}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {mixedInstallations && (
                <div className="rounded-md border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 p-2.5 space-y-2">
                  <p className="text-xs text-amber-900 dark:text-amber-200">
                    {t('plan_dispatch.mixed_installations', 'Selected jobs span multiple installations.')}
                  </p>
                  {jobConversionMode === 'installation' && (
                    <label className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={splitByInstallation}
                        onCheckedChange={(v) => setSplitByInstallation(v === true)}
                        className="mt-0.5"
                      />
                      <div className="text-xs">
                        <div className="font-medium">
                          {t('plan_dispatch.split_by_installation', {
                            count: jobsByInstallation.size,
                            defaultValue: 'Split into {{count}} dispatches (one per installation)',
                          })}
                        </div>
                        <div className="text-muted-foreground mt-0.5">
                          {Array.from(jobsByInstallation.entries()).map(([k, list]) => {
                            const label = k === '' ? t('plan_dispatch.no_installation_label', 'No installation') : (list[0].installationName || `Installation #${k}`);
                            return `${label} (${list.length})`;
                          }).join(' · ')}
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              )}
            </section>


            {/* 2. Date & time */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">{t('plan_dispatch.date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{t('plan_dispatch.start')}</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStartTime(v);
                    if (v && endTime <= v) setEndTime(addHoursToTime(v, 2));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{t('plan_dispatch.end')}</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={!timeValid ? 'border-destructive' : undefined}
                />
                {!timeValid && (
                  <p className="text-xs text-destructive">{t('plan_dispatch.end_after_start')}</p>
                )}
              </div>
            </section>

            {/* 3. Technicians */}
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-sm font-semibold">{t('plan_dispatch.technicians')}</Label>
                {technicianIds.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t('plan_dispatch.selected_count', { count: technicianIds.length, defaultValue: '{{count}} selected' })}
                  </span>
                )}
              </div>

              {loadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('plan_dispatch.loading_technicians')}
                </div>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('plan_dispatch.no_users')}</p>
              ) : (
                <>
                  {/* Search + skills filter toolbar */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={techSearch}
                        onChange={(e) => setTechSearch(e.target.value)}
                        placeholder={t('plan_dispatch.tech_search_placeholder', { defaultValue: 'Search by name or email' })}
                        className="pl-8 h-9"
                      />
                      {techSearch && (
                        <button
                          type="button"
                          onClick={() => setTechSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {allSkills.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">
                          {t('plan_dispatch.filter_by_skill', { defaultValue: 'Skills:' })}
                        </span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 flex-1 justify-between font-normal min-w-0"
                            >
                              <span className="truncate text-left">
                                {skillFilterIds.length === 0
                                  ? t('plan_dispatch.select_skills', { defaultValue: 'Select skills…' })
                                  : allSkills
                                      .filter(s => skillFilterIds.includes(s.id))
                                      .map(s => s.name)
                                      .join(', ')}
                              </span>
                              <span className="ml-2 text-xs text-muted-foreground shrink-0">
                                {skillFilterIds.length > 0 ? `${skillFilterIds.length}` : ''}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
                            <div className="max-h-64 overflow-y-auto p-1">
                              {allSkills.map(skill => {
                                const active = skillFilterIds.includes(skill.id);
                                return (
                                  <label
                                    key={skill.id}
                                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted cursor-pointer text-sm"
                                  >
                                    <Checkbox
                                      checked={active}
                                      onCheckedChange={() =>
                                        setSkillFilterIds(prev =>
                                          prev.includes(skill.id)
                                            ? prev.filter(x => x !== skill.id)
                                            : [...prev, skill.id]
                                        )
                                      }
                                    />
                                    <span className="truncate">{skill.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                            {skillFilterIds.length > 0 && (
                              <div className="border-t p-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="w-full h-8 text-xs"
                                  onClick={() => setSkillFilterIds([])}
                                >
                                  {t('common.clear', { defaultValue: 'Clear' })}
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                        {loadingSkills && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />}
                      </div>
                    )}
                  </div>

                  {(() => {
                    const search = techSearch.trim().toLowerCase();
                    const filtered = users
                      .filter(u => u.isActive !== false)
                      .filter(u => {
                        if (!search) return true;
                        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
                        return name.includes(search) || (u.email || '').toLowerCase().includes(search);
                      })
                      .filter(u => {
                        if (skillFilterIds.length === 0) return true;
                        const owned = userSkillsMap[String(u.id)] || [];
                        // Must have every selected skill (AND semantics)
                        return skillFilterIds.every(sid => owned.includes(sid));
                      });

                    if (filtered.length === 0) {
                      return (
                        <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
                          {t('plan_dispatch.no_tech_match', { defaultValue: 'No technicians match the filters.' })}
                        </div>
                      );
                    }

                    return (
                      <div className="rounded-md border p-2 max-h-56 overflow-y-auto space-y-1">
                        {filtered.map(u => {
                          const id = String(u.id);
                          const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${id}`;
                          const owned = userSkillsMap[id] || [];
                          const ownedSkills = allSkills.filter(s => owned.includes(s.id));
                          return (
                            <label
                              key={id}
                              className="flex flex-wrap items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={technicianIds.includes(id)}
                                onCheckedChange={() => toggleTech(id)}
                              />
                              <span className="text-sm">{name}</span>
                              {ownedSkills.length > 0 && (
                                <span className="flex flex-wrap gap-1">
                                  {ownedSkills.slice(0, 3).map(s => (
                                    <Badge
                                      key={s.id}
                                      variant={skillFilterIds.includes(s.id) ? 'default' : 'secondary'}
                                      className="text-px-10 px-1.5 py-0 h-4"
                                    >
                                      {s.name}
                                    </Badge>
                                  ))}
                                  {ownedSkills.length > 3 && (
                                    <span className="text-px-10 text-muted-foreground">+{ownedSkills.length - 3}</span>
                                  )}
                                </span>
                              )}
                              {u.email && (
                                <span className="text-xs text-muted-foreground ml-auto">{u.email}</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}
            </section>


            {/* 4. Details */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">{t('plan_dispatch.priority')}</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[60]">
                    <SelectItem value="low">{t('plan_dispatch.priority_low')}</SelectItem>
                    <SelectItem value="medium">{t('plan_dispatch.priority_medium')}</SelectItem>
                    <SelectItem value="high">{t('plan_dispatch.priority_high')}</SelectItem>
                    <SelectItem value="urgent">{t('plan_dispatch.priority_urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{t('plan_dispatch.site_address')}</Label>
                <Input
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder={t('plan_dispatch.site_address_placeholder')}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-sm">{t('plan_dispatch.notes')}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('plan_dispatch.notes_placeholder')}
                  rows={2}
                />
              </div>
            </section>

            {/* Conflict validation */}
            {technicianIds.length > 0 && timeValid && (
              <section className="space-y-2">
                {checkingConflicts ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t('plan_dispatch.checking_conflicts')}
                  </div>
                ) : hasConflicts ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('plan_dispatch.conflicts_title')}</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-2 mt-1">
                        {technicianIds.map(techId => {
                          const list = conflictsByTech[techId] || [];
                          if (list.length === 0) return null;
                          const u = users.find(x => String(x.id) === techId);
                          const name = u ? (`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${techId}`) : `User ${techId}`;
                          return (
                            <div key={techId} className="text-xs">
                              <div className="font-medium">
                                {t('plan_dispatch.conflict_tech_line', { name, count: list.length })}
                              </div>
                              <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                                {list.map(d => {
                                  const startStr = String(d.scheduling?.scheduledStartTime || d.scheduledStartTime || '').slice(0, 5);
                                  const endStr = String(d.scheduling?.scheduledEndTime || d.scheduledEndTime || '').slice(0, 5);
                                  return (
                                    <li key={d.id}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFocusedConflict({
                                            techId: String(techId),
                                            dispatchId: d.id,
                                            dispatchNumber: d.dispatchNumber,
                                            startStr,
                                            endStr,
                                            status: d.status,
                                          });
                                          if (willSplit) setShowPreview(true);
                                          requestAnimationFrame(() => {
                                            scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                          });
                                        }}
                                        className="text-left underline decoration-dotted underline-offset-2 hover:decoration-solid focus:outline-none focus:ring-2 focus:ring-destructive/40 rounded-sm"
                                      >
                                        {t('plan_dispatch.conflict_item', {
                                          number: d.dispatchNumber || d.id,
                                          start: startStr,
                                          end: endStr,
                                          status: d.status,
                                        })}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })}
                        <p className="text-xs mt-2">{t('plan_dispatch.conflicts_blocked')}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-xs text-muted-foreground">{t('plan_dispatch.no_conflicts')}</p>
                )}
              </section>
            )}

            {/* Summary */}
            {creationPath && (
              <p className="text-xs text-muted-foreground">
                {creationPath === 'from-job' && t('plan_dispatch.path_from_job')}
                {creationPath === 'from-installation' && t('plan_dispatch.path_from_installation', { count: selectedJobs.length })}
                {creationPath === 'from-service-order' && t('plan_dispatch.path_from_service_order', { count: selectedJobs.length })}
                {creationPath === 'split-by-installation' && t('plan_dispatch.path_split_by_installation', {
                  count: jobsByInstallation.size,
                  jobs: selectedJobs.length,
                  defaultValue: 'Will create {{count}} dispatches ({{jobs}} jobs, one dispatch per installation).',
                })}
              </p>
            )}
          </div>
        </ScrollArea>
        )}

        <DialogFooter>
          {showPreview ? (
            <>
              <Button variant="outline" onClick={() => setShowPreview(false)} disabled={submitting}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('plan_dispatch.preview_back', 'Back to edit')}
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('plan_dispatch.preview_confirm', {
                  count: previewGroups.length,
                  defaultValue: 'Create {{count}} dispatches',
                })}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                {t('plan_dispatch.cancel')}
              </Button>
              <Button onClick={handlePrimary} disabled={!canSubmit}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {willSplit
                  ? t('plan_dispatch.preview_open', {
                      count: previewGroups.length,
                      defaultValue: 'Preview split ({{count}})',
                    })
                  : t('plan_dispatch.submit')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PlanDispatchModal;
