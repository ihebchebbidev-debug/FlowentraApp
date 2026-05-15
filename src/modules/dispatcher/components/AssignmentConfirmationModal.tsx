import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, User, Calendar, CheckCircle, AlertTriangle, AlertCircle, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import type { Job, Technician } from "../types";
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';

export type DispatchPriority = 'low' | 'medium' | 'high' | 'urgent';

interface AssignmentConfirmationModalProps {
  job: Job | null;
  technician: Technician | null;
  scheduledDate: Date | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (priority: DispatchPriority) => void;
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

  // Reset priority when modal opens with a new job
  useEffect(() => {
    if (job && open) {
      setSelectedPriority((job.priority as DispatchPriority) || 'medium');
    }
  }, [job, open]);

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-3 w-3" />;
      case 'high': return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const getPriorityLabel = (priority: string) => {
    return t(`dispatcher.priority_${priority}`, priority);
  };

  const getPriorityDescription = (priority: string) => {
    switch (priority) {
      case 'low': return t('dispatcher.priority_standard');
      case 'medium': return t('dispatcher.priority_normal');
      case 'high': return t('dispatcher.priority_important');
      case 'urgent': return t('dispatcher.priority_immediate');
      default: return '';
    }
  };

  const duration = Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60 * 60) * 10) / 10;

  const handleConfirm = () => {
    onConfirm(selectedPriority);
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
              <Badge variant={getPriorityColor(job.priority)} className="text-[10px]">
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
            
            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('dispatcher.assigned_technician')}:</span>
                <span className="font-medium">{technician.firstName} {technician.lastName}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('dispatcher.scheduled_date')}:</span>
                <span className="font-medium">{format(scheduledStart, 'EEEE, MMMM dd, yyyy', { locale: dateLocale })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('dispatcher.scheduled_time')}:</span>
                <span className="font-medium">{format(scheduledStart, 'HH:mm')} - {format(scheduledEnd, 'HH:mm')} ({duration}{t('dispatcher.hours_short')})</span>
              </div>
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
          <Button onClick={handleConfirm} disabled={isLoading || isTenantRequired}>
            {isLoading ? t('dispatcher.creating') : t('dispatcher.confirm_assignment_btn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
