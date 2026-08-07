import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  User, Clock, MapPin, Trash2, Loader2, Lock, CheckCircle2,
  FileText, Briefcase, Calendar, ExternalLink, Building2,
  Minus, Plus, UserCheck, Pencil,
} from "lucide-react";
import { DurationIndicator } from "./calendar/DurationIndicator";
import { ScheduleTimeEditor, buildDateFromStrings } from "./ScheduleTimeEditor";
import { format, addMinutes } from "date-fns";
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
  isUnlocking = false,
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

  useEffect(() => {
    if (!job) return;
    const locked = job.isLocked || DispatcherService.isDispatchLocked(job.id);
    setIsLocked(locked);
    if (locked) {
      const info = DispatcherService.getDispatchLockInfo(job.id);
      setLockInfo({ lockedAt: info.lockedAt, lockedBy: info.lockedBy });
    }
    const currentDuration = job.scheduledEnd && job.scheduledStart
      ? Math.round((job.scheduledEnd.getTime() - job.scheduledStart.getTime()) / (1000 * 60))
      : job.estimatedDuration;
    setEditedDurationMinutes(currentDuration);
    setIsEditingDuration(false);
    if (job.scheduledStart) {
      setEditedDate(format(job.scheduledStart, 'yyyy-MM-dd'));
      setEditedStartTime(format(job.scheduledStart, 'HH:mm'));
    }
    if (job.scheduledEnd) setEditedEndTime(format(job.scheduledEnd, 'HH:mm'));
    setIsEditingSchedule(false);
    setIsSavingSchedule(false);
  }, [job]);

  if (!job || !technician) return null;

  const getPriorityColor = (priority: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const durationMinutes = job.scheduledEnd && job.scheduledStart
    ? Math.round((job.scheduledEnd.getTime() - job.scheduledStart.getTime()) / (1000 * 60))
    : job.estimatedDuration;

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}${t('dispatcher.hours_short')} ${m}${t('dispatcher.minutes_short')}`;
    if (h > 0) return `${h}${t('dispatcher.hours_short')}`;
    return `${m}${t('dispatcher.minutes_short')}`;
  };

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleSaveDuration = () => {
    if (job.scheduledStart && onDurationChange) {
      onDurationChange(job.id, addMinutes(job.scheduledStart, editedDurationMinutes));
      setIsEditingDuration(false);
    }
  };

  const handleCancelDurationEdit = () => {
    setEditedDurationMinutes(durationMinutes);
    setIsEditingDuration(false);
  };

  const handleSaveSchedule = async () => {
    if (!onScheduleChange) return;
    const newStart = buildDateFromStrings(editedDate, editedStartTime);
    const newEnd = buildDateFromStrings(editedDate, editedEndTime);
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
    if (job.scheduledStart) {
      setEditedDate(format(job.scheduledStart, 'yyyy-MM-dd'));
      setEditedStartTime(format(job.scheduledStart, 'HH:mm'));
    }
    if (job.scheduledEnd) setEditedEndTime(format(job.scheduledEnd, 'HH:mm'));
    setIsEditingSchedule(false);
  };

  const durationChanged = editedDurationMinutes !== durationMinutes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLocked
              ? <Lock className="h-5 w-5 text-success" />
              : <Calendar className="h-5 w-5 text-primary" />}
            {isLocked ? t('dispatcher.locked_dispatch') : t('dispatcher.dispatch_details')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('dispatcher.dispatch_details')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

          {/* ── Job details ── */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-tight">{job.title}</h3>
              <div className="flex gap-1.5 flex-shrink-0">
                {isLocked && (
                  <Badge variant="default" className="bg-success text-white text-px-10 px-1.5 py-0">
                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                    {t('dispatcher.locked')}
                  </Badge>
                )}
                <Badge variant={getPriorityColor(job.priority)} className="text-px-10">
                  {t(`dispatcher.priority_${job.priority}`).toUpperCase()}
                </Badge>
              </div>
            </div>

            {job.description && (
              <p className="text-sm text-muted-foreground">{job.description}</p>
            )}

            {/* Customer / contact */}
            <div className="border-t border-border pt-3 space-y-1.5">
              {job.contactId ? (
                <button
                  onClick={() => handleNavigate(`/dashboard/contacts/${job.contactId}`)}
                  className="text-sm flex items-center gap-2 text-primary hover:underline"
                >
                  <User className="h-4 w-4" />
                  <span className="font-medium">{job.customerName}</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              ) : (
                <p className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('dispatcher.contact')}:</span>
                  <span className="font-medium">{job.customerName}</span>
                </p>
              )}
              {job.customerCompany && (
                <p className="text-sm text-muted-foreground ml-6">{t('dispatcher.company')}: {job.customerCompany}</p>
              )}
              {job.customerPhone && (
                <p className="text-sm text-muted-foreground ml-6">{t('dispatcher.phone')}: {job.customerPhone}</p>
              )}
              {job.customerEmail && (
                <p className="text-sm text-muted-foreground ml-6">{t('dispatcher.email')}: {job.customerEmail}</p>
              )}
              {job.location?.address && job.location.address !== 'No address' && (
                <p className="text-sm text-muted-foreground ml-6 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  {job.location.address}
                </p>
              )}
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleNavigate(`/dashboard/field/service-orders/${job.serviceOrderId}`)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <FileText className="h-3 w-3" />
                {job.serviceOrderNumber || job.serviceOrderTitle || `SO-${job.serviceOrderId}`}
                <ExternalLink className="h-2.5 w-2.5" />
              </button>
              <button
                onClick={() => handleNavigate(`/dashboard/field/dispatches/${job.id}`)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Briefcase className="h-3 w-3" />
                {t('dispatcher.view_dispatch')}
                <ExternalLink className="h-2.5 w-2.5" />
              </button>
              {(job.installationName || job.installationId) && (
                <button
                  onClick={() => handleNavigate(`/dashboard/installations/${job.installationId}`)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Building2 className="h-3 w-3" />
                  {job.installationName || `Installation #${job.installationId}`}
                  <ExternalLink className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>

          {/* ── Assignment & schedule ── */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">{t('dispatcher.assignment_details')}</h4>

            {/* Technician */}
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('dispatcher.assigned_technician')}:</span>
              <span className="font-medium">{technician.firstName} {technician.lastName}</span>
            </div>

            {/* Schedule row — edit mode uses shared ScheduleTimeEditor */}
            {isEditingSchedule ? (
              <div className="space-y-2">
                <ScheduleTimeEditor
                  date={editedDate}
                  startTime={editedStartTime}
                  endTime={editedEndTime}
                  onDateChange={setEditedDate}
                  onStartTimeChange={setEditedStartTime}
                  onEndTimeChange={setEditedEndTime}
                  disabled={isSavingSchedule}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancelScheduleEdit} disabled={isSavingSchedule}>
                    {t('dispatcher.cancel_edit')}
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={handleSaveSchedule} disabled={isSavingSchedule}>
                    {isSavingSchedule && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                    {t('dispatcher.save_schedule')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {job.scheduledStart
                      ? format(job.scheduledStart, 'EEEE, MMMM dd, yyyy', { locale: dateLocale })
                      : t('dispatcher.not_specified')}
                  </span>
                  {job.scheduledStart && job.scheduledEnd && (
                    <>
                      <span>·</span>
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{format(job.scheduledStart, 'HH:mm')} – {format(job.scheduledEnd, 'HH:mm')}</span>
                    </>
                  )}
                </div>
                {!isLocked && onScheduleChange && (
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-px-10 flex-shrink-0" onClick={() => setIsEditingSchedule(true)}>
                    <Pencil className="h-2.5 w-2.5 mr-0.5" />
                    {t('dispatcher.edit_schedule')}
                  </Button>
                )}
              </div>
            )}

            {/* Duration row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDuration(durationMinutes)}
                  </p>
                  <DurationIndicator plannedDuration={durationMinutes} originalDuration={job.originalDuration} size="sm" />
                </div>
                {!isLocked && onDurationChange && !isEditingDuration && (
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-px-10 flex-shrink-0" onClick={() => setIsEditingDuration(true)}>
                    <Pencil className="h-2.5 w-2.5 mr-0.5" />
                    {t('dispatcher.edit_duration', 'Edit')}
                  </Button>
                )}
              </div>

              {isEditingDuration && (
                <div className="bg-muted/50 rounded-md p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setEditedDurationMinutes(prev => Math.max(15, prev - 15))} disabled={editedDurationMinutes <= 15}>
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
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setEditedDurationMinutes(prev => prev + 15)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground w-8">{t('dispatcher.minutes_short')}</span>
                  </div>
                  {job.originalDuration && job.originalDuration > 0 && (
                    <div className="flex items-center justify-between text-px-10 px-1">
                      <span className="text-muted-foreground">{t('dispatcher.expected_duration')}: {formatDuration(job.originalDuration)}</span>
                      <DurationIndicator plannedDuration={editedDurationMinutes} originalDuration={job.originalDuration} size="sm" showLabel />
                    </div>
                  )}
                  {job.scheduledStart && (
                    <div className="text-px-10 text-muted-foreground px-1">
                      {t('dispatcher.new')}: {format(job.scheduledStart, 'HH:mm')} → {format(addMinutes(job.scheduledStart, editedDurationMinutes), 'HH:mm')}
                    </div>
                  )}
                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleCancelDurationEdit}>
                      {t('dispatcher.cancel')}
                    </Button>
                    <Button size="sm" className="h-6 text-xs" onClick={handleSaveDuration} disabled={!durationChanged}>
                      {t('dispatcher.confirm')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Lock status ── */}
          {isLocked ? (
            <div className="bg-success/5 border border-success/20 rounded-md p-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                <div className="text-xs flex-1">
                  <p className="font-medium text-foreground">{t('dispatcher.dispatch_confirmed_locked')}</p>
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
                    {isUnlocking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
                    {t('dispatcher.unlock', 'Unlock')}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-warning/5 border border-warning/20 rounded-md p-2">
              <p className="text-xs text-foreground">{t('dispatcher.confirm_lock_info')}</p>
            </div>
          )}

        </div>

        <DialogFooter className="flex-row gap-2 pt-2">
          {!isLocked && (
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5" disabled={isDeleting || isConfirming}>
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  {t('dispatcher.delete_dispatch')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('dispatcher.delete_dispatch_title')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('dispatcher.delete_dispatch_description')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('dispatcher.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => { setShowDeleteConfirm(false); onUnassign(); }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('dispatcher.delete_dispatch')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onCancel}>
              {t('dispatcher.close')}
            </Button>
            {!isLocked && (
              <Button size="sm" onClick={onConfirm} disabled={isConfirming} className="gap-1.5">
                {isConfirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                {t('dispatcher.confirm_lock')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
