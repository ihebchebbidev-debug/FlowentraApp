// Workflow API Service
import { apiFetch } from './apiClient';

// Types
export interface WorkflowDefinition {
  id: number;
  name: string;
  description?: string;
  nodes: any; // JSON array or string — backend returns deserialized object
  edges: any; // JSON array or string — backend returns deserialized object
  isActive: boolean;
  version: number;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  modifiedBy?: string;
  isDeleted: boolean;
  triggers?: WorkflowTrigger[];
}

export interface WorkflowTrigger {
  id: number;
  workflowId: number;
  nodeId: string;
  entityType: string; // 'offer', 'sale', 'service_order', 'dispatch'
  fromStatus?: string;
  toStatus?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WorkflowExecution {
  id: number;
  workflowId: number;
  workflowName?: string;
  triggerEntityType: string;
  triggerEntityId: number;
  status: 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
  currentNodeId?: string;
  context: string; // JSON string
  error?: string;
  startedAt: string;
  completedAt?: string;
  triggeredBy?: string;
  logs?: WorkflowExecutionLog[];
}

export interface WorkflowExecutionLog {
  id: number;
  executionId: number;
  nodeId: string;
  nodeType: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  input?: string;
  output?: string;
  error?: string;
  duration?: number;
  timestamp: string;
}

export interface WorkflowApproval {
  id: number;
  executionId: number;
  nodeId: string;
  title: string;
  message?: string;
  approverRole: string;
  approvedById?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  responseNote?: string;
  timeoutHours: number;
  createdAt: string;
  respondedAt?: string;
  expiresAt?: string;
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  nodes: any; // JSON array (not string) — backend DTO expects `object`
  edges: any; // JSON array (not string) — backend DTO expects `object`
  isActive?: boolean;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  nodes?: any; // JSON array (not string) — backend DTO expects `object`
  edges?: any; // JSON array (not string) — backend DTO expects `object`
  isActive?: boolean;
}

export interface RegisterTriggerDto {
  workflowId: number;
  nodeId: string;
  entityType: string;
  fromStatus?: string;
  toStatus?: string;
}

export interface ApprovalResponseDto {
  approved: boolean;
  responseNote?: string;
}

// Workflow Definitions API
export const workflowApi = {
  // Get all workflows
  getAll: async (): Promise<WorkflowDefinition[]> => {
    const { data, error } = await apiFetch<WorkflowDefinition[]>('/api/workflows');
    if (error) throw new Error(error);
    return data || [];
  },

  // Get default workflow (always active, application-wide).
  // Cached in-memory for 60s + request-deduped so detail screens don't
  // hammer the endpoint with repeat 404s when no default is configured.
  getDefault: (() => {
    let cached: { value: WorkflowDefinition | null; ts: number } | null = null;
    let inflight: Promise<WorkflowDefinition | null> | null = null;
    const TTL_MS = 60_000;

    const invalidate = () => {
      cached = null;
      inflight = null;
    };

    const fn = async (): Promise<WorkflowDefinition | null> => {
      const now = Date.now();
      if (cached && now - cached.ts < TTL_MS) return cached.value;
      if (inflight) return inflight;

      inflight = (async () => {
        const { data, error, status } = await apiFetch<WorkflowDefinition>('/api/workflows/default', {
          headers: { 'X-Skip-Logging': 'true' },
        });

        if (status === 0) {
          inflight = null;
          throw new Error('Backend unreachable');
        }

        if (error) {
          console.warn('API returned error for default workflow:', error);
          cached = { value: null, ts: Date.now() };
          inflight = null;
          return null;
        }

        cached = { value: data ?? null, ts: Date.now() };
        inflight = null;
        return data ?? null;
      })();

      return inflight;
    };

    (fn as any).invalidate = invalidate;
    return fn as ((() => Promise<WorkflowDefinition | null>) & { invalidate: () => void });
  })(),

  // Get workflow by ID
  getById: async (id: number): Promise<WorkflowDefinition | null> => {
    const { data, error } = await apiFetch<WorkflowDefinition>(`/api/workflows/${id}`);
    if (error) throw new Error(error);
    return data;
  },

  // Create workflow
  create: async (dto: CreateWorkflowDto): Promise<WorkflowDefinition> => {
    const { data, error } = await apiFetch<WorkflowDefinition>('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (error) throw new Error(error);
    return data!;
  },

  // Update workflow
  update: async (id: number, dto: UpdateWorkflowDto): Promise<WorkflowDefinition> => {
    const { data, error } = await apiFetch<WorkflowDefinition>(`/api/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    if (error) throw new Error(error);
    return data!;
  },

  // Delete workflow
  delete: async (id: number): Promise<boolean> => {
    const { error } = await apiFetch<void>(`/api/workflows/${id}`, {
      method: 'DELETE',
    });
    return !error;
  },

  // Activate workflow
  activate: async (id: number): Promise<boolean> => {
    const { error } = await apiFetch<void>(`/api/workflows/${id}/activate`, {
      method: 'POST',
    });
    return !error;
  },

  // Deactivate workflow
  deactivate: async (id: number): Promise<boolean> => {
    const { error } = await apiFetch<void>(`/api/workflows/${id}/deactivate`, {
      method: 'POST',
    });
    return !error;
  },

  // Get workflow triggers
  getTriggers: async (workflowId: number): Promise<WorkflowTrigger[]> => {
    const { data, error } = await apiFetch<WorkflowTrigger[]>(`/api/workflows/${workflowId}/triggers`);
    if (error) throw new Error(error);
    return data || [];
  },

  // Register trigger (note: backend expects /api/workflows/{workflowId}/triggers)
  registerTrigger: async (dto: RegisterTriggerDto): Promise<WorkflowTrigger> => {
    const { data, error } = await apiFetch<WorkflowTrigger>(`/api/workflows/${dto.workflowId}/triggers`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (error) throw new Error(error);
    return data!;
  },

  // Remove trigger (note: backend expects /api/workflows/{workflowId}/triggers/{triggerId})
  removeTrigger: async (workflowId: number, triggerId: number): Promise<boolean> => {
    const { error } = await apiFetch<void>(`/api/workflows/${workflowId}/triggers/${triggerId}`, {
      method: 'DELETE',
    });
    return !error;
  },

  // ─── Version Management ─────────────────────────────────────────────
  // Create a draft copy of the current workflow for editing
  createDraft: async (id: number): Promise<WorkflowDefinition> => {
    const { data, error } = await apiFetch<WorkflowDefinition>(`/api/workflows/${id}/create-draft`, {
      method: 'POST',
    });
    if (error) throw new Error(error);
    return data!;
  },

  // Promote a draft workflow to active (replaces current active version)
  promote: async (id: number): Promise<WorkflowDefinition> => {
    const { data, error } = await apiFetch<WorkflowDefinition>(`/api/workflows/${id}/promote`, {
      method: 'POST',
    });
    if (error) throw new Error(error);
    return data!;
  },

  // Archive a workflow version (soft-delete, keeps history)
  archive: async (id: number): Promise<boolean> => {
    const { data, error } = await apiFetch<{ message: string }>(`/api/workflows/${id}/archive`, {
      method: 'POST',
    });
    return !error;
  },
};

// Workflow Executions API
export const workflowExecutionsApi = {
  // Get executions for a workflow (with cache-busting timestamp for fresh data)
  getByWorkflow: async (workflowId: number, page = 1, pageSize = 50): Promise<WorkflowExecution[]> => {
    const timestamp = Date.now();
    const { data, error } = await apiFetch<WorkflowExecution[]>(
      `/api/workflows/${workflowId}/executions?page=${page}&pageSize=${pageSize}&_t=${timestamp}`
    );
    if (error) throw new Error(error);
    return data || [];
  },

  // Get execution by ID
  getById: async (executionId: number): Promise<WorkflowExecution | null> => {
    const { data, error } = await apiFetch<WorkflowExecution>(`/api/workflow-executions/${executionId}`);
    if (error) throw new Error(error);
    return data;
  },

  // Cancel execution
  cancel: async (executionId: number): Promise<boolean> => {
    const { error } = await apiFetch<void>(`/api/workflow-executions/${executionId}/cancel`, {
      method: 'POST',
    });
    return !error;
  },

  // Retry execution
  retry: async (executionId: number): Promise<boolean> => {
    const { error } = await apiFetch<void>(`/api/workflow-executions/${executionId}/retry`, {
      method: 'POST',
    });
    return !error;
  },
  
  // Cleanup stuck executions
  cleanupStuck: async (olderThanMinutes: number = 5): Promise<{ count: number; message: string }> => {
    const { data, error } = await apiFetch<{ count: number; message: string }>(
      `/api/workflow-executions/cleanup-stuck?olderThanMinutes=${olderThanMinutes}`,
      { method: 'POST' }
    );
    if (error) throw new Error(error);
    return data!;
  },
  
  // Manually trigger execution.
  // Best-effort / fire-and-forget: callers (dispatch, service orders, etc.) wrap this
  // in try/catch and the backend also auto-triggers on status changes. Suppress the
  // global error toast so "Workflow N not found" (e.g. no default workflow configured)
  // never surfaces to the user.
  triggerManual: async (workflowId: number | null | undefined, entityType: string, entityId: number): Promise<WorkflowExecution | null> => {
    // No workflow configured for this entity is a valid, non-error state — resolve
    // silently so callers never surface it as a failure to the user.
    if (!workflowId) {
      console.debug('[workflow] triggerManual skipped: no workflow configured for', entityType, entityId);
      return null;
    }
    const { data, error } = await apiFetch<WorkflowExecution>(`/api/workflow-executions/trigger-manual`, {
      method: 'POST',
      body: JSON.stringify({ workflowId, entityType, entityId }),
      headers: { 'X-Suppress-Error-Toast': 'true' },
    });
    if (error) {
      // Treat "workflow not found / not configured" as a successful no-op.
      if (/not found|no workflow|not configured/i.test(error)) {
        console.debug('[workflow] triggerManual no-op:', error);
        return null;
      }
      throw new Error(error);
    }
    return data!;
  },
};

// Workflow Approvals API
export const workflowApprovalsApi = {
  // Get pending approvals for user
  getPending: async (userId?: string, role?: string): Promise<WorkflowApproval[]> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    
    const { data, error } = await apiFetch<WorkflowApproval[]>(`/api/workflow-approvals?${params.toString()}`);
    if (error) throw new Error(error);
    return data || [];
  },

  // Get approval by ID
  getById: async (approvalId: number): Promise<WorkflowApproval | null> => {
    const { data, error } = await apiFetch<WorkflowApproval>(`/api/workflow-approvals/${approvalId}`);
    if (error) throw new Error(error);
    return data;
  },

  // Respond to approval
  respond: async (approvalId: number, response: ApprovalResponseDto): Promise<boolean> => {
    const { error } = await apiFetch<void>(`/api/workflow-approvals/${approvalId}/respond`, {
      method: 'POST',
      body: JSON.stringify(response),
    });
    return !error;
  },
};

// Workflow Reconciliation API
export interface ReconciliationResult {
  offersFixed: number;
  salesFixed: number;
  serviceOrdersFixed: number;
  dispatchesFixed: number;
  consistencyFixes: number;
  totalFixed: number;
  message: string;
}

export interface ReconciliationStatus {
  enabled: boolean;
  intervalMinutes: number;
  description: string;
}

export const workflowReconciliationApi = {
  // Manually trigger reconciliation
  run: async (): Promise<ReconciliationResult> => {
    const { data, error } = await apiFetch<ReconciliationResult>('/api/workflow-reconciliation/run', {
      method: 'POST',
    });
    if (error) throw new Error(error);
    return data!;
  },

  // Get reconciliation status
  getStatus: async (): Promise<ReconciliationStatus> => {
    const { data, error } = await apiFetch<ReconciliationStatus>('/api/workflow-reconciliation/status');
    if (error) throw new Error(error);
    return data!;
  },
};
