import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Copy, Check, RefreshCw,
  AlertCircle, CheckCircle, XCircle, Loader2,
  ChevronDown, ChevronRight, Play, Trash2,
  RotateCcw, Zap, Clock, Database, Hash
} from "lucide-react";
import { toast } from "sonner";
import { workflowApi, workflowExecutionsApi } from '@/services/api/workflowApi';
import { cn } from '@/lib/utils';

interface ExecutionStep {
  nodeId: string;
  nodeType: string;
  nodeLabel?: string;
  status: 'completed' | 'failed' | 'running' | 'skipped';
  input?: any;
  output?: any;
  error?: string;
  duration?: number;
  branch?: string;
  timestamp?: Date;
}

interface ExecutionSummary {
  id: number;
  status: string;
  entityType: string;
  entityId: number;
  currentNodeId?: string;
  triggerContext: any;
  steps: ExecutionStep[];
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  triggeredBy?: string;
}

interface WorkflowDebugConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: number | null;
  lastExecutionId: number | null;
}

export function WorkflowDebugConsole({ 
  isOpen, 
  onClose, 
  workflowId,
  lastExecutionId 
}: WorkflowDebugConsoleProps) {
  const { t } = useTranslation();
  const [executions, setExecutions] = useState<ExecutionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [expandedExecutions, setExpandedExecutions] = useState<Set<number>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Fetch execution logs from backend
  const fetchExecutions = useCallback(async () => {
    if (!workflowId) return;
    
    setIsLoading(true);
    
    try {
      const rawExecutions = await workflowExecutionsApi.getByWorkflow(workflowId, 1, 10);
      
      const mapped: ExecutionSummary[] = rawExecutions.map((exec: any) => {
        let triggerContext = {};
        try {
          triggerContext = typeof exec.context === 'string' 
            ? JSON.parse(exec.context) 
            : exec.context || {};
        } catch (e) {}
        
        const steps: ExecutionStep[] = (exec.logs || []).map((log: any) => {
          let branch: string | undefined;
          let output = log.output;
          
          try {
            const parsedOutput = typeof output === 'string' ? JSON.parse(output) : output;
            if (parsedOutput?.conditionResult !== undefined) {
              branch = parsedOutput.selectedBranch || (parsedOutput.conditionResult ? 'YES' : 'NO');
            }
            if (parsedOutput?.action) {
              branch = `${parsedOutput.action}${parsedOutput.entityId ? ` #${parsedOutput.entityId}` : ''}${parsedOutput.newStatus ? ` → ${parsedOutput.newStatus}` : ''}`;
            }
            output = parsedOutput;
          } catch (e) {}
          
          return {
            nodeId: log.nodeId,
            nodeType: log.nodeType,
            nodeLabel: log.nodeLabel,
            status: log.status,
            input: typeof log.input === 'string' ? JSON.parse(log.input) : log.input,
            output,
            error: log.error,
            duration: log.duration,
            branch,
            timestamp: log.timestamp ? new Date(log.timestamp) : undefined
          };
        });
        
        return {
          id: exec.id,
          status: exec.status,
          entityType: exec.triggerEntityType,
          entityId: exec.triggerEntityId,
          currentNodeId: exec.currentNodeId,
          triggerContext,
          steps,
          error: exec.error,
          startedAt: new Date(exec.startedAt),
          completedAt: exec.completedAt ? new Date(exec.completedAt) : undefined,
          duration: exec.duration,
          triggeredBy: exec.triggeredBy
        };
      });
      
      setExecutions(mapped);
      
      // Auto-expand first execution
      if (mapped.length > 0) {
        setExpandedExecutions(new Set([mapped[0].id]));
      }
      
    } catch (error: any) {
      toast.error(`Failed to fetch executions: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  // Cleanup stuck executions
  const handleCleanupStuck = useCallback(async () => {
    setIsCleaningUp(true);
    try {
      const result = await workflowExecutionsApi.cleanupStuck(5);
      toast.success(result.message);
      fetchExecutions();
    } catch (error: any) {
      toast.error(`Cleanup failed: ${error.message}`);
    } finally {
      setIsCleaningUp(false);
    }
  }, [fetchExecutions]);

  // Cancel a specific execution
  const handleCancelExecution = useCallback(async (executionId: number) => {
    try {
      await workflowExecutionsApi.cancel(executionId);
      toast.success(`Execution #${executionId} cancelled`);
      fetchExecutions();
    } catch (error: any) {
      toast.error(`Cancel failed: ${error.message}`);
    }
  }, [fetchExecutions]);

  // Retry a failed execution
  const handleRetryExecution = useCallback(async (executionId: number) => {
    try {
      await workflowExecutionsApi.retry(executionId);
      toast.success(`Execution #${executionId} restarted`);
      fetchExecutions();
    } catch (error: any) {
      toast.error(`Retry failed: ${error.message}`);
    }
  }, [fetchExecutions]);

  // Fetch on open
  useEffect(() => {
    if (isOpen && workflowId) {
      setExecutions([]);
      setExpandedExecutions(new Set());
      setExpandedSteps(new Set());
      fetchExecutions();
    }
  }, [isOpen, workflowId, fetchExecutions]);

  // Toggle execution expansion
  const toggleExecution = (id: number) => {
    setExpandedExecutions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle step expansion
  const toggleStep = (key: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Copy all to clipboard
  const handleCopyLogs = useCallback(async () => {
    const report = executions.map(exec => {
      const ctx = exec.triggerContext;
      return `
=== Execution #${exec.id} ===
Status: ${exec.status}
Entity: ${exec.entityType} #${exec.entityId}
Current Node: ${exec.currentNodeId || 'N/A'}
Trigger: ${ctx.oldStatus || 'NULL'} → ${ctx.newStatus}
Started: ${exec.startedAt.toISOString()}
${exec.completedAt ? `Completed: ${exec.completedAt.toISOString()}` : ''}
${exec.duration ? `Duration: ${exec.duration}ms` : ''}
${exec.triggeredBy ? `Triggered By: ${exec.triggeredBy}` : ''}
${exec.error ? `Error: ${exec.error}` : ''}

Steps:
${exec.steps.map((step, i) => 
  `${i + 1}. [${step.nodeType}] ${step.nodeLabel || step.nodeId}: ${step.status}${step.branch ? ` → ${step.branch}` : ''}${step.duration ? ` (${step.duration}ms)` : ''}${step.error ? `\n   ERROR: ${step.error}` : ''}
   Input: ${JSON.stringify(step.input, null, 2)}
   Output: ${JSON.stringify(step.output, null, 2)}`
).join('\n\n')}

Trigger Context:
${JSON.stringify(ctx, null, 2)}
`;
    }).join('\n\n' + '='.repeat(50) + '\n\n');

    try {
      await navigator.clipboard.writeText(`WORKFLOW DEBUG REPORT\nWorkflow ID: ${workflowId}\nGenerated: ${new Date().toISOString()}\n\n${report}`);
      setIsCopied(true);
      toast.success('Debug report copied');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  }, [executions, workflowId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'skipped': return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <Play className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-success/20 text-success border-success/30">Completed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'running': return <Badge className="bg-primary/20 text-primary border-primary/30">Running</Badge>;
      case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Count stuck executions
  const stuckCount = executions.filter(e => 
    e.status === 'running' && (Date.now() - e.startedAt.getTime() > 5 * 60 * 1000)
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Execution History
              {executions.length > 0 && (
                <Badge variant="outline">{executions.length} recent</Badge>
              )}
              {stuckCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {stuckCount} stuck
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {stuckCount > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleCleanupStuck} 
                  disabled={isCleaningUp}
                  className="gap-1.5"
                >
                  {isCleaningUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Cleanup Stuck
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchExecutions} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyLogs} className="gap-1.5">
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {isLoading && executions.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading executions...
              </div>
            ) : executions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No executions found for this workflow
              </div>
            ) : (
              executions.map((exec) => {
                const isExpanded = expandedExecutions.has(exec.id);
                const ctx = exec.triggerContext;
                const isStuck = exec.status === 'running' && 
                  (Date.now() - exec.startedAt.getTime() > 5 * 60 * 1000); // Running > 5 min
                const hasError = exec.status === 'failed' || exec.error || isStuck;
                const runningTime = exec.status === 'running' 
                  ? Math.round((Date.now() - exec.startedAt.getTime()) / 1000)
                  : null;
                
                return (
                  <div key={exec.id} className={cn(
                    "border rounded-lg overflow-hidden bg-card",
                    hasError && "border-destructive/50 ring-1 ring-destructive/20"
                  )}>
                    {/* Prominent Error Banner */}
                    {(exec.error || isStuck) && (
                      <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          {isStuck && !exec.error && (
                            <p className="text-xs font-medium text-destructive">
                              ⚠️ Execution stuck (running {runningTime}s) - Last node: {exec.currentNodeId || 'unknown'}
                            </p>
                          )}
                          {exec.error && (
                            <p className="text-xs text-destructive break-words font-mono">
                              <strong>Error:</strong> {exec.error}
                            </p>
                          )}
                        </div>
                        {/* Quick actions for stuck/failed */}
                        <div className="flex gap-1">
                          {exec.status === 'failed' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 px-2 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleRetryExecution(exec.id); }}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                          {(isStuck || exec.status === 'running') && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 px-2 text-xs text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleCancelExecution(exec.id); }}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Execution Header */}
                    <button
                      onClick={() => toggleExecution(exec.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      
                      {hasError ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        getStatusIcon(exec.status)
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm flex items-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            {exec.id}
                          </span>
                          <Badge variant="outline" className="h-5 text-[10px]">
                            {exec.entityType} #{exec.entityId}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {ctx.oldStatus || ctx.triggerSource || 'NULL'} → {ctx.newStatus || 'unknown'}
                          </span>
                          {isStuck && (
                            <Badge variant="destructive" className="h-5 text-[10px]">
                              STUCK {runningTime}s
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {exec.startedAt.toLocaleString()} 
                          {exec.duration && <span>· {exec.duration}ms</span>}
                          {exec.triggeredBy && <span>· by {exec.triggeredBy}</span>}
                          <span>· {exec.steps.length} steps</span>
                        </div>
                      </div>
                      
                      {getStatusBadge(exec.status)}
                    </button>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t bg-muted/20">
                        {/* Execution Metadata */}
                        <div className="px-3 py-2 border-b bg-muted/30 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Execution ID:</span>
                            <span className="ml-1 font-mono">{exec.id}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current Node:</span>
                            <span className="ml-1 font-mono">{exec.currentNodeId || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="ml-1">{exec.duration ? `${exec.duration}ms` : (runningTime ? `${runningTime}s (running)` : 'N/A')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Triggered:</span>
                            <span className="ml-1">{ctx.triggerSource || 'event'}</span>
                          </div>
                        </div>
                        
                        {/* Trigger Context */}
                        <div className="px-3 py-2 border-b">
                          <details className="text-xs" open={hasError === true}>
                            <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                              Trigger Context (click to expand)
                            </summary>
                            <pre className="mt-2 p-2 rounded bg-muted overflow-x-auto text-[11px] max-h-48 overflow-y-auto">
                              {JSON.stringify(ctx, null, 2)}
                            </pre>
                          </details>
                        </div>
                        
                        {/* Steps */}
                        <div className="divide-y">
                          {exec.steps.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                              No steps logged yet
                            </div>
                          ) : exec.steps.map((step, idx) => {
                            const stepKey = `${exec.id}-${idx}`;
                            const isStepExpanded = expandedSteps.has(stepKey);
                            const stepHasError = step.status === 'failed' || step.error;
                            
                            return (
                              <div key={stepKey} className={cn(
                                "px-3 py-2",
                                stepHasError && "bg-destructive/5"
                              )}>
                                <button
                                  onClick={() => toggleStep(stepKey)}
                                  className="w-full flex items-center gap-2 text-left hover:bg-muted/30 -mx-1 px-1 py-0.5 rounded transition-colors"
                                >
                                  {isStepExpanded ? (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  
                                  <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                                  
                                  {getStatusIcon(step.status)}
                                  
                                  <Badge variant="outline" className="h-5 text-[10px] font-mono">
                                    {step.nodeType}
                                  </Badge>
                                  
                                  <span className="text-sm flex-1 truncate">
                                    {step.nodeLabel || step.nodeId}
                                  </span>
                                  
                                  {step.branch && (
                                    <Badge className="h-5 text-[10px] bg-primary/20 text-primary border-primary/30">
                                      {step.branch}
                                    </Badge>
                                  )}
                                  
                                  {step.duration && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {step.duration}ms
                                    </span>
                                  )}
                                </button>
                                
                                {isStepExpanded && (
                                  <div className="mt-2 ml-5 space-y-2 text-xs">
                                    {step.error && (
                                      <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive font-mono">
                                        <strong>Error:</strong> {step.error}
                                      </div>
                                    )}
                                    
                                    {step.timestamp && (
                                      <div className="text-muted-foreground">
                                        Timestamp: {step.timestamp.toLocaleString()}
                                      </div>
                                    )}
                                    
                                    {step.input && (
                                      <div>
                                        <div className="font-medium text-muted-foreground mb-1">Input:</div>
                                        <pre className={cn(
                                          "p-2 rounded bg-muted overflow-x-auto text-[11px]",
                                          "max-h-48 overflow-y-auto"
                                        )}>
                                          {JSON.stringify(step.input, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                    
                                    {step.output && (
                                      <div>
                                        <div className="font-medium text-muted-foreground mb-1">Output:</div>
                                        <pre className={cn(
                                          "p-2 rounded bg-muted overflow-x-auto text-[11px]",
                                          "max-h-48 overflow-y-auto",
                                          step.status === 'failed' && "bg-destructive/10 border border-destructive/20"
                                        )}>
                                          {JSON.stringify(step.output, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
