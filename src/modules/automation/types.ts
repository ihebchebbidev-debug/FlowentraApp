// Database Tables/Entities for Automation Module
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  isActive: boolean;
  conditions?: WorkflowCondition[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
}

export interface WorkflowTrigger {
  id: string;
  type: 'schedule' | 'webhook' | 'event' | 'manual';
  config: Record<string, any>;
}

export interface WorkflowAction {
  id: string;
  type: 'email' | 'notification' | 'api_call' | 'data_update' | 'task_create';
  config: Record<string, any>;
  order: number;
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  context: Record<string, any>;
  logs: WorkflowLog[];
}

export interface WorkflowLog {
  id: string;
  executionId: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  data?: Record<string, any>;
}
