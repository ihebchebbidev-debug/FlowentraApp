import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { taskTimeEntryApi } from '@/services/api/taskTimeEntryApi';
import type {
  TaskTimeEntry,
  WorkType,
  CreateTaskTimeEntryDto,
  UpdateTaskTimeEntryDto,
} from '@/modules/tasks/types/timeTracking';

interface TaskTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskType: 'project' | 'daily';
  taskTitle: string;
  entry?: TaskTimeEntry | null;
  onSuccess: () => void;
}

const workTypes: WorkType[] = ['work', 'break', 'meeting', 'review', 'travel', 'other'];

export function TaskTimeEntryDialog({
  open,
  onOpenChange,
  taskId,
  taskType,
  taskTitle,
  entry,
  onSuccess,
}: TaskTimeEntryDialogProps) {
  const { t } = useTranslation('tasks');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state - simplified to duration
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [description, setDescription] = useState('');
  const [workType, setWorkType] = useState<WorkType>('work');
  const [isBillable, setIsBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState('');

  const isEditing = !!entry;

  // Reset/populate form when dialog opens or entry changes
  useEffect(() => {
    if (open) {
      if (entry) {
        const totalMinutes = entry.duration || 0;
        setHours(Math.floor(totalMinutes / 60).toString());
        setMinutes((totalMinutes % 60).toString());
        setDescription(entry.description || '');
        setWorkType(entry.workType);
        setIsBillable(entry.isBillable);
        setHourlyRate(entry.hourlyRate?.toString() || '');
      } else {
        setHours('0');
        setMinutes('30');
        setDescription('');
        setWorkType('work');
        setIsBillable(true);
        setHourlyRate('');
      }
    }
  }, [open, entry]);

  const handleSubmit = async () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const duration = h * 60 + m;

    if (duration <= 0) {
      toast.error(t('timeTracking.toast.durationRequired', 'Duration must be greater than 0'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate times: endTime = now, startTime = now - duration
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - duration * 60000);

      if (isEditing && entry) {
        const updateData: UpdateTaskTimeEntryDto = {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration,
          description: description.trim() || undefined,
          workType,
          isBillable,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        };

        await taskTimeEntryApi.updateTimeEntry(parseInt(entry.id, 10), updateData);
        toast.success(t('timeTracking.toast.entryUpdated'));
      } else {
        const createData: CreateTaskTimeEntryDto = {
          projectTaskId: taskType === 'project' ? parseInt(taskId, 10) : undefined,
          dailyTaskId: taskType === 'daily' ? parseInt(taskId, 10) : undefined,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration,
          description: description.trim() || undefined,
          workType,
          isBillable,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        };

        await taskTimeEntryApi.createTimeEntry(createData);
        toast.success(t('timeTracking.toast.entryCreated'));
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save time entry:', error);
      toast.error(
        isEditing
          ? t('timeTracking.toast.updateError')
          : t('timeTracking.toast.createError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('timeTracking.editEntry') : t('timeTracking.addEntry')}
          </DialogTitle>
          <DialogDescription>{taskTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Duration - Hours and Minutes inline */}
          <div className="space-y-1.5">
            <Label>{t('timeTracking.duration', 'Duration')} *</Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-16 text-center"
                />
                <span className="text-sm text-muted-foreground">h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-16 text-center"
                />
                <span className="text-sm text-muted-foreground">m</span>
              </div>
            </div>
          </div>

          {/* Work Type and Billable - inline */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label>{t('timeTracking.workType')}</Label>
              <Select value={workType} onValueChange={(v) => setWorkType(v as WorkType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`timeTracking.workTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Switch
                id="billable"
                checked={isBillable}
                onCheckedChange={setIsBillable}
              />
              <Label htmlFor="billable" className="text-sm cursor-pointer">
                {t('timeTracking.billable')}
              </Label>
            </div>
          </div>

          {/* Hourly Rate (shown only if billable) */}
          {isBillable && (
            <div className="space-y-1.5">
              <Label htmlFor="hourlyRate">{t('timeTracking.hourlyRate')}</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="0.00"
                className="h-9"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">{t('timeTracking.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('timeTracking.descriptionPlaceholder')}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? t('common.save') : t('timeTracking.addEntry')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}