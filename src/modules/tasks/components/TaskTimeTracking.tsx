import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Clock,
  Play,
  Square,
  Plus,
  Timer,
  DollarSign,
  ChevronDown,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { taskTimeEntryApi } from '@/services/api/taskTimeEntryApi';
import { TaskTimeEntryDialog } from './TaskTimeEntryDialog';
import { TaskTimeEntryList } from './TaskTimeEntryList';
import type {
  TaskTimeEntry,
  TaskTimeTrackingSummary,
} from '@/modules/tasks/types/timeTracking';
import { formatDuration } from '@/modules/tasks/types/timeTracking';
import { cn } from '@/lib/utils';

interface TaskTimeTrackingProps {
  taskId: string;
  taskType: 'project' | 'daily';
  taskTitle: string;
  estimatedHours?: number;
  onTimeUpdated?: () => void;
}

export function TaskTimeTracking({
  taskId,
  taskType,
  taskTitle,
  estimatedHours,
  onTimeUpdated,
}: TaskTimeTrackingProps) {
  const { t, i18n } = useTranslation('tasks');
  const [summary, setSummary] = useState<TaskTimeTrackingSummary | null>(null);
  const [activeTimer, setActiveTimer] = useState<TaskTimeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTimerLoading, setIsTimerLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TaskTimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEntriesOpen, setIsEntriesOpen] = useState(false);

  const taskIdNum = parseInt(taskId, 10);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [summaryData, timerData] = await Promise.all([
        taskType === 'project'
          ? taskTimeEntryApi.getProjectTaskTimeSummary(taskIdNum)
          : taskTimeEntryApi.getDailyTaskTimeSummary(taskIdNum),
        taskTimeEntryApi.getActiveTimer(),
      ]);
      setSummary(summaryData);
      
      // Check if active timer is for this task
      if (timerData) {
        const isForThisTask = taskType === 'project' 
          ? timerData.projectTaskId === taskId 
          : timerData.dailyTaskId === taskId;
        if (isForThisTask) {
          setActiveTimer(timerData);
        }
      }
    } catch (error) {
      console.error('Failed to load time tracking data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [taskId, taskType, taskIdNum]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Timer elapsed time update
  useEffect(() => {
    if (!activeTimer) {
      setElapsedTime(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeTimer.startTime).getTime();
      const now = Date.now();
      setElapsedTime(Math.floor((now - start) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleStartTimer = async () => {
    try {
      setIsTimerLoading(true);
      const timer = await taskTimeEntryApi.startTimer(
        taskType === 'project' ? taskIdNum : undefined,
        taskType === 'daily' ? taskIdNum : undefined,
        'work'
      );
      setActiveTimer(timer);
      toast.success(t('timeTracking.toast.timerStarted'));
    } catch (error) {
      console.error('Failed to start timer:', error);
      toast.error(t('timeTracking.toast.timerStartError'));
    } finally {
      setIsTimerLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    
    try {
      setIsTimerLoading(true);
      await taskTimeEntryApi.stopTimer(parseInt(activeTimer.id, 10));
      setActiveTimer(null);
      toast.success(t('timeTracking.toast.timerStopped'));
      loadData();
      onTimeUpdated?.();
    } catch (error) {
      console.error('Failed to stop timer:', error);
      toast.error(t('timeTracking.toast.timerStopError'));
    } finally {
      setIsTimerLoading(false);
    }
  };

  const handleEntryCreated = () => {
    loadData();
    onTimeUpdated?.();
    setShowAddDialog(false);
  };

  const handleEntryUpdated = () => {
    loadData();
    onTimeUpdated?.();
    setEditingEntry(null);
  };

  const handleEntryDeleted = () => {
    loadData();
    onTimeUpdated?.();
  };

  const formatElapsedTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = summary && estimatedHours
    ? Math.min((summary.totalLoggedHours / estimatedHours) * 100, 100)
    : 0;

  const isOverEstimate = summary && estimatedHours && summary.totalLoggedHours > estimatedHours;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            {t('timeTracking.title')}
          </h4>
        </div>
        <div className="space-y-3 py-3 animate-pulse">
          <div className="h-8 w-full bg-muted/60 rounded" />
          <div className="h-8 w-3/4 bg-muted/60 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          {t('timeTracking.title')}
        </h4>
        <div className="flex items-center gap-2">
          {activeTimer ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleStopTimer}
              disabled={isTimerLoading}
              className="h-7 text-xs"
            >
              {isTimerLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Square className="h-3 w-3 mr-1" />
              )}
              {t('timeTracking.stopTimer')}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStartTimer}
              disabled={isTimerLoading}
              className="h-7 text-xs"
            >
              {isTimerLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              {t('timeTracking.startTimer')}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddDialog(true)}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            {t('timeTracking.addEntry')}
          </Button>
        </div>
      </div>

      {/* Active Timer Display */}
      {activeTimer && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <div>
              <p className="text-sm font-medium text-foreground">{t('timeTracking.timerRunning')}</p>
              <p className="text-xs text-muted-foreground">
                {t('timeTracking.workTypes.' + activeTimer.workType)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-destructive" />
            <span className="text-lg font-mono font-bold text-destructive">
              {formatElapsedTime(elapsedTime)}
            </span>
          </div>
        </div>
      )}

      {/* Summary Stats - Compact Grid */}
      <div className="grid grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            {summary ? formatDuration(summary.totalLoggedMinutes) : '-'}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('timeTracking.logged')}</p>
        </div>
        <div className="text-center border-l border-border">
          <p className="text-lg font-semibold text-foreground flex items-center justify-center">
            {summary?.totalCost ? (
              <>
                <DollarSign className="h-3.5 w-3.5" />
                {summary.totalCost.toLocaleString(i18n.language === 'fr' ? 'fr-TN' : 'en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </>
            ) : '-'}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('timeTracking.billable')}</p>
        </div>
        <div className="text-center border-l border-border">
          <p className="text-lg font-semibold text-foreground">
            {estimatedHours ? `${estimatedHours}h` : '-'}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('timeTracking.estimated')}</p>
        </div>
        <div className="text-center border-l border-border">
          <p className="text-lg font-semibold text-foreground">{summary?.entryCount || 0}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('timeTracking.entries')}</p>
        </div>
      </div>

      {/* Progress Bar (if estimated hours provided) */}
      {estimatedHours && summary && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('timeTracking.progress')}</span>
            <span className={cn(
              "font-medium",
              isOverEstimate && 'text-destructive'
            )}>
              {Math.round(progressPercentage)}%
              {isOverEstimate && <AlertCircle className="h-3 w-3 inline ml-1" />}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={cn("h-1.5", isOverEstimate && '[&>div]:bg-destructive')}
          />
        </div>
      )}

      {/* Time Entries - Collapsible */}
      <Collapsible open={isEntriesOpen} onOpenChange={setIsEntriesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-2">
              {t('timeTracking.recentEntries')}
              {summary && summary.entries.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {summary.entries.length}
                </Badge>
              )}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isEntriesOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          {summary && summary.entries.length > 0 ? (
            <ScrollArea className="h-[180px] pr-3">
              <TaskTimeEntryList
                entries={summary.entries}
                onEdit={setEditingEntry}
                onDelete={handleEntryDeleted}
                onRefresh={loadData}
              />
            </ScrollArea>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4 bg-muted/30 rounded-md">
              {t('timeTracking.noEntries')}
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Add/Edit Dialog */}
      <TaskTimeEntryDialog
        open={showAddDialog || !!editingEntry}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingEntry(null);
          }
        }}
        taskId={taskId}
        taskType={taskType}
        taskTitle={taskTitle}
        entry={editingEntry}
        onSuccess={editingEntry ? handleEntryUpdated : handleEntryCreated}
      />
    </div>
  );
}
