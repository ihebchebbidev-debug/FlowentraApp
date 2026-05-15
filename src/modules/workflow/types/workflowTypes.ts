// Backend-compatible workflow type definitions
export interface WorkflowNodeData {
  label: string;
  type: string;
  description?: string;
  config?: NodeConfiguration;
  // Icon is handled separately for serialization
}

export interface NodeConfiguration {
  // Common configuration properties
  name?: string;
  enabled?: boolean;
  
  // Business Process Node configs
  contactData?: {
    name: string;
    email: string;
    phone?: string;
    source?: string;
  };
  
  offerData?: {
    templateId?: string;
    products?: string[];
    discount?: number;
    validUntil?: Date;
  };
  
  saleData?: {
    amount?: number;
    currency?: string;
    paymentMethod?: string;
  };
  
  serviceData?: {
    serviceType: string;
    scheduledDate?: Date;
    technician?: string;
    priority?: 'low' | 'medium' | 'high';
  };
  
  dispatchData?: {
    assignedTo?: string;
    location?: string;
    estimatedDuration?: number;
  };
  
  // Communication Node configs
  emailData?: {
    to?: string;
    subject?: string;
    template?: string;
    attachments?: string[];
  };
  
  // AI/LLM Node configs
  llmData?: {
    model?: string;
    prompt?: string;
    maxTokens?: number;
    temperature?: number;
  };
  
  // Conditional Node configs
  conditionData?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'all_match' | 'any_match' | 'none_match';
    value: any;
    caseSensitive?: boolean;
  };
  
  switchData?: {
    field: string;
    cases: Array<{
      value: any;
      label: string;
    }>;
    defaultCase?: boolean;
  };
  
  loopData?: {
    type: 'for' | 'while' | 'forEach';
    iterations?: number;
    condition?: NodeConfiguration['conditionData'];
    breakCondition?: NodeConfiguration['conditionData'];
  };
  
  parallelData?: {
    maxConcurrency?: number;
    waitForAll?: boolean;
  };
  
  errorHandlingData?: {
    retryCount?: number;
    retryDelay?: number;
    onErrorAction?: 'stop' | 'continue' | 'retry';
    logErrors?: boolean;
  };
  
  // Database Node configs
  databaseData?: {
    operation: 'create' | 'read' | 'update' | 'delete';
    table: string;
    conditions?: Record<string, any>;
    data?: Record<string, any>;
  };
  
  // API Node configs
  apiData?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    headers?: Record<string, string>;
    body?: any;
    authentication?: {
      type: 'none' | 'bearer' | 'basic' | 'api_key';
      token?: string;
      username?: string;
      password?: string;
      apiKey?: string;
    };
  };
  
  // Webhook/Trigger configs
  webhookData?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    authentication?: NodeConfiguration['apiData']['authentication'];
  };
  
  scheduledData?: {
    cronExpression?: string;
    timezone?: string;
    startDate?: Date;
    endDate?: Date;
  };
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  currentNodeId?: string;
  variables: Record<string, any>;
  errors?: Array<{
    nodeId: string;
    message: string;
    timestamp: Date;
  }>;
  logs?: Array<{
    nodeId: string;
    message: string;
    level: 'info' | 'warn' | 'error';
    timestamp: Date;
  }>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  nodes: any[]; // Will be Node[] from ReactFlow
  edges: any[]; // Will be Edge[] from ReactFlow
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'object';
    required: boolean;
    defaultValue?: any;
    description?: string;
  }>;
  createdBy: string;
  isPublic: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

// Data flow between nodes
export interface NodeDataFlow {
  sourceNodeId: string;
  targetNodeId: string;
  data: Record<string, any>;
  timestamp: Date;
}

// Webhook/External trigger data
export interface TriggerData {
  triggerType: 'webhook' | 'scheduled' | 'manual' | 'database_change';
  payload?: any;
  headers?: Record<string, string>;
  timestamp: Date;
}