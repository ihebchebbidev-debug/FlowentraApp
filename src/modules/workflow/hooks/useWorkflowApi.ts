import { useState, useEffect, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { 
  workflowApi, 
  workflowExecutionsApi, 
  workflowApprovalsApi,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowApproval,
  CreateWorkflowDto,
  UpdateWorkflowDto,
  RegisterTriggerDto 
} from '@/services/api/workflowApi';

export interface SavedWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  triggers?: Array<{
    id: number;
    entityType: string;
    fromStatus?: string;
    toStatus?: string;
    isActive: boolean;
  }>;
}

// Convert API response to SavedWorkflow format
const mapApiToSavedWorkflow = (api: WorkflowDefinition): SavedWorkflow => {
  let nodes: Node[] = [];
  let edges: Edge[] = [];
  
  try {
    // Backend returns nodes/edges as object (already parsed JSON) or as a string
    nodes = typeof api.nodes === 'string' ? JSON.parse(api.nodes || '[]') : (api.nodes as any) || [];
    edges = typeof api.edges === 'string' ? JSON.parse(api.edges || '[]') : (api.edges as any) || [];
  } catch (e) {
    console.error('Failed to parse workflow nodes/edges:', e);
  }
  
  return {
    id: String(api.id),
    name: api.name,
    description: api.description,
    nodes,
    edges,
    isActive: api.isActive,
    version: api.version,
    createdAt: new Date(api.createdAt),
    updatedAt: api.updatedAt ? new Date(api.updatedAt) : new Date(api.createdAt),
    triggers: api.triggers?.map(t => ({
      id: t.id,
      entityType: t.entityType,
      fromStatus: t.fromStatus,
      toStatus: t.toStatus,
      isActive: t.isActive
    }))
  };
};

export function useWorkflowApi() {
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<SavedWorkflow | null>(null);
  const [defaultWorkflow, setDefaultWorkflow] = useState<SavedWorkflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load default workflow from API
  const loadDefaultWorkflow = useCallback(async (): Promise<SavedWorkflow | null> => {
    try {
      const data = await workflowApi.getDefault();
      if (data) {
        const mapped = mapApiToSavedWorkflow(data);
        setDefaultWorkflow(mapped);
        return mapped;
      }
      return null;
    } catch (err: any) {
      console.warn('Failed to load default workflow:', err);
      return null;
    }
  }, []);

  // Load workflows from API
  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workflowApi.getAll();
      const mapped = data.map(mapApiToSavedWorkflow);
      setWorkflows(mapped);
      return mapped;
    } catch (err: any) {
      console.error('Failed to load workflows:', err);
      setError(err.message || 'Failed to load workflows');
      // Fallback to localStorage if API fails
      try {
        const stored = localStorage.getItem('lovable-workflows');
        if (stored) {
          const parsed = JSON.parse(stored);
          const workflows = parsed.map((w: any) => ({
            ...w,
            createdAt: new Date(w.createdAt),
            updatedAt: new Date(w.updatedAt),
            isActive: w.isActive ?? true,
            version: w.version ?? 1
          }));
          setWorkflows(workflows);
          return workflows;
        }
      } catch (localError) {
        console.error('Failed to load from localStorage:', localError);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load - load both workflows and default
  useEffect(() => {
    loadWorkflows();
    loadDefaultWorkflow();
  }, [loadWorkflows, loadDefaultWorkflow]);

  // Save workflow to API
  const saveWorkflow = useCallback(async (
    name: string, 
    description: string, 
    nodes: Node[], 
    edges: Edge[]
  ): Promise<SavedWorkflow | null> => {
    setLoading(true);
    try {
      // CRITICAL: Send nodes/edges as parsed objects, NOT strings.
      // The backend DTO uses `object Nodes` and calls JsonSerializer.Serialize(dto.Nodes).
      // If we send a string, it gets double-serialized as a JSON string literal.
      // We also strip non-serializable fields (icons are React components)
      const cleanNodes = nodes.map(n => ({
        ...n,
        data: { ...n.data, icon: undefined }
      }));
      const cleanEdges = edges;
      
      if (currentWorkflow && currentWorkflow.id && !isNaN(Number(currentWorkflow.id))) {
        // Update existing workflow
        const dto: UpdateWorkflowDto = {
          name,
          description,
          nodes: cleanNodes,
          edges: cleanEdges
        };
        
        const updated = await workflowApi.update(Number(currentWorkflow.id), dto);
        const mapped = mapApiToSavedWorkflow(updated);
        
        setWorkflows(prev => prev.map(w => w.id === mapped.id ? mapped : w));
        setCurrentWorkflow(mapped);
        
        // Also save to localStorage as backup
        saveToLocalStorage(workflows.map(w => w.id === mapped.id ? mapped : w));
        
        return mapped;
      } else {
        // Create new workflow
        const dto: CreateWorkflowDto = {
          name,
          description,
          nodes: cleanNodes,
          edges: cleanEdges,
          isActive: true
        };
        
        const created = await workflowApi.create(dto);
        const mapped = mapApiToSavedWorkflow(created);
        
        const updatedWorkflows = [...workflows, mapped];
        setWorkflows(updatedWorkflows);
        setCurrentWorkflow(mapped);
        
        // Also save to localStorage as backup
        saveToLocalStorage(updatedWorkflows);
        
        return mapped;
      }
    } catch (err: any) {
      console.error('Failed to save workflow to API:', err);
      // Fallback to localStorage
      return saveToLocalStorageOnly(name, description, nodes, edges);
    } finally {
      setLoading(false);
    }
  }, [currentWorkflow, workflows]);

  // Local storage helpers
  const saveToLocalStorage = (workflows: SavedWorkflow[]) => {
    try {
      localStorage.setItem('lovable-workflows', JSON.stringify(workflows));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  const saveToLocalStorageOnly = (
    name: string, 
    description: string, 
    nodes: Node[], 
    edges: Edge[]
  ): SavedWorkflow => {
    const now = new Date();
    
    if (currentWorkflow) {
      const updated = {
        ...currentWorkflow,
        name,
        description,
        nodes,
        edges,
        updatedAt: now
      };
      
      const updatedWorkflows = workflows.map(w => 
        w.id === currentWorkflow.id ? updated : w
      );
      
      setWorkflows(updatedWorkflows);
      setCurrentWorkflow(updated);
      saveToLocalStorage(updatedWorkflows);
      
      return updated;
    } else {
      const newWorkflow: SavedWorkflow = {
        id: `local-${Date.now()}`,
        name,
        description,
        nodes,
        edges,
        isActive: true,
        version: 1,
        createdAt: now,
        updatedAt: now
      };
      
      const updatedWorkflows = [...workflows, newWorkflow];
      setWorkflows(updatedWorkflows);
      setCurrentWorkflow(newWorkflow);
      saveToLocalStorage(updatedWorkflows);
      
      return newWorkflow;
    }
  };

  const loadWorkflow = useCallback((workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      setCurrentWorkflow(workflow);
      return workflow;
    }
    return null;
  }, [workflows]);

  const deleteWorkflow = useCallback(async (workflowId: string) => {
    try {
      if (!isNaN(Number(workflowId))) {
        await workflowApi.delete(Number(workflowId));
      }
      
      const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
      setWorkflows(updatedWorkflows);
      saveToLocalStorage(updatedWorkflows);
      
      if (currentWorkflow?.id === workflowId) {
        setCurrentWorkflow(null);
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      // Still remove from local state
      const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
      setWorkflows(updatedWorkflows);
      saveToLocalStorage(updatedWorkflows);
    }
  }, [workflows, currentWorkflow]);

  const createNewWorkflow = useCallback(() => {
    setCurrentWorkflow(null);
  }, []);

  const duplicateWorkflow = useCallback((workflowId: string) => {
    const original = workflows.find(w => w.id === workflowId);
    if (original) {
      const now = new Date();
      const duplicate: SavedWorkflow = {
        ...original,
        id: `local-${Date.now()}`,
        name: `${original.name} (Copy)`,
        isActive: true,
        version: 1,
        createdAt: now,
        updatedAt: now
      };
      
      const updatedWorkflows = [...workflows, duplicate];
      setWorkflows(updatedWorkflows);
      saveToLocalStorage(updatedWorkflows);
      
      return duplicate;
    }
    return null;
  }, [workflows]);

  const activateWorkflow = useCallback(async (workflowId: string) => {
    try {
      if (!isNaN(Number(workflowId))) {
        await workflowApi.activate(Number(workflowId));
      }
      
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId ? { ...w, isActive: true } : w
      ));
      
      if (currentWorkflow?.id === workflowId) {
        setCurrentWorkflow(prev => prev ? { ...prev, isActive: true } : null);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to activate workflow:', err);
      return false;
    }
  }, [currentWorkflow]);

  const deactivateWorkflow = useCallback(async (workflowId: string) => {
    try {
      if (!isNaN(Number(workflowId))) {
        await workflowApi.deactivate(Number(workflowId));
      }
      
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId ? { ...w, isActive: false } : w
      ));
      
      if (currentWorkflow?.id === workflowId) {
        setCurrentWorkflow(prev => prev ? { ...prev, isActive: false } : null);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to deactivate workflow:', err);
      return false;
    }
  }, [currentWorkflow]);

  // Trigger registration
  const registerTrigger = useCallback(async (dto: RegisterTriggerDto) => {
    try {
      const trigger = await workflowApi.registerTrigger(dto);
      
      // Update workflow triggers in state
      setWorkflows(prev => prev.map(w => {
        if (w.id === String(dto.workflowId)) {
          return {
            ...w,
            triggers: [...(w.triggers || []), {
              id: trigger.id,
              entityType: trigger.entityType,
              fromStatus: trigger.fromStatus,
              toStatus: trigger.toStatus,
              isActive: trigger.isActive
            }]
          };
        }
        return w;
      }));
      
      return trigger;
    } catch (err) {
      console.error('Failed to register trigger:', err);
      return null;
    }
  }, []);

  const removeTrigger = useCallback(async (triggerId: number, workflowId: string) => {
    try {
      await workflowApi.removeTrigger(parseInt(workflowId), triggerId);
      
      // Update workflow triggers in state
      setWorkflows(prev => prev.map(w => {
        if (w.id === workflowId) {
          return {
            ...w,
            triggers: (w.triggers || []).filter(t => t.id !== triggerId)
          };
        }
        return w;
      }));
      
      return true;
    } catch (err) {
      console.error('Failed to remove trigger:', err);
      return false;
    }
  }, []);

  return {
    workflows,
    currentWorkflow,
    defaultWorkflow,
    loading,
    error,
    loadWorkflows,
    loadDefaultWorkflow,
    saveWorkflow,
    loadWorkflow,
    deleteWorkflow,
    createNewWorkflow,
    duplicateWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    registerTrigger,
    removeTrigger
  };
}

// Hook for workflow executions
export function useWorkflowExecutions(workflowId?: number) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(false);

  const loadExecutions = useCallback(async () => {
    if (!workflowId) return;
    
    setLoading(true);
    try {
      const data = await workflowExecutionsApi.getByWorkflow(workflowId);
      setExecutions(data);
    } catch (err) {
      console.error('Failed to load executions:', err);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  const cancelExecution = useCallback(async (executionId: number): Promise<boolean> => {
    try {
      await workflowExecutionsApi.cancel(executionId);
      setExecutions(prev => prev.map(e => 
        e.id === executionId ? { ...e, status: 'cancelled' as const } : e
      ));
      return true;
    } catch (err) {
      console.error('Failed to cancel execution:', err);
      return false;
    }
  }, []);

  const retryExecution = useCallback(async (executionId: number): Promise<boolean> => {
    try {
      await workflowExecutionsApi.retry(executionId);
      loadExecutions();
      return true;
    } catch (err) {
      console.error('Failed to retry execution:', err);
      return false;
    }
  }, [loadExecutions]);

  return {
    executions,
    loading,
    loadExecutions,
    cancelExecution,
    retryExecution
  };
}

// Hook for workflow approvals
export function useWorkflowApprovals() {
  const [approvals, setApprovals] = useState<WorkflowApproval[]>([]);
  const [loading, setLoading] = useState(false);

  const loadApprovals = useCallback(async (userId?: string, role?: string) => {
    setLoading(true);
    try {
      const data = await workflowApprovalsApi.getPending(userId, role);
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  const respondToApproval = useCallback(async (
    approvalId: number, 
    approved: boolean, 
    responseNote?: string
  ): Promise<boolean> => {
    try {
      await workflowApprovalsApi.respond(approvalId, { approved, responseNote });
      setApprovals(prev => prev.filter(a => a.id !== approvalId));
      return true;
    } catch (err) {
      console.error('Failed to respond to approval:', err);
      return false;
    }
  }, []);

  return {
    approvals,
    loading,
    loadApprovals,
    respondToApproval
  };
}
