import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MapPin, Clock, User, AlertTriangle, Trash2, Loader2, Lock, CheckCircle2, FileText, Briefcase, Calendar, Phone, Mail, Building, UserCheck, ExternalLink, Building2, Timer, Pencil, Minus, Plus, CalendarIcon, ChevronUp, ChevronDown } from "lucide-react";
import { DurationIndicator } from "./calendar/DurationIndicator";
import { format, addMinutes, parse } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import type { Job, Technician } from "../types";
import { DispatcherService } from "../services/dispatcher.service";

interface JobConfirmationModalProps {
  job: Job | null;
  technician: Technician | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onUnassign: () => void;
  onUnlock?: () => void;
  onDurationChange?: (jobId: string, newEndTime: Date) => void;
  onScheduleChange?: (jobId: string, newStart: Date, newEnd: Date) => void;
  isDeleting?: boolean;
  isConfirming?: boolean;
  isUnlocking?: boolean;
}

export function JobConfirmationModal({
  job,
  technician,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  onUnassign,
  onUnlock,
  onDurationChange,
  onScheduleChange,
  isDeleting = false,
  isConfirming = false,
  isUnlocking = false
}: JobConfirmationModalProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockInfo, setLockInfo] = useState<{ lockedAt?: string; lockedBy?: string }>({});
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [editedDurationMinutes, setEditedDurationMinutes] = useState(0);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editedDate, setEditedDate] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedEndTime, setEditedEndTime] = useState('');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Check lock status when job changes
  useEffect(() => {
    if (job) {
      const locked = job.isLocked || DispatcherService.isDispatchLocked(job.id);
      setIsLocked(locked);
      if (locked) {
        const info = DispatcherService.getDispatchLockInfo(job.id);
        setLockInfo({ lockedAt: info.lockedAt, lockedBy: info.lockedBy });
      }
      // Initialize edited duration
      const currentDuration = job.scheduledEnd && job.scheduledStart 
        ? Math.round((job.scheduledEnd.getTime() - job.scheduledStart.getTime()) / (1000 * 60))
        : job.estimatedDuration;
      setEditedDurationMinutes(currentDuration);
      setIsEditingDuration(false);
      // Initialize schedule editing
      if (job.scheduledStart) {
        setEditedDate(format(job.scheduledStart, 'yyyy-MM-dd'));
        setEditedStartTime(format(job.scheduledStart, 'HH:mm'));
      }
      if (job.scheduledEnd) {
        setEditedEndTime(format(job.scheduledEnd, 'HH:mm'));
      }
      setIsEditingSchedule(false);
      setIsSavingSchedule(false);
    }
  }, [job]);

  if (!job || !technician) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const duration = job.scheduledEnd && job.scheduledStart 
    ? Math.round((job.scheduledEnd.getTime() - job.scheduledStart.getTime()) / (1000 * 60 * 60 * 100)) / 10
    : Math.round(job.estimatedDuration / 60 * 10) / 10;

  const durationMinutes = job.scheduledEnd && job.scheduledStart 
    ? Math.round((job.scheduledEnd.getTime() - job.scheduledStart.getTime()) / (1000 * 60))
    : job.estimatedDuration;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}${t('dispatcher.hours_short')} ${mins}${t('dispatcher.minutes_short')}`;
    } else if (hours > 0) {
      return `${hours}${t('dispatcher.hours_short')}`;
    }
    return `${mins}${t('dispatcher.minutes_short')}`;
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onUnassign();
  };

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  // Duration editing functions
  const handleDurationChange = (delta: number) => {
    const newDuration = Math.max(15, editedDurationMinutes + delta);
    setEditedDurationMinutes(newDuration);
  };

  const handleSaveDuration = () => {
    if (job?.scheduledStart && onDurationChange) {
      const newEnd = addMinutes(job.scheduledStart, editedDurationMinutes);
      onDurationChange(job.id, newEnd);
      setIsEditingDuration(false);
    }
  };

  const handleCancelDurationEdit = () => {
    // Reset to original duration
    const originalDuration = job?.scheduledEnd && job?.scheduledStart 
      ? Math.round((job.scheduledEnd.getTime() - job.scheduledStart.getTime()) / (1000 * 60))
      : job?.estimatedDuration || 60;
    setEditedDurationMinutes(originalDuration);
    setIsEditingDuration(false);
  };

  // Schedule editing handlers
  const handleSaveSchedule = async () => {
    if (!job || !onScheduleChange) return;
    const [year, month, day] = editedDate.split('-').map(Number);
    const [startH, startM] = editedStartTime.split(':').map(Number);
    const [endH, endM] = editedEndTime.split(':').map(Number);
    const newStart = new Date(year, month - 1, day, startH, startM, 0, 0);
    const newEnd = new Date(year, month - 1, day, endH, endM, 0, 0);
    if (newEnd <= newStart) newEnd.setDate(newEnd.getDate() + 1);
    setIsSavingSchedule(true);
    try {
      await onScheduleChange(job.id, newStart, newEnd);
      setIsEditingSchedule(false);
    } catch { /* parent handles */ } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleCancelScheduleEdit = () => {
    if (job?.scheduledStart) {
      setEditedDate(format(job.scheduledStart, 'yyyy-MM-dd'));
      setEditedStartTime(format(job.scheduledStart, 'HH:mm'));
    }
    if (job?.scheduledEnd) setEditedEndTime(format(job.scheduledEnd, 'HH:mm'));
    setIsEditingSchedule(false);
  };

  // Check if duration has changed from original
  const durationChanged = editedDurationMinutes !== durationMinutes;

  // Get current user name from storage
  // MainAdminUser always has ID=1, regular Users have ID > 1
  const getCurrentUserName = (): string => {
    try {
      const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('[JobConfirmationModal] Current user data:', { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email });
        
        // Handle both camelCase and snake_case field names
        const firstName = user.firstName || user.first_name || '';
        const lastName = user.lastName || user.last_name || '';
        
        if (firstName || lastName) {
          const fullName = `${firstName} ${lastName}`.trim();
          console.log('[JobConfirmationModal] Resolved user name:', fullName);
          return fullName;
        }
        
        // Fallback to email if no name available
        if (user.email) {
          console.log('[JobConfirmationModal] Using email as fallback:', user.email);
          return user.email;
        }
      }
    } catch (e) {
      console.warn('[JobConfirmationModal] Failed to get user name from storage:', e);
    }
    console.log('[JobConfirmationModal] No user data found, using System');
    return 'System';
  };

  // Get current user who locked/dispatched (lockInfo takes precedence, then current user)
  const dispatchedBy = lockInfo.lockedBy || getCurrentUserName();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            {isLocked ? (
              <>
                <Lock className="h-4 w-4 text-success" />
                {t('dispatcher.locked_dispatch')}
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-warning" />
                {t('dispatcher.dispatch_details')}
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 text-sm">
          {/* Job Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-xs text-muted-foreground">{t('dispatcher.job')}</span>
              <h3 className="font-semibold text-base leading-tight">{job.title}</h3>
              {job.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{job.description}</p>
              )}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {isLocked && (
                <Badge variant="default" className="bg-success text-white text-xs px-1.5 py-0">
                  <Lock className="h-2.5 w-2.5 mr-0.5" />
                  {t('dispatcher.locked')}
                </Badge>
              )}
              <Badge variant={getPriorityColor(job.priority)} className="text-xs px-1.5 py-0">
                {t(`dispatcher.priority_${job.priority}`)}
              </Badge>
            </div>
          </div>

          {/* Compact Info Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-muted/30 rounded-lg p-3">
            {/* Service Order - Clickable */}
            <div>
              <span className="text-xs text-muted-foreground">{t('dispatcher.service_order')}</span>
              <button
                onClick={() => handleNavigate(`/dashboard/field/service-orders/${job.serviceOrderId}`)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <FileText className="h-3 w-3" />
                <span className="truncate">{job.serviceOrderNumber || job.serviceOrderTitle || `SO-${job.serviceOrderId}`}</span>
                <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
              </button>
            </div>
            
            {/* Dispatch - Clickable */}
            <div>
              <span className="text-xs text-muted-foreground">{t('dispatcher.dispatch')}</span>
              <button
                onClick={() => handleNavigate(`/dashboard/field/dispatches/${job.id}`)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Briefcase className="h-3 w-3" />
                <span className="truncate">{t('dispatcher.view_dispatch')}</span>
                <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
              </button>
            </div>
            
            {/* Duration - Editable */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{t('dispatcher.duration')}</span>
                {!isLocked && onDurationChange && !isEditingDuration && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px]"
                    onClick={() => setIsEditingDuration(true)}
                  >
                    <Pencil className="h-2.5 w-2.5 mr-0.5" />
                    {t('dispatcher.edit_schedule')}
                  </Button>
                )}
              </div>
              
              {isEditingDuration ? (
                <div className="bg-muted/50 rounded-md p-2 space-y-2">
                  {/* Duration Editor */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDurationChange(-15)}
                      disabled={editedDurationMinutes <= 15}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="flex-1 text-center">
                      <Input
                        type="number"
                        min="15"
                        step="15"
                        value={editedDurationMinutes}
                        onChange={(e) => setEditedDurationMinutes(Math.max(15, parseInt(e.target.value) || 15))}
                        className="h-7 text-center text-sm font-medium"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDurationChange(15)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground w-8">{t('dispatcher.minutes_short')}</span>
                  </div>
                  
                  {/* Comparison with original */}
                  {job.originalDuration && job.originalDuration > 0 && (
                    <div className="flex items-center justify-between text-[10px] px-1">
                      <span className="text-muted-foreground">
                        {t('dispatcher.expected_duration')}: {formatDuration(job.originalDuration)}
                      </span>
                      <DurationIndicator 
                        plannedDuration={editedDurationMinutes} 
                        originalDuration={job.originalDuration}
                        size="sm"
                        showLabel
                      />
                    </div>
                  )}

                  {/* New end time preview */}
                  {job.scheduledStart && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      {t('dispatcher.new')}: {format(job.scheduledStart, 'HH:mm')} → {format(addMinutes(job.scheduledStart, editedDurationMinutes), 'HH:mm')}
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={handleCancelDurationEdit}
                    >
                      {t('dispatcher.cancel')}
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 text-xs"
                      onClick={handleSaveDuration}
                      disabled={!durationChanged}
                    >
                      {t('dispatcher.confirm')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-medium text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {formatDuration(durationMinutes)}
                  </p>
                  {/* Duration indicator comparing planned vs expected */}
                  <DurationIndicator 
                    plannedDuration={durationMinutes} 
                    originalDuration={job.originalDuration}
                    size="sm"
                  />
                </div>
              )}
            </div>
            
            {/* Installation - Clickable */}
            {(job.installationName || job.installationId) && (
              <div>
                <span className="text-xs text-muted-foreground">{t('dispatcher.installation')}</span>
                <button
                  onClick={() => handleNavigate(`/dashboard/installations/${job.installationId}`)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{job.installationName || `Installation #${job.installationId}`}</span>
                  <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                </button>
              </div>
            )}
            
            {/* Date & Time - Editable */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{t('dispatcher.schedule_info')}</span>
                {!isLocked && onScheduleChange && !isEditingSchedule && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px]"
                    onClick={() => setIsEditingSchedule(true)}
                  >
                    <Pencil className="h-2.5 w-2.5 mr-0.5" />
                    {t('dispatcher.edit_schedule_inline')}
                  </Button>
                )}
              </div>
              
              {isEditingSchedule ? (
                <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                  {/* Date Picker */}
                  <div>
                    <Label className="text-[10px] text-muted-foreground mb-1 block">{t('dispatcher.editing_date')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-8 text-xs",
                            !editedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {editedDate 
                            ? format(parse(editedDate, 'yyyy-MM-dd', new Date()), 'PPP', { locale: dateLocale })
                            : t('dispatcher.pick_date', 'Pick a date')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarWidget
                          mode="single"
                          selected={editedDate ? parse(editedDate, 'yyyy-MM-dd', new Date()) : undefined}
                          onSelect={(date) => {
                            if (date) setEditedDate(format(date, 'yyyy-MM-dd'));
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                          locale={dateLocale}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Pickers Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Start Time */}
                    <div>
                      <Label className="text-[10px] text-muted-foreground mb-1 block">{t('dispatcher.editing_time_start')}</Label>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-sm"
                            onClick={() => {
                              const [h, m] = editedStartTime.split(':').map(Number);
                              const total = h * 60 + m + 15;
                              setEditedStartTime(`${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
                            }}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-sm"
                            onClick={() => {
                              const [h, m] = editedStartTime.split(':').map(Number);
                              const total = (h * 60 + m - 15 + 1440) % 1440;
                              setEditedStartTime(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
                            }}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex-1 bg-background border rounded-md px-3 py-1.5 text-center font-mono text-sm font-medium">
                          {editedStartTime || '08:00'}
                        </div>
                      </div>
                    </div>

                    {/* End Time */}
                    <div>
                      <Label className="text-[10px] text-muted-foreground mb-1 block">{t('dispatcher.editing_time_end')}</Label>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-sm"
                            onClick={() => {
                              const [h, m] = editedEndTime.split(':').map(Number);
                              const total = h * 60 + m + 15;
                              setEditedEndTime(`${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
                            }}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-sm"
                            onClick={() => {
                              const [h, m] = editedEndTime.split(':').map(Number);
                              const total = (h * 60 + m - 15 + 1440) % 1440;
                              setEditedEndTime(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
                            }}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex-1 bg-background border rounded-md px-3 py-1.5 text-center font-mono text-sm font-medium">
                          {editedEndTime || '11:00'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duration summary */}
                  {editedStartTime && editedEndTime && (() => {
                    const [sh, sm] = editedStartTime.split(':').map(Number);
                    const [eh, em] = editedEndTime.split(':').map(Number);
                    const diffMin = (eh * 60 + em) - (sh * 60 + sm);
                    if (diffMin > 0) {
                      const dH = Math.floor(diffMin / 60);
                      const dM = diffMin % 60;
                      return (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-primary/5 rounded px-2 py-1">
                          <Timer className="h-3 w-3 text-primary" />
                          <span>{t('dispatcher.duration')}: <strong className="text-foreground">{dH}h {dM > 0 ? `${dM}m` : ''}</strong></span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleCancelScheduleEdit}
                      disabled={isSavingSchedule}
                    >
                      {t('dispatcher.cancel_edit')}
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleSaveSchedule}
                      disabled={isSavingSchedule}
                    >
                      {isSavingSchedule ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : null}
                      {t('dispatcher.save_schedule')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">{t('dispatcher.scheduled_date')}</span>
                    <p className="font-medium text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {job.scheduledStart ? format(job.scheduledStart, 'MMM dd, yyyy', { locale: dateLocale }) : t('dispatcher.not_specified')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">{t('dispatcher.scheduled_time')}</span>
                    <p className="font-medium text-xs">
                      {job.scheduledStart && job.scheduledEnd 
                        ? `${format(job.scheduledStart, 'HH:mm')} - ${format(job.scheduledEnd, 'HH:mm')}`
                        : t('dispatcher.not_specified')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Technician */}
            <div>
              <span className="text-xs text-muted-foreground">{t('dispatcher.assigned_technician')}</span>
              <p className="font-medium text-xs flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-muted-foreground" />
                {technician.firstName} {technician.lastName}
              </p>
            </div>
            
            {/* Customer - Clickable */}
            {job.contactId && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">{t('dispatcher.customer')}</span>
                <button
                  onClick={() => handleNavigate(`/dashboard/contacts/${job.contactId}`)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <User className="h-3 w-3" />
                  <span className="truncate">{job.customerName || t('dispatcher.not_specified')}</span>
                  <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                </button>
              </div>
            )}
            
            {/* Address - full width */}
            {job.location.address && job.location.address !== 'No address' && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">{t('dispatcher.address')}</span>
                <p className="font-medium text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {job.location.address}
                </p>
              </div>
            )}
          </div>

          {/* Lock Status Message */}
          {isLocked ? (
            <div className="bg-success/5 border border-success/20 rounded-md p-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                <div className="text-xs flex-1">
                  <p className="font-medium text-foreground">
                    {t('dispatcher.dispatch_confirmed_locked')}
                  </p>
                  {lockInfo.lockedBy && (
                    <p className="text-muted-foreground mt-0.5">
                      {t('dispatcher.locked_by')} {lockInfo.lockedBy}
                      {lockInfo.lockedAt && ` • ${format(new Date(lockInfo.lockedAt), 'MMM dd, HH:mm', { locale: dateLocale })}`}
                    </p>
                  )}
                </div>
                {onUnlock && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 border-warning/50 text-warning hover:bg-warning/10"
                    onClick={onUnlock}
                    disabled={isUnlocking}
                  >
                    {isUnlocking ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                    {t('dispatcher.unlock', 'Unlock')}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-warning/5 border border-warning/20 rounded-md p-2">
              <p className="text-xs text-foreground">
                {t('dispatcher.confirm_lock_info')}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex-row gap-2 pt-2">
          {!isLocked && (
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="gap-1.5"
                  disabled={isDeleting || isConfirming}
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {t('dispatcher.delete_dispatch')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('dispatcher.delete_dispatch_title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('dispatcher.delete_dispatch_description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('dispatcher.cancel')}</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteConfirm}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('dispatcher.delete_dispatch')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={onCancel}>
              {t('dispatcher.close')}
            </Button>
            {!isLocked && (
              <Button size="sm" onClick={onConfirm} disabled={isConfirming} className="gap-1.5">
                {isConfirming ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                {t('dispatcher.confirm_lock')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}