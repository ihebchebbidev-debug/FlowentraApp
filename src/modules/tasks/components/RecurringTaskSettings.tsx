import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Repeat, 
  CalendarDays, 
  Pause, 
  Play,
  Trash2,
  ChevronDown,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { recurringTaskApi } from '@/services/api/recurringTaskApi';
import type { RecurringTask, RecurrenceType, CreateRecurringTaskDto } from '../types/recurring';

interface RecurringTaskSettingsProps {
  projectTaskId?: number;
  dailyTaskId?: number;
}

const DAYS_OF_WEEK = [
  { value: '0', labelKey: 'sun' },
  { value: '1', labelKey: 'mon' },
  { value: '2', labelKey: 'tue' },
  { value: '3', labelKey: 'wed' },
  { value: '4', labelKey: 'thu' },
  { value: '5', labelKey: 'fri' },
  { value: '6', labelKey: 'sat' },
];

export function RecurringTaskSettings({ projectTaskId, dailyTaskId }: RecurringTaskSettingsProps) {
  const { t } = useTranslation('tasks');
  const { toast } = useToast();
  
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // New recurring form state
  const [showForm, setShowForm] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [interval, setInterval] = useState(1);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [maxOccurrences, setMaxOccurrences] = useState<number | undefined>();

  useEffect(() => {
    fetchRecurringTasks();
  }, [projectTaskId, dailyTaskId]);

  const fetchRecurringTasks = async () => {
    if (!projectTaskId && !dailyTaskId) return;
    
    setIsLoading(true);
    try {
      let data: RecurringTask[];
      if (projectTaskId) {
        data = await recurringTaskApi.getForProjectTask(projectTaskId);
      } else if (dailyTaskId) {
        data = await recurringTaskApi.getForDailyTask(dailyTaskId);
      } else {
        data = [];
      }
      setRecurringTasks(data);
    } catch (err) {
      console.error('Failed to fetch recurring tasks:', err);
      setRecurringTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const dto: CreateRecurringTaskDto = {
        projectTaskId,
        dailyTaskId,
        recurrenceType,
        interval,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
        maxOccurrences,
      };

      if (recurrenceType === 'weekly' && selectedDays.length > 0) {
        dto.daysOfWeek = selectedDays.join(',');
      }
      if (recurrenceType === 'monthly') {
        dto.dayOfMonth = dayOfMonth;
      }

      const created = await recurringTaskApi.createRecurringTask(dto);
      setRecurringTasks((prev) => [...prev, created]);
      setShowForm(false);
      resetForm();
      
      toast({
        title: t('recurring.toast.created', 'Recurring task created'),
        description: created.recurrenceDescription,
      });
    } catch (err) {
      console.error('Failed to create recurring task:', err);
      toast({
        title: t('toast.error', 'Error'),
        description: t('recurring.toast.createError', 'Failed to create recurring task'),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePause = async (id: number) => {
    try {
      const updated = await recurringTaskApi.pauseRecurringTask(id);
      setRecurringTasks((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast({
        title: t('recurring.toast.paused', 'Recurring task paused'),
      });
    } catch (err) {
      console.error('Failed to pause:', err);
    }
  };

  const handleResume = async (id: number) => {
    try {
      const updated = await recurringTaskApi.resumeRecurringTask(id);
      setRecurringTasks((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast({
        title: t('recurring.toast.resumed', 'Recurring task resumed'),
      });
    } catch (err) {
      console.error('Failed to resume:', err);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await recurringTaskApi.deleteRecurringTask(deleteId);
      setRecurringTasks((prev) => prev.filter((r) => r.id !== deleteId));
      setDeleteId(null);
      toast({
        title: t('recurring.toast.deleted', 'Recurring task deleted'),
      });
    } catch (err) {
      console.error('Failed to delete:', err);
      toast({
        title: t('toast.error', 'Error'),
        description: t('recurring.toast.deleteError', 'Failed to delete recurring task'),
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setRecurrenceType('daily');
    setInterval(1);
    setSelectedDays([]);
    setDayOfMonth(1);
    setStartDate(new Date());
    setEndDate(undefined);
    setMaxOccurrences(undefined);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          {t('recurring.title', 'Recurring')}
        </h3>
        {!showForm && (
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            <Repeat className="h-4 w-4 mr-1" />
            {t('recurring.makeRecurring', 'Make Recurring')}
          </Button>
        )}
      </div>

      {/* Existing recurring tasks */}
      {recurringTasks.length > 0 && (
        <div className="space-y-2">
          {recurringTasks.map((rt) => (
            <div
              key={rt.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <Repeat className={cn(
                  "h-4 w-4",
                  rt.isPaused ? "text-muted-foreground" : "text-primary"
                )} />
                <div>
                  <p className="text-sm font-medium">{rt.recurrenceDescription}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {rt.nextOccurrence && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t('recurring.nextOn', 'Next:')} {format(new Date(rt.nextOccurrence), 'MMM d, yyyy')}
                      </span>
                    )}
                    <span>•</span>
                    <span>{rt.occurrenceCount} {t('recurring.generated', 'generated')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {rt.isPaused ? (
                  <Badge variant="secondary">{t('recurring.paused', 'Paused')}</Badge>
                ) : (
                  <Badge variant="default">{t('recurring.active', 'Active')}</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => rt.isPaused ? handleResume(rt.id) : handlePause(rt.id)}
                >
                  {rt.isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(rt.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/20">
          <div className="grid gap-4">
            {/* Recurrence type */}
            <div className="space-y-2">
              <Label>{t('recurring.repeatEvery', 'Repeat every')}</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20"
                />
                <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t('recurring.types.day', 'Day(s)')}</SelectItem>
                    <SelectItem value="weekly">{t('recurring.types.week', 'Week(s)')}</SelectItem>
                    <SelectItem value="monthly">{t('recurring.types.month', 'Month(s)')}</SelectItem>
                    <SelectItem value="yearly">{t('recurring.types.year', 'Year(s)')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Weekly: days of week */}
            {recurrenceType === 'weekly' && (
              <div className="space-y-2">
                <Label>{t('recurring.onDays', 'On days')}</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      className="w-10 h-8"
                      onClick={() => toggleDay(day.value)}
                    >
                      {t(`recurring.days.${day.labelKey}`, day.labelKey.substring(0, 2).toUpperCase())}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly: day of month */}
            {recurrenceType === 'monthly' && (
              <div className="space-y-2">
                <Label>{t('recurring.onDay', 'On day')}</Label>
                <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                    ))}
                    <SelectItem value="-1">{t('recurring.lastDay', 'Last day of month')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Start date */}
            <div className="space-y-2">
              <Label>{t('recurring.startDate', 'Start date')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {format(startDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => d && setStartDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End date (optional) */}
            <div className="space-y-2">
              <Label>{t('recurring.endDate', 'End date (optional)')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : t('recurring.noEndDate', 'No end date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                  {endDate && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setEndDate(undefined)}
                      >
                        {t('recurring.clearEndDate', 'Clear end date')}
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Max occurrences (optional) */}
            <div className="space-y-2">
              <Label>{t('recurring.maxOccurrences', 'Max occurrences (optional)')}</Label>
              <Input
                type="number"
                min={1}
                placeholder={t('recurring.unlimited', 'Unlimited')}
                value={maxOccurrences ?? ''}
                onChange={(e) => setMaxOccurrences(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {t('recurring.createRecurring', 'Create Recurring Task')}
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {recurringTasks.length === 0 && !showForm && (
        <div className="text-center py-4 text-muted-foreground">
          <Repeat className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('recurring.noRecurring', 'Not a recurring task')}</p>
          <p className="text-xs">{t('recurring.makeRecurringHint', 'Make this task repeat automatically')}</p>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('recurring.deleteConfirm.title', 'Delete Recurring Rule')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('recurring.deleteConfirm.description', 'This will stop the task from recurring. Already generated tasks will not be affected.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
