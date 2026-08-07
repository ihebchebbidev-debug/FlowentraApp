/**
 * TypeScript types for SignalR workflow notifications.
 * These match the DTOs from the backend.
 */

export interface WorkflowExecutionStartedEvent {
  workflowId: number;
  executionId: number;
  entityType: string;
  entityId: number;
  startedAt: string;
  triggeredBy?: string;
}

export interface WorkflowNodeExecutingEvent {
  workflowId: number;
  executionId: number;
  nodeId: string;
  nodeType: string;
  timestamp: string;
}

export interface WorkflowNodeCompletedEvent {
  workflowId: number;
  executionId: number;
  nodeId: string;
  nodeType: string;
  success: boolean;
  error?: string;
  output?: string;
  timestamp: string;
}

export interface WorkflowExecutionCompletedEvent {
  workflowId: number;
  executionId: number;
  status: string;
  completedAt: string;
  nodesExecuted: number;
  nodesFailed: number;
}

export interface WorkflowExecutionErrorEvent {
  workflowId: number;
  executionId: number;
  nodeId: string;
  error: string;
  timestamp: string;
}

export type WorkflowSignalREvent =
  | { type: 'ExecutionStarted'; data: WorkflowExecutionStartedEvent }
  | { type: 'NodeExecuting'; data: WorkflowNodeExecutingEvent }
  | { type: 'NodeCompleted'; data: WorkflowNodeCompletedEvent }
  | { type: 'ExecutionCompleted'; data: WorkflowExecutionCompletedEvent }
  | { type: 'ExecutionError'; data: WorkflowExecutionErrorEvent };

export type SignalRConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting';
