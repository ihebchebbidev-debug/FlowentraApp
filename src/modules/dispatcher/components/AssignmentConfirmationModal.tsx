import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, User, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import type { Job, Technician } from "../types";
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';
import { ScheduleTimeEditor, buildDateFromStrings } from "./ScheduleTimeEditor";

export type DispatchPriority = 'low' | 'medium' | 'high' | 'urgent';

interface AssignmentConfirmationModalProps {
  job: Job | null;
  technician: Technician | null;
  scheduledDate: Date | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (priority: DispatchPriority, scheduledStart: Date, scheduledEnd: Date) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AssignmentConfirmationModal({
  job,
  technician,
  scheduledDate,
  scheduledStart,
  scheduledEnd,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isLoading = false
}: AssignmentConfirmationModalProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const { viewAll, targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  // Initialize priority from job's priority
  const [selectedPriority, setSelectedPriority] = useState<DispatchPriority>('medium');

  // Editable schedule state (same UX as the edit modal)
  const [editedDate, setEditedDate] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedEndTime, setEditedEndTime] = useState('');

  // Reset state when modal opens with a new job/slot
  useEffect(() => {
    if (job && open) {
      setSelectedPriority((job.priority as DispatchPriority) || 'medium');
    }
    if (open && scheduledStart && scheduledEnd) {
      setEditedDate(format(scheduledStart, 'yyyy-MM-dd'));
      setEditedStartTime(format(scheduledStart, 'HH:mm'));
      setEditedEndTime(format(scheduledEnd, 'HH:mm'));
    }
  }, [job, open, scheduledStart, scheduledEnd]);

  if (!job || !technician || !scheduledStart || !scheduledEnd) return null;

  const getPriorityColor = (priority: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return t(`dispatcher.priority_${priority}`, priority);
  };

  // Compute the final start/end from the editor; fall back to the dropped values.
  const finalStart = editedDate && editedStartTime
    ? buildDateFromStrings(editedDate, editedStartTime)
    : scheduledStart;
  const finalEnd = editedDate && editedEndTime
    ? buildDateFromStrings(editedDate, editedEndTime)
    : scheduledEnd;
  const durationMs = finalEnd.getTime() - finalStart.getTime();
  const isInvalid = durationMs <= 0;
  const duration = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;

  const handleConfirm = () => {
    if (isInvalid) return;
    onConfirm(selectedPriority, finalStart, finalEnd);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            {t('dispatcher.confirm_job_assignment')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('dispatcher.this_will_create_dispatch')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* Tenant Selector for View All mode */}
          <TenantSelector value={targetTenantId} onChange={handleTenantChange} />

          {/* Job details */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-base">{job.title}</h3>
              <Badge variant={getPriorityColor(job.priority)} className="text-px-10">
                {getPriorityLabel(job.priority).toUpperCase()}
              </Badge>
            </div>
            
            {job.serviceOrderTitle && (
              <p className="text-xs text-muted-foreground">
                {t('dispatcher.service_order')}: {job.serviceOrderTitle}
              </p>
            )}
            
            {job.description && (
              <p className="text-sm text-muted-foreground">{job.description}</p>
            )}
            
            {/* Customer/Contact Information */}
            <div className="border-t border-border pt-3 mt-3 space-y-1.5">
              <p className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('dispatcher.contact')}:</span>
                <span className="font-medium">{job.customerName}</span>
              </p>
              {job.customerCompany && (
                <p className="text-sm text-muted-foreground ml-6">
                  {t('dispatcher.company')}: {job.customerCompany}
                </p>
              )}
              {job.customerPhone && (
                <p className="text-sm text-muted-foreground ml-6">
                  {t('dispatcher.phone')}: {job.customerPhone}
                </p>
              )}
              {job.customerEmail && (
                <p className="text-sm text-muted-foreground ml-6">
                  {t('dispatcher.email')}: {job.customerEmail}
                </p>
              )}
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

            {/* Editable schedule — same UX as the edit modal */}
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
                  : `${format(finalStart, 'HH:mm')} - ${format(finalEnd, 'HH:mm')} (${duration}${t('dispatcher.hours_short')})`}
              </span>
            </div>
          </div>

          {/* Dispatch Priority Selector */}
          <div className="space-y-2">
            <Label htmlFor="dispatch-priority" className="text-sm font-medium">
              {t('dispatcher.dispatch_priority')}
            </Label>
            <Select value={selectedPriority} onValueChange={(val) => setSelectedPriority(val as DispatchPriority)}>
              <SelectTrigger id="dispatch-priority" className="w-full bg-background border-border">
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
          <Button onClick={handleConfirm} disabled={isLoading || isTenantRequired || isInvalid}>
            {isLoading ? t('dispatcher.creating') : t('dispatcher.confirm_assignment_btn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
