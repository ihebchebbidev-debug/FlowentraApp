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
import type { Job, Technician, ServiceOrder } from "../types";
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';

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
  onConfirm: (jobPriorities: JobPriority[]) => void;
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

  // Initialize priorities when modal opens with new service order
  useEffect(() => {
    if (serviceOrder && open) {
      const initialPriorities: Record<string, DispatchPriority> = {};
      serviceOrder.jobs.forEach(job => {
        initialPriorities[job.id] = (job.priority as DispatchPriority) || 'medium';
      });
      setJobPriorities(initialPriorities);
    }
  }, [serviceOrder, open]);

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

  const handleConfirm = () => {
    const priorities: JobPriority[] = serviceOrder.jobs.map(job => ({
      jobId: job.id,
      priority: jobPriorities[job.id] || 'medium'
    }));
    onConfirm(priorities);
  };

  // Calculate total duration and end time
  const totalDuration = serviceOrder.jobs.reduce((sum, job) => sum + (job.estimatedDuration || 60), 0);
  const scheduledEnd = new Date(scheduledStart.getTime() + totalDuration * 60 * 1000);
  const totalHours = Math.round(totalDuration / 60 * 10) / 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
            <ScrollArea className="max-h-[250px]">
              <div className="divide-y divide-border">
                {serviceOrder.jobs.map((job, index) => {
                  // Calculate individual job time slot
                  const jobStartOffset = serviceOrder.jobs
                    .slice(0, index)
                    .reduce((sum, j) => sum + (j.estimatedDuration || 60), 0);
                  const jobStart = new Date(scheduledStart.getTime() + jobStartOffset * 60 * 1000);
                  const jobEnd = new Date(jobStart.getTime() + (job.estimatedDuration || 60) * 60 * 1000);
                  
                  return (
                    <div key={job.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(jobStart, 'HH:mm')} - {format(jobEnd, 'HH:mm')} ({Math.round((job.estimatedDuration || 60) / 60 * 10) / 10}{t('dispatcher.hours_short')})
                          </p>
                        </div>
                        <Select 
                          value={jobPriorities[job.id] || 'medium'} 
                          onValueChange={(val) => handlePriorityChange(job.id, val as DispatchPriority)}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="low">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] px-1.5">{t('dispatcher.priority_low')}</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] px-1.5">{t('dispatcher.priority_medium')}</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="text-[10px] px-1.5">{t('dispatcher.priority_high')}</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive" className="text-[10px] px-1.5">{t('dispatcher.priority_urgent')}</Badge>
                              </div>
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
            
            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('dispatcher.technician_label')}:</span>
                <span className="font-medium">{technician.firstName} {technician.lastName}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('dispatcher.date_label')}:</span>
                <span className="font-medium">{format(scheduledStart, 'EEEE, MMMM dd, yyyy', { locale: dateLocale })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('dispatcher.time_range')}:</span>
                <span className="font-medium">{format(scheduledStart, 'HH:mm')} - {format(scheduledEnd, 'HH:mm')} ({totalHours}{t('dispatcher.hours_short')})</span>
              </div>
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
