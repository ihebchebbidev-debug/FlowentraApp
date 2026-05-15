import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Calendar, ArrowRight, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import type { Job, Technician } from "../types";

interface RescheduleConfirmationModalProps {
  job: Job | null;
  technician: Technician | null;
  originalStart: Date | null;
  originalEnd: Date | null;
  newScheduledStart: Date | null;
  newScheduledEnd: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RescheduleConfirmationModal({
  job,
  technician,
  originalStart,
  originalEnd,
  newScheduledStart,
  newScheduledEnd,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isLoading = false
}: RescheduleConfirmationModalProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  
  if (!job || !newScheduledStart || !newScheduledEnd || !originalStart || !originalEnd) return null;

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
    return t(`dispatcher.priority_${priority}`, priority.toUpperCase());
  };

  const duration = Math.round((newScheduledEnd.getTime() - newScheduledStart.getTime()) / (1000 * 60 * 60) * 10) / 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-warning" />
            {t('dispatcher.confirm_reschedule')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Job details */}
          <div className="p-4 bg-accent/30 rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg">{job.title}</h3>
              <Badge variant={getPriorityColor(job.priority)}>
                {getPriorityLabel(job.priority)}
              </Badge>
            </div>
            
            {job.customerName && (
              <p className="text-sm font-medium">{t('dispatcher.customer')}: {job.customerName}</p>
            )}
          </div>
          
          {/* Schedule change comparison */}
          <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg space-y-3">
            <h4 className="font-medium text-sm text-warning">{t('dispatcher.schedule_change')}</h4>
            
            <div className="flex items-center gap-2">
              {/* Original time */}
              <div className="flex-1 p-2 bg-background/50 rounded border border-muted">
                <div className="text-xs text-muted-foreground mb-1">{t('dispatcher.original')}</div>
                <div className="text-sm font-medium">{format(originalStart, 'MMM dd', { locale: dateLocale })}</div>
                <div className="text-sm">{format(originalStart, 'HH:mm')} - {format(originalEnd, 'HH:mm')}</div>
              </div>
              
              <ArrowRight className="h-5 w-5 text-warning flex-shrink-0" />
              
              {/* New time */}
              <div className="flex-1 p-2 bg-primary/10 rounded border border-primary/30">
                <div className="text-xs text-primary mb-1">{t('dispatcher.new')}</div>
                <div className="text-sm font-medium">{format(newScheduledStart, 'MMM dd', { locale: dateLocale })}</div>
                <div className="text-sm">{format(newScheduledStart, 'HH:mm')} - {format(newScheduledEnd, 'HH:mm')}</div>
              </div>
            </div>
          </div>
          
          {/* Technician info */}
          {technician && (
            <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t('dispatcher.assigned_technician')}:</span>
              <span>{technician.firstName} {technician.lastName}</span>
            </div>
          )}
          
          {/* Info note */}
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
            <p className="text-sm text-foreground">
              {t('dispatcher.this_will_update_dispatch')}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('dispatcher.cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="bg-warning text-warning-foreground hover:bg-warning/90">
            {isLoading ? t('dispatcher.rescheduling') : t('dispatcher.confirm_reschedule_btn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
