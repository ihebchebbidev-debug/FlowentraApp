import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
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
function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + hours * 60;
  const nh = Math.floor((total / 60) % 24);
  const nm = total % 60;
  return `${pad(nh)}:${pad(nm)}`;
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
  const [submitting, setSubmitting] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictsByTech, setConflictsByTech] = useState<Record<string, Dispatch[]>>({});

  // Preselect all eligible jobs on open
  useEffect(() => {
    if (open) {
      setSelectedJobIds(eligibleJobs.map(j => j.id));
      setSiteAddress(serviceOrder.siteAddress || '');
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

  const selectedJobs = useMemo(
    () => eligibleJobs.filter(j => selectedJobIds.includes(j.id)),
    [eligibleJobs, selectedJobIds]
  );

  // Decide creation path (mirrors DispatchingInterface logic)
  const creationPath = useMemo(() => {
    if (selectedJobs.length === 0) return null;
    if (selectedJobs.length === 1) return 'from-job' as const;
    const installationIds = new Set(selectedJobs.map(j => j.installationId || ''));
    const singleInstallation = installationIds.size === 1 && !installationIds.has('');
    if (singleInstallation && jobConversionMode === 'installation') return 'from-installation' as const;
    return 'from-service-order' as const;
  }, [selectedJobs, jobConversionMode]);

  // Validation
  const timeValid = endTime > startTime;
  const hasConflicts = Object.values(conflictsByTech).some(list => list.length > 0);
  const canSubmit =
    selectedJobIds.length > 0 &&
    technicianIds.length > 0 &&
    timeValid &&
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
  const proposedEndISO = useMemo(() => {
    if (!timeValid) return null;
    const d = new Date(date);
    const [h, m] = endTime.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }, [date, endTime, timeValid]);

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

  const mixedInstallations = useMemo(() => {
    if (selectedJobs.length < 2) return false;
    const ids = new Set(selectedJobs.map(j => j.installationId || '__none__'));
    return ids.size > 1;
  }, [selectedJobs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('plan_dispatch.title')}</DialogTitle>
          <DialogDescription>
            {t('plan_dispatch.description')}
          </DialogDescription>
        </DialogHeader>

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
                            <Badge variant="outline" className="text-[10px] py-0 h-4">
                              {j.installationName}
                            </Badge>
                          )}
                          {j.estimatedDuration ? (
                            <span className="text-[11px] text-muted-foreground">
                              {t('plan_dispatch.duration_minutes', { minutes: j.estimatedDuration })}
                            </span>
                          ) : null}
                          <span className="text-[11px] text-muted-foreground capitalize">
                            {j.status}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {mixedInstallations && (
                <p className="text-xs text-muted-foreground">
                  {t('plan_dispatch.mixed_installations')}
                </p>
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
              <Label className="text-sm font-semibold">{t('plan_dispatch.technicians')}</Label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('plan_dispatch.loading_technicians')}
                </div>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('plan_dispatch.no_users')}</p>
              ) : (
                <div className="rounded-md border p-2 max-h-48 overflow-y-auto space-y-1">
                  {users
                    .filter(u => u.isActive !== false)
                    .map(u => {
                      const id = String(u.id);
                      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${id}`;
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={technicianIds.includes(id)}
                            onCheckedChange={() => toggleTech(id)}
                          />
                          <span className="text-sm">{name}</span>
                          {u.email && (
                            <span className="text-xs text-muted-foreground ml-auto">{u.email}</span>
                          )}
                        </label>
                      );
                    })}
                </div>
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
                                      {t('plan_dispatch.conflict_item', {
                                        number: d.dispatchNumber || d.id,
                                        start: startStr,
                                        end: endStr,
                                        status: d.status,
                                      })}
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
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('plan_dispatch.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('plan_dispatch.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PlanDispatchModal;
