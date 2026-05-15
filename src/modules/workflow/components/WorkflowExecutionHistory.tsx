import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  History, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Pause, 
  RotateCcw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  X as XIcon,
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { workflowExecutionsApi, WorkflowExecution, WorkflowExecutionLog } from '@/services/api/workflowApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkflowExecutionHistoryProps {
  workflowId?: number;
  workflowName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExecutionStatus = 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
type FilterStatus = ExecutionStatus | 'all';

const POLLING_INTERVAL = 5000; // 5 seconds

export function WorkflowExecutionHistory({
  workflowId,
  workflowName,
  open,
  onOpenChange
}: WorkflowExecutionHistoryProps) {
  const { t } = useTranslation();
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if there are any running executions
  const hasRunningExecutions = executions.some(
    e => e.status === 'running' || e.status === 'waiting_approval'
  );

  // Load executions function
  const loadExecutions = useCallback(async (showLoading = true) => {
    if (!workflowId) return;
    if (showLoading) setLoading(true);
    try {
      const data = await workflowExecutionsApi.getByWorkflow(workflowId);
      const sorted = [...data].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      setExecutions(sorted);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load executions:', err);
      if (showLoading) {
        toast.error(t('executionHistory.loadError'));
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [workflowId, t]);

  // Initial load
  useEffect(() => {
    if (open && workflowId) {
      loadExecutions();
    }
    // Reset polling state when dialog closes
    if (!open) {
      setLastUpdated(null);
    }
  }, [open, workflowId, loadExecutions]);

  // Polling effect
  // IMPORTANT: poll while the dialog is open so new executions (started elsewhere)
  // show up without requiring a manual refresh.
  useEffect(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (isPolling && open && workflowId) {
      pollingIntervalRef.current = setInterval(() => {
        loadExecutions(false); // Silent refresh (no loading state)
      }, POLLING_INTERVAL);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isPolling, open, workflowId, loadExecutions]);

  const handleCancel = async (executionId: number) => {
    try {
      const success = await workflowExecutionsApi.cancel(executionId);
      if (success) {
        setExecutions(prev => 
          prev.map(e => e.id === executionId ? { ...e, status: 'cancelled' as const } : e)
        );
        toast.success(t('executionHistory.cancelled'));
      }
    } catch (err) {
      toast.error(t('executionHistory.cancelError'));
    }
  };

  const handleRetry = async (executionId: number) => {
    try {
      const success = await workflowExecutionsApi.retry(executionId);
      if (success) {
        toast.success(t('executionHistory.retried'));
        loadExecutions();
      }
    } catch (err) {
      toast.error(t('executionHistory.retryError'));
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter executions
  const filteredExecutions = executions.filter(exec => {
    const matchesStatus = filterStatus === 'all' || exec.status === filterStatus;
    const matchesSearch = !searchQuery || 
      exec.workflowName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exec.triggerEntityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(exec.triggerEntityId).includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-primary animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'cancelled':
        return <XIcon className="h-4 w-4 text-muted-foreground" />;
      case 'waiting_approval':
        return <Clock className="h-4 w-4 text-accent-foreground" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ExecutionStatus) => {
    const variants: Record<ExecutionStatus, string> = {
      running: 'bg-primary/10 text-primary border-primary/20',
      completed: 'bg-primary/10 text-primary border-primary/20',
      failed: 'bg-destructive/10 text-destructive border-destructive/20',
      cancelled: 'bg-muted text-muted-foreground border-border',
      waiting_approval: 'bg-accent text-accent-foreground border-accent'
    };

    return (
      <Badge variant="outline" className={cn('gap-1.5', variants[status])}>
        {getStatusIcon(status)}
        {t(`executionHistory.status.${status}`)}
      </Badge>
    );
  };

  const getLogStatusIcon = (status: string) => {
    switch (status) {
      case 'started':
        return <Play className="h-3 w-3 text-primary" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-primary" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-destructive" />;
      case 'skipped':
        return <Pause className="h-3 w-3 text-muted-foreground" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {t('executionHistory.title')}
            {workflowName && (
              <span className="text-muted-foreground font-normal">
                — {workflowName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex items-center gap-3 py-3 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('executionHistory.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('executionHistory.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('executionHistory.filter.all')}</SelectItem>
              <SelectItem value="running">{t('executionHistory.status.running')}</SelectItem>
              <SelectItem value="completed">{t('executionHistory.status.completed')}</SelectItem>
              <SelectItem value="failed">{t('executionHistory.status.failed')}</SelectItem>
              <SelectItem value="waiting_approval">{t('executionHistory.status.waiting_approval')}</SelectItem>
              <SelectItem value="cancelled">{t('executionHistory.status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => loadExecutions()} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Live Updates Toggle */}
        {open && workflowId && (
          <div className="flex items-center justify-between py-2 px-1">
            <div className="flex items-center gap-2">
              <Radio className={cn(
                "h-4 w-4",
                isPolling ? "text-primary animate-pulse" : "text-muted-foreground"
              )} />
              <Label htmlFor="live-updates" className="text-sm text-muted-foreground">
                {t('executionHistory.liveUpdates')}
              </Label>
              {hasRunningExecutions && (
                <Badge variant="outline" className="ml-2">
                  {t('executionHistory.status.running')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  {t('executionHistory.lastUpdated', {
                    time: format(lastUpdated, 'HH:mm:ss')
                  })}
                </span>
              )}
              <Switch
                id="live-updates"
                checked={isPolling}
                onCheckedChange={setIsPolling}
              />
            </div>
          </div>
        )}

        {/* Execution List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading && executions.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              {t('executionHistory.loading')}
            </div>
          ) : filteredExecutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">{t('executionHistory.noExecutions')}</p>
              <p className="text-xs mt-1">{t('executionHistory.noExecutionsHint')}</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {filteredExecutions.map((execution) => (
                <ExecutionCard
                  key={execution.id}
                  execution={execution}
                  expanded={expandedIds.has(execution.id)}
                  onToggle={() => toggleExpanded(execution.id)}
                  onCancel={() => handleCancel(execution.id)}
                  onRetry={() => handleRetry(execution.id)}
                  getStatusBadge={getStatusBadge}
                  getLogStatusIcon={getLogStatusIcon}
                  t={t}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Summary */}
        {executions.length > 0 && (
          <div className="pt-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t('executionHistory.totalExecutions', { count: executions.length })}
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                {executions.filter(e => e.status === 'completed').length}
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                {executions.filter(e => e.status === 'failed').length}
              </span>
              <span className="flex items-center gap-1">
                <Play className="h-3.5 w-3.5 text-primary" />
                {executions.filter(e => e.status === 'running').length}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ExecutionCardProps {
  execution: WorkflowExecution;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onRetry: () => void;
  getStatusBadge: (status: ExecutionStatus) => React.ReactNode;
  getLogStatusIcon: (status: string) => React.ReactNode;
  t: (key: string, options?: any) => string;
}

function ExecutionCard({
  execution,
  expanded,
  onToggle,
  onCancel,
  onRetry,
  getStatusBadge,
  getLogStatusIcon,
  t
}: ExecutionCardProps) {
  const startedAt = new Date(execution.startedAt);
  const completedAt = execution.completedAt ? new Date(execution.completedAt) : null;
  const duration = completedAt 
    ? completedAt.getTime() - startedAt.getTime()
    : null;

  // For running executions, show elapsed time
  const elapsedTime = execution.status === 'running' 
    ? Date.now() - startedAt.getTime()
    : null;
  
  // Check if execution is stuck (running for more than 5 minutes)
  const isStuck = execution.status === 'running' && elapsedTime && elapsedTime > 5 * 60 * 1000;
  const hasError = execution.status === 'failed' || execution.error || isStuck;

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className={cn(
        "rounded-lg border bg-card overflow-hidden transition-colors",
        hasError && "border-destructive/50 ring-1 ring-destructive/20",
        execution.status === 'running' && !isStuck && "border-primary/50 ring-1 ring-primary/20"
      )}>
        {/* Prominent Error Banner at Top */}
        {(execution.error || isStuck) && (
          <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-1">
              {isStuck && (
                <p className="text-sm font-semibold text-destructive">
                  ⚠️ Execution Stuck — Running for {Math.floor((elapsedTime || 0) / 60000)} minutes
                </p>
              )}
              {execution.error && (
                <div className="text-sm text-destructive">
                  <strong>Error:</strong>
                  <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs bg-destructive/5 p-2 rounded">
                    {execution.error}
                  </pre>
                </div>
              )}
              {!execution.error && isStuck && (
                <p className="text-xs text-destructive/80">
                  This execution may have encountered an unhandled error. Check the last executed node for clues.
                </p>
              )}
            </div>
          </div>
        )}
        {/* Header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  #{execution.id}
                </span>
                {getStatusBadge(execution.status)}
                {execution.status === 'running' && elapsedTime && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    {t('executionHistory.elapsed', { 
                      time: Math.floor(elapsedTime / 1000) 
                    })}s
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>
                  {t('executionHistory.triggeredBy', { 
                    type: execution.triggerEntityType,
                    id: execution.triggerEntityId 
                  })}
                </span>
                <span>•</span>
                <Tooltip>
                  <TooltipTrigger>
                    <span>{formatDistanceToNow(startedAt, { addSuffix: true })}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {format(startedAt, 'PPpp')}
                  </TooltipContent>
                </Tooltip>
                {duration !== null && (
                  <>
                    <span>•</span>
                    <span>{t('executionHistory.duration', { ms: duration })}</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {execution.status === 'running' && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  <XIcon className="h-3.5 w-3.5 mr-1" />
                  {t('executionHistory.cancel')}
                </Button>
              )}
              {execution.status === 'failed' && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  {t('executionHistory.retry')}
                </Button>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Expanded Content - Logs */}
        <CollapsibleContent>
          <div className="border-t border-border bg-muted/20 p-4">
            {execution.error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <strong>{t('executionHistory.error')}:</strong> {execution.error}
              </div>
            )}

            {execution.logs && execution.logs.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {t('executionHistory.executionLogs')}
                </h4>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                  
                  {execution.logs.map((log, index) => (
                    <LogEntry 
                      key={log.id} 
                      log={log} 
                      isLast={index === execution.logs!.length - 1}
                      getLogStatusIcon={getLogStatusIcon}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('executionHistory.noLogs')}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface LogEntryProps {
  log: WorkflowExecutionLog;
  isLast: boolean;
  getLogStatusIcon: (status: string) => React.ReactNode;
  t: (key: string, options?: any) => string;
}

function LogEntry({ log, isLast, getLogStatusIcon, t }: LogEntryProps) {
  const timestamp = new Date(log.timestamp);

  return (
    <div className="relative flex items-start gap-3 pb-3 pl-6">
      {/* Status dot */}
      <div className="absolute left-0 top-1 h-4 w-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
        {getLogStatusIcon(log.status)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{log.nodeType}</span>
          <Badge variant="outline" className="text-xs py-0">
            {log.nodeId}
          </Badge>
          {log.duration && (
            <span className="text-xs text-muted-foreground">
              {log.duration}ms
            </span>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground mt-0.5">
          {format(timestamp, 'HH:mm:ss.SSS')}
        </div>

        {log.error && (
          <div className="mt-2 text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
            {log.error}
          </div>
        )}
      </div>
    </div>
  );
}
