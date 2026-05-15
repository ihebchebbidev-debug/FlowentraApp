import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Bug,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  X as XIcon,
  Radio,
  Circle,
  Loader2,
  AlertOctagon,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { workflowExecutionsApi, WorkflowExecution, WorkflowExecutionLog } from '@/services/api/workflowApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Node } from '@xyflow/react';

const POLLING_INTERVAL = 3000;

interface ExecutionDebugPanelProps {
  workflowId?: number | null;
  nodes: Node[];
  isOpen: boolean;
  onClose: () => void;
  onHighlightNode?: (nodeId: string | null) => void;
  liveExecutionId?: number | null;
}

type NodePipelineStatus = 'idle' | 'waiting' | 'executing' | 'completed' | 'failed' | 'skipped' | 'blocked';

interface NodePipelineEntry {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  status: NodePipelineStatus;
  log?: WorkflowExecutionLog;
  error?: string;
  duration?: number;
  timestamp?: string;
}

export function ExecutionDebugPanel({
  workflowId,
  nodes,
  isOpen,
  onClose,
  onHighlightNode,
  liveExecutionId,
}: ExecutionDebugPanelProps) {
  const { t: _t } = useTranslation();
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasRunning = executions.some(e => e.status === 'running' || e.status === 'waiting_approval');

  // Load executions
  const loadExecutions = useCallback(async (silent = false) => {
    if (!workflowId) return;
    if (!silent) setLoading(true);
    try {
      const data = await workflowExecutionsApi.getByWorkflow(workflowId, 1, 10);
      console.log('[DebugPanel] Loaded executions:', data.length, data.map(e => ({ id: e.id, status: e.status, currentNode: e.currentNodeId, logs: e.logs?.length })));
      setExecutions(data);
      setLastUpdated(new Date());
      
      // Auto-select most recent running or latest
      if (!selectedExecution || silent) {
        const running = data.find(e => e.status === 'running' || e.status === 'waiting_approval');
        const latest = data[0];
        if (running) {
          setSelectedExecution(running);
        } else if (!selectedExecution && latest) {
          setSelectedExecution(latest);
        }
      } else {
        // Update selected execution with fresh data
        const updated = data.find(e => e.id === selectedExecution.id);
        if (updated) setSelectedExecution(updated);
      }
    } catch (err) {
      console.error('[DebugPanel] Failed to load executions:', err);
      if (!silent) toast.error('Failed to load execution history');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [workflowId, selectedExecution]);

  // Live execution tracking
  useEffect(() => {
    if (liveExecutionId && workflowId) {
      console.log('[DebugPanel] Live execution detected:', liveExecutionId);
      // Refresh to pick up the live execution
      loadExecutions(true);
    }
  }, [liveExecutionId, workflowId, loadExecutions]);

  // Initial load
  useEffect(() => {
    if (isOpen && workflowId) {
      loadExecutions();
    }
  }, [isOpen, workflowId, loadExecutions]);

  // Polling
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (isPolling && isOpen && (hasRunning || liveExecutionId)) {
      pollingRef.current = setInterval(() => {
        loadExecutions(true);
      }, POLLING_INTERVAL);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isPolling, isOpen, hasRunning, liveExecutionId, loadExecutions]);

  // Build node pipeline from workflow nodes + execution logs
  const buildPipeline = useCallback((): NodePipelineEntry[] => {
    if (!selectedExecution) {
      return nodes.map(n => ({
        nodeId: n.id,
        nodeLabel: (n.data as any)?.label || n.id,
        nodeType: (n.data as any)?.type || n.type || 'unknown',
        status: 'idle' as NodePipelineStatus,
      }));
    }

    const logs = selectedExecution.logs || [];
    const logMap = new Map<string, WorkflowExecutionLog>();
    logs.forEach(log => {
      // Keep the latest log per node
      const existing = logMap.get(log.nodeId);
      if (!existing || new Date(log.timestamp) > new Date(existing.timestamp)) {
        logMap.set(log.nodeId, log);
      }
    });

    return nodes.map(n => {
      const nodeId = n.id;
      const log = logMap.get(nodeId);
      let status: NodePipelineStatus = 'idle';

      if (log) {
        switch (log.status) {
          case 'started': status = 'executing'; break;
          case 'completed': status = 'completed'; break;
          case 'failed': status = 'failed'; break;
          case 'skipped': status = 'skipped'; break;
          default: status = 'waiting';
        }
      } else if (selectedExecution.status === 'running') {
        // If the execution is running and this node hasn't been reached yet
        if (selectedExecution.currentNodeId === nodeId) {
          status = 'executing';
        } else {
          // Check if nodes before this one have completed (simple heuristic)
          status = 'waiting';
        }
      } else if (selectedExecution.status === 'failed' && selectedExecution.currentNodeId === nodeId) {
        status = 'blocked';
      } else if (selectedExecution.status === 'waiting_approval' && selectedExecution.currentNodeId === nodeId) {
        status = 'blocked';
      }

      return {
        nodeId,
        nodeLabel: (n.data as any)?.label || nodeId,
        nodeType: (n.data as any)?.type || n.type || 'unknown',
        status,
        log,
        error: log?.error || (selectedExecution.currentNodeId === nodeId && selectedExecution.error ? selectedExecution.error : undefined),
        duration: log?.duration,
        timestamp: log?.timestamp,
      };
    });
  }, [nodes, selectedExecution]);

  const pipeline = buildPipeline();

  const getStatusIcon = (status: NodePipelineStatus) => {
    switch (status) {
      case 'idle': return <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />;
      case 'waiting': return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
      case 'executing': return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
      case 'completed': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'failed': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'skipped': return <Pause className="h-3.5 w-3.5 text-muted-foreground" />;
      case 'blocked': return <AlertOctagon className="h-3.5 w-3.5 text-amber-500 animate-pulse" />;
    }
  };

  const getStatusColor = (status: NodePipelineStatus) => {
    switch (status) {
      case 'idle': return 'border-muted';
      case 'waiting': return 'border-muted-foreground/30';
      case 'executing': return 'border-primary bg-primary/5 ring-1 ring-primary/20';
      case 'completed': return 'border-success/50 bg-success/5';
      case 'failed': return 'border-destructive/50 bg-destructive/5';
      case 'skipped': return 'border-muted bg-muted/30';
      case 'blocked': return 'border-warning/50 bg-warning/5 ring-1 ring-warning/20';
    }
  };

  const getExecStatusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode }> = {
      running: { color: 'bg-primary/10 text-primary', icon: <Play className="h-3 w-3" /> },
      completed: { color: 'bg-success/10 text-success', icon: <CheckCircle2 className="h-3 w-3" /> },
      failed: { color: 'bg-destructive/10 text-destructive', icon: <XCircle className="h-3 w-3" /> },
      cancelled: { color: 'bg-muted text-muted-foreground', icon: <XIcon className="h-3 w-3" /> },
      waiting_approval: { color: 'bg-warning/10 text-warning', icon: <Clock className="h-3 w-3" /> },
    };
    const s = map[status] || map.cancelled;
    return (
      <Badge variant="outline" className={cn('gap-1 text-[10px] py-0 px-1.5', s.color)}>
        {s.icon}
        {status}
      </Badge>
    );
  };

  const handleCancel = async (id: number) => {
    try {
      await workflowExecutionsApi.cancel(id);
      toast.success('Execution cancelled');
      loadExecutions(true);
    } catch { toast.error('Failed to cancel'); }
  };

  const handleRetry = async (id: number) => {
    try {
      await workflowExecutionsApi.retry(id);
      toast.success('Execution retried');
      loadExecutions(true);
    } catch { toast.error('Failed to retry'); }
  };

  if (!isOpen) return null;

  const completedCount = pipeline.filter(n => n.status === 'completed').length;
  const failedCount = pipeline.filter(n => n.status === 'failed' || n.status === 'blocked').length;
  const totalNodes = pipeline.length;

  return (
    <div className="w-[340px] border-l border-border bg-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Execution Debug</span>
          {hasRunning && (
            <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadExecutions()}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <XIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Execution Selector */}
      <div className="p-2 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Recent Executions</Label>
          <div className="flex items-center gap-1.5">
            <Label className="text-[10px] text-muted-foreground">Auto-refresh</Label>
            <Switch checked={isPolling} onCheckedChange={setIsPolling} className="scale-75" />
          </div>
        </div>
        
        <ScrollArea className="max-h-[120px]">
          <div className="space-y-1">
            {executions.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center py-3">No executions yet</p>
            )}
            {loading && executions.length === 0 && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {executions.map(exec => (
              <button
                key={exec.id}
                onClick={() => setSelectedExecution(exec)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center gap-2",
                  selectedExecution?.id === exec.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50 border border-transparent"
                )}
              >
                <span className="font-mono text-muted-foreground">#{exec.id}</span>
                {getExecStatusBadge(exec.status)}
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(exec.startedAt), { addSuffix: true })}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Pipeline Status */}
      {selectedExecution && (
        <div className="p-2 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Pipeline #{selectedExecution.id}</span>
            <div className="flex items-center gap-2">
              {selectedExecution.status === 'running' && (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleCancel(selectedExecution.id)}>
                  Cancel
                </Button>
              )}
              {selectedExecution.status === 'failed' && (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleRetry(selectedExecution.id)}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                failedCount > 0 ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${totalNodes > 0 ? ((completedCount / totalNodes) * 100) : 0}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-success" />
              {completedCount}
            </span>
            {failedCount > 0 && (
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-destructive" />
                {failedCount}
              </span>
            )}
            <span className="ml-auto">
              {completedCount}/{totalNodes} nodes
            </span>
          </div>

          {/* Global Error */}
          {selectedExecution.error && (
            <div className="mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 text-[11px] text-destructive">
              <div className="flex items-center gap-1 font-medium mb-0.5">
                <AlertTriangle className="h-3 w-3" />
                Execution Error
              </div>
              {selectedExecution.error}
            </div>
          )}

          {/* Blocked Node Warning */}
          {selectedExecution.currentNodeId && (selectedExecution.status === 'failed' || selectedExecution.status === 'waiting_approval') && (
            <div className="mt-2 p-2 rounded-md bg-warning/10 border border-warning/20 text-[11px] text-warning">
              <div className="flex items-center gap-1 font-medium mb-0.5">
                <AlertOctagon className="h-3 w-3" />
                Blocked at: {selectedExecution.currentNodeId}
              </div>
              <button
                className="text-primary underline text-[10px] mt-0.5"
                onClick={() => onHighlightNode?.(selectedExecution.currentNodeId!)}
              >
                → Focus on blocked node
              </button>
            </div>
          )}
        </div>
      )}

      {/* Node Pipeline Timeline */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-0">
          {pipeline.map((entry, idx) => (
            <div key={entry.nodeId}>
              {/* Node Entry */}
              <div
                className={cn(
                  "rounded-md border p-2 cursor-pointer transition-all hover:shadow-sm",
                  getStatusColor(entry.status)
                )}
                onClick={() => onHighlightNode?.(entry.nodeId)}
                onMouseEnter={() => onHighlightNode?.(entry.nodeId)}
                onMouseLeave={() => onHighlightNode?.(null)}
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(entry.status)}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{entry.nodeLabel}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{entry.nodeType}</div>
                  </div>
                  {entry.duration != null && (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {entry.duration}ms
                    </span>
                  )}
                </div>

                {/* Error detail */}
                {entry.error && (
                  <div className="mt-1.5 p-1.5 rounded bg-destructive/10 text-[10px] text-destructive">
                    {entry.error}
                  </div>
                )}

                {/* Log detail (expandable) */}
                {entry.log && (
                  <Collapsible 
                    open={expandedLogs.has(entry.log.id)} 
                    onOpenChange={(open) => {
                      setExpandedLogs(prev => {
                        const next = new Set(prev);
                        if (open) next.add(entry.log!.id);
                        else next.delete(entry.log!.id);
                        return next;
                      });
                    }}
                  >
                    <CollapsibleTrigger className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-foreground">
                      {expandedLogs.has(entry.log.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      Log details
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-1 p-1.5 rounded bg-muted/50 text-[10px] space-y-1 font-mono">
                        <div><span className="text-muted-foreground">Status:</span> {entry.log.status}</div>
                        <div><span className="text-muted-foreground">Time:</span> {entry.timestamp ? format(new Date(entry.timestamp), 'HH:mm:ss.SSS') : '-'}</div>
                        {entry.log.input && (
                          <div>
                            <span className="text-muted-foreground">Input:</span>
                            <pre className="mt-0.5 text-[9px] whitespace-pre-wrap overflow-hidden max-h-20">
                              {typeof entry.log.input === 'string' ? entry.log.input : JSON.stringify(entry.log.input, null, 2)}
                            </pre>
                          </div>
                        )}
                        {entry.log.output && (
                          <div>
                            <span className="text-muted-foreground">Output:</span>
                            <pre className="mt-0.5 text-[9px] whitespace-pre-wrap overflow-hidden max-h-20">
                              {typeof entry.log.output === 'string' ? entry.log.output : JSON.stringify(entry.log.output, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>

              {/* Connector arrow between nodes */}
              {idx < pipeline.length - 1 && (
                <div className="flex items-center justify-center h-4">
                  <div className={cn(
                    "w-px h-full",
                    entry.status === 'completed' ? "bg-success/30" : "bg-border"
                  )} />
                </div>
              )}
            </div>
          ))}
        </div>

        {pipeline.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bug className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-xs">No workflow nodes to debug</p>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {lastUpdated && (
        <div className="p-2 border-t border-border text-[10px] text-muted-foreground text-center">
          Last updated: {format(lastUpdated, 'HH:mm:ss')}
        </div>
      )}
    </div>
  );
}
