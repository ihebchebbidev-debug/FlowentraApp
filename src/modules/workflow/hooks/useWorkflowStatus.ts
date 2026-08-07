import { useState, useEffect, useCallback } from 'react';
import { workflowApi, WorkflowDefinition } from '@/services/api/workflowApi';

export interface WorkflowStatus {
  isActive: boolean;
  workflowId?: number;
  workflowName?: string;
  loading: boolean;
  error?: string;
}

/**
 * Hook to check if workflow automation is active.
 * When active, manual status conversions (Offer→Sale, Sale→ServiceOrder) 
 * are handled automatically by the backend.
 */
export function useWorkflowStatus(): WorkflowStatus & { refresh: () => Promise<void> } {
  const [status, setStatus] = useState<WorkflowStatus>({
    isActive: false,
    loading: true,
  });

  const checkWorkflowStatus = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: undefined }));
      
      const defaultWorkflow = await workflowApi.getDefault();
      
      if (defaultWorkflow && defaultWorkflow.isActive) {
        setStatus({
          isActive: true,
          workflowId: defaultWorkflow.id,
          workflowName: defaultWorkflow.name,
          loading: false,
        });
      } else {
        setStatus({
          isActive: false,
          loading: false,
        });
      }
    } catch (err: any) {
      // Backend unreachable or error - assume workflow is not active
      console.warn('Failed to check workflow status:', err);
      setStatus({
        isActive: false,
        loading: false,
        error: err?.message || 'Failed to check workflow status',
      });
    }
  }, []);

  useEffect(() => {
    checkWorkflowStatus();
  }, [checkWorkflowStatus]);

  return {
    ...status,
    refresh: checkWorkflowStatus,
  };
}

/**
 * Returns whether a specific entity type has automation triggers configured.
 * e.g., check if 'offer' has 'accepted' → auto-create sale trigger
 */
export function useEntityWorkflowTriggers(entityType: 'offer' | 'sale' | 'service_order' | 'dispatch') {
  const [hasTriggers, setHasTriggers] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkTriggers() {
      try {
        setLoading(true);
        const defaultWorkflow = await workflowApi.getDefault();
        
        if (defaultWorkflow && defaultWorkflow.isActive && defaultWorkflow.triggers) {
          // Check if there are any triggers for this entity type
          const entityTriggers = defaultWorkflow.triggers.filter(
            t => t.entityType === entityType && t.isActive
          );
          setHasTriggers(entityTriggers.length > 0);
        } else {
          setHasTriggers(false);
        }
      } catch (err) {
        console.warn('Failed to check entity triggers:', err);
        setHasTriggers(false);
      } finally {
        setLoading(false);
      }
    }

    checkTriggers();
  }, [entityType]);

  return { hasTriggers, loading };
}
