import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Clock, User, Calendar, Wrench } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import type { InstallationGroup, Technician } from "../types";
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';
import { ScheduleTimeEditor, buildDateFromStrings } from "./ScheduleTimeEditor";

type DispatchPriority = 'low' | 'medium' | 'high' | 'urgent';

interface InstallationAssignmentModalProps {
  installationGroup: InstallationGroup | null;
  technician: Technician | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (priority: DispatchPriority, scheduledStart: Date, scheduledEnd: Date) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InstallationAssignmentModal({
  installationGroup,
  technician,
  scheduledStart,
  scheduledEnd,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isLoading = false
}: InstallationAssignmentModalProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const { viewAll, targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  const [selectedPriority, setSelectedPriority] = useState<DispatchPriority>('medium');

  // Editable schedule state — same UX as the edit modal
  const [editedDate, setEditedDate] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedEndTime, setEditedEndTime] = useState('');

  useEffect(() => {
    if (installationGroup && open) {
      const firstJobPriority = installationGroup.jobs[0]?.priority as DispatchPriority;
      setSelectedPriority(firstJobPriority || 'medium');
    }
    if (open && scheduledStart && scheduledEnd) {
      setEditedDate(format(scheduledStart, 'yyyy-MM-dd'));
      setEditedStartTime(format(scheduledStart, 'HH:mm'));
      setEditedEndTime(format(scheduledEnd, 'HH:mm'));
    }
  }, [installationGroup, open, scheduledStart, scheduledEnd]);

  if (!installationGroup || !technician || !scheduledStart || !scheduledEnd) return null;

  const totalDuration = installationGroup.jobs.reduce((sum, j) => sum + (j.estimatedDuration || 60), 0);
  const durationHours = Math.round(totalDuration / 60 * 10) / 10;

  const finalStart = editedDate && editedStartTime
    ? buildDateFromStrings(editedDate, editedStartTime)
    : scheduledStart;
  const finalEnd = editedDate && editedEndTime
    ? buildDateFromStrings(editedDate, editedEndTime)
    : scheduledEnd;
  const isInvalid = finalEnd.getTime() - finalStart.getTime() <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t('dispatcher.installation_assignment_title', 'Assign Installation')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('dispatcher.this_will_create_single_dispatch', 'This will create a single dispatch for all jobs in this installation')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Tenant Selector for View All mode */}
          <TenantSelector value={targetTenantId} onChange={handleTenantChange} />

          {/* Installation info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-base">{installationGroup.installationName}</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dispatcher.service_order')}: {installationGroup.serviceOrderTitle}
            </p>
          </div>

          {/* Jobs list */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('dispatcher.installation_jobs_included', 'Jobs Included')} ({installationGroup.jobs.length})
            </Label>
            <ScrollArea className="max-h-32 rounded-lg border border-border">
              <div className="p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {installationGroup.jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 text-sm min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{job.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {job.estimatedDuration || 60}min
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{t('dispatcher.total_duration', 'Total Duration')}: <span className="font-semibold text-foreground">{durationHours}h ({totalDuration}min)</span></span>
            </div>
          </div>

          {/* Assignment details */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">{t('dispatcher.assignment_details')}</h4>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('dispatcher.assigned_technician')}:</span>
              <span className="font-medium">{technician.firstName} {technician.lastName}</span>
            </div>

            <ScheduleTimeEditor
              date={editedDate}
              startTime={editedStartTime}
              endTime={editedEndTime}
              onDateChange={setEditedDate}
              onStartTimeChange={setEditedStartTime}
              onEndTimeChange={setEditedEndTime}
              disabled={isLoading}
            />

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(finalStart, 'EEEE, MMMM dd, yyyy', { locale: dateLocale })}</span>
              <span>·</span>
              <Clock className="h-3.5 w-3.5" />
              <span>
                {isInvalid
                  ? t('dispatcher.invalid_time_range', 'End time must be after start time')
                  : `${format(finalStart, 'HH:mm')} - ${format(finalEnd, 'HH:mm')}`}
              </span>
            </div>
          </div>

          {/* Priority Selector */}
          <div className="space-y-2">
            <Label htmlFor="installation-priority" className="text-sm font-medium">
              {t('dispatcher.dispatch_priority')}
            </Label>
            <Select value={selectedPriority} onValueChange={(val) => setSelectedPriority(val as DispatchPriority)}>
              <SelectTrigger id="installation-priority" className="w-full bg-background border-border">
                <SelectValue placeholder={t('dispatcher.priority')} />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{t('dispatcher.priority_low')}</Badge>
                    <span className="text-muted-foreground text-xs">{t('dispatcher.priority_standard')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{t('dispatcher.priority_medium')}</Badge>
                    <span className="text-muted-foreground text-xs">{t('dispatcher.priority_normal')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">{t('dispatcher.priority_high')}</Badge>
                    <span className="text-muted-foreground text-xs">{t('dispatcher.priority_important')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">{t('dispatcher.priority_urgent')}</Badge>
                    <span className="text-muted-foreground text-xs">{t('dispatcher.priority_immediate')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('dispatcher.cancel')}
          </Button>
          <Button onClick={() => !isInvalid && onConfirm(selectedPriority, finalStart, finalEnd)} disabled={isLoading || isTenantRequired || isInvalid}>
            {isLoading ? t('dispatcher.creating') : t('dispatcher.confirm_assignment_btn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
