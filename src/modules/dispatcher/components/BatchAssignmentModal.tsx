import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, User, Calendar, Package, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import type { Technician, ServiceOrder } from "../types";
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';
import { ScheduleTimeEditor, buildDateFromStrings } from "./ScheduleTimeEditor";

export type DispatchPriority = 'low' | 'medium' | 'high' | 'urgent';

interface JobPriority {
  jobId: string;
  priority: DispatchPriority;
}

interface BatchAssignmentModalProps {
  serviceOrder: ServiceOrder | null;
  technician: Technician | null;
  scheduledStart: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (jobPriorities: JobPriority[], scheduledStart: Date) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BatchAssignmentModal({
  serviceOrder,
  technician,
  scheduledStart,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isLoading = false
}: BatchAssignmentModalProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const { viewAll, targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  
  // Track priority for each job
  const [jobPriorities, setJobPriorities] = useState<Record<string, DispatchPriority>>({});

  // Editable schedule (start only — end is computed from jobs' total duration)
  const [editedDate, setEditedDate] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');

  // Initialize state when modal opens with new service order / slot
  useEffect(() => {
    if (serviceOrder && open) {
      const initialPriorities: Record<string, DispatchPriority> = {};
      serviceOrder.jobs.forEach(job => {
        initialPriorities[job.id] = (job.priority as DispatchPriority) || 'medium';
      });
      setJobPriorities(initialPriorities);
    }
    if (open && scheduledStart) {
      setEditedDate(format(scheduledStart, 'yyyy-MM-dd'));
      setEditedStartTime(format(scheduledStart, 'HH:mm'));
    }
  }, [serviceOrder, open, scheduledStart]);

  if (!serviceOrder || !technician || !scheduledStart) return null;

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

  const handlePriorityChange = (jobId: string, priority: DispatchPriority) => {
    setJobPriorities(prev => ({
      ...prev,
      [jobId]: priority
    }));
  };

  // Calculate total duration and end time using the (possibly edited) start
  const totalDuration = serviceOrder.jobs.reduce((sum, job) => sum + (job.estimatedDuration || 60), 0);
  const finalStart = editedDate && editedStartTime
    ? buildDateFromStrings(editedDate, editedStartTime)
    : scheduledStart;
  const scheduledEnd = new Date(finalStart.getTime() + totalDuration * 60 * 1000);
  const totalHours = Math.round(totalDuration / 60 * 10) / 10;

  const handleConfirm = () => {
    const priorities: JobPriority[] = serviceOrder.jobs.map(job => ({
      jobId: job.id,
      priority: jobPriorities[job.id] || 'medium'
    }));
    onConfirm(priorities, finalStart);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t('dispatcher.batch_assignment_title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('dispatcher.batch_assignment_description', 'Assign multiple jobs to a technician')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* Tenant Selector for View All mode */}
          <TenantSelector value={targetTenantId} onChange={handleTenantChange} />

          {/* Service Order Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-base">{serviceOrder.title}</h3>
                <p className="text-sm text-muted-foreground">{serviceOrder.customerName}</p>
              </div>
              <Badge variant={getPriorityColor(serviceOrder.priority)} className="text-[10px]">
                {getPriorityLabel(serviceOrder.priority).toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {serviceOrder.jobs.length} {t('dispatcher.jobs')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {totalHours}{t('dispatcher.hours_short')} {t('dispatcher.total_suffix')}
              </span>
            </div>
          </div>
          
          {/* Jobs List with Priority Selectors */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <h4 className="text-sm font-medium">
                {t('dispatcher.jobs_to_assign')}
              </h4>
            </div>
            <ScrollArea className="max-h-[200px]">
              <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {serviceOrder.jobs.map((job, index) => {
                  // Calculate individual job time slot
                  const jobStartOffset = serviceOrder.jobs
                    .slice(0, index)
                    .reduce((sum, j) => sum + (j.estimatedDuration || 60), 0);
                  const jobStart = new Date(finalStart.getTime() + jobStartOffset * 60 * 1000);
                  const jobEnd = new Date(jobStart.getTime() + (job.estimatedDuration || 60) * 60 * 1000);
                  
                  return (
                    <div key={job.id} className="p-2 rounded-md border border-border bg-muted/30">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {format(jobStart, 'HH:mm')} - {format(jobEnd, 'HH:mm')} ({Math.round((job.estimatedDuration || 60) / 60 * 10) / 10}{t('dispatcher.hours_short')})
                          </p>
                        </div>
                        <Select 
                          value={jobPriorities[job.id] || 'medium'} 
                          onValueChange={(val) => handlePriorityChange(job.id, val as DispatchPriority)}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs bg-background border-border shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="low">
                              <Badge variant="outline" className="text-[10px] px-1.5">{t('dispatcher.priority_low')}</Badge>
                            </SelectItem>
                            <SelectItem value="medium">
                              <Badge variant="secondary" className="text-[10px] px-1.5">{t('dispatcher.priority_medium')}</Badge>
                            </SelectItem>
                            <SelectItem value="high">
                              <Badge variant="default" className="text-[10px] px-1.5">{t('dispatcher.priority_high')}</Badge>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <Badge variant="destructive" className="text-[10px] px-1.5">{t('dispatcher.priority_urgent')}</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

          </div>
          
          {/* Assignment details */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">
              {t('dispatcher.assignment_details_title')}
            </h4>

            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('dispatcher.technician_label')}:</span>
              <span className="font-medium">{technician.firstName} {technician.lastName}</span>
            </div>

            {/* Editable start date/time — end is computed from total duration */}
            <ScheduleTimeEditor
              date={editedDate}
              startTime={editedStartTime}
              onDateChange={setEditedDate}
              onStartTimeChange={setEditedStartTime}
              showEnd={false}
              disabled={isLoading}
            />

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(finalStart, 'EEEE, MMMM dd, yyyy', { locale: dateLocale })}</span>
              <span>·</span>
              <Clock className="h-3.5 w-3.5" />
              <span>{format(finalStart, 'HH:mm')} - {format(scheduledEnd, 'HH:mm')} ({totalHours}{t('dispatcher.hours_short')})</span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('dispatcher.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || isTenantRequired}>
            {isLoading 
              ? t('dispatcher.assigning') 
              : t('dispatcher.confirm_batch_btn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
