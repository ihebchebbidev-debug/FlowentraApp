import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';
import type {
  WorkflowExecutionStartedEvent,
  WorkflowNodeExecutingEvent,
  WorkflowNodeCompletedEvent,
  WorkflowExecutionCompletedEvent,
  WorkflowExecutionErrorEvent,
  SignalRConnectionState,
} from '../types/signalr.types';

import { API_URL } from '@/config/api';

// Get auth token for SignalR connection
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

interface UseWorkflowSignalROptions {
  /** Specific workflow ID to subscribe to, or null for all workflows */
  workflowId?: number | null;
  /** Whether to automatically connect on mount */
  autoConnect?: boolean;
  /** Callback when execution starts */
  onExecutionStarted?: (event: WorkflowExecutionStartedEvent) => void;
  /** Callback when a node starts executing */
  onNodeExecuting?: (event: WorkflowNodeExecutingEvent) => void;
  /** Callback when a node completes */
  onNodeCompleted?: (event: WorkflowNodeCompletedEvent) => void;
  /** Callback when execution completes */
  onExecutionCompleted?: (event: WorkflowExecutionCompletedEvent) => void;
  /** Callback when an error occurs */
  onExecutionError?: (event: WorkflowExecutionErrorEvent) => void;
}

interface UseWorkflowSignalRReturn {
  /** Current connection state */
  connectionState: SignalRConnectionState;
  /** Whether connected */
  isConnected: boolean;
  /** Connect to the hub */
  connect: () => Promise<void>;
  /** Disconnect from the hub */
  disconnect: () => Promise<void>;
  /** Join a specific workflow's notification group */
  joinWorkflow: (workflowId: number) => Promise<void>;
  /** Leave a specific workflow's notification group */
  leaveWorkflow: (workflowId: number) => Promise<void>;
  /** Join all-workflows group */
  joinAllWorkflows: () => Promise<void>;
  /** Leave all-workflows group */
  leaveAllWorkflows: () => Promise<void>;
  /** Last error message */
  error: string | null;
}

export function useWorkflowSignalR(options: UseWorkflowSignalROptions = {}): UseWorkflowSignalRReturn {
  const {
    workflowId,
    autoConnect = true,
    onExecutionStarted,
    onNodeExecuting,
    onNodeCompleted,
    onExecutionCompleted,
    onExecutionError,
  } = options;

  const [connectionState, setConnectionState] = useState<SignalRConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const mountedRef = useRef(true);

  // Store callbacks in refs to avoid re-creating connection on callback changes
  const callbacksRef = useRef({
    onExecutionStarted,
    onNodeExecuting,
    onNodeCompleted,
    onExecutionCompleted,
    onExecutionError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onExecutionStarted,
      onNodeExecuting,
      onNodeCompleted,
      onExecutionCompleted,
      onExecutionError,
    };
  }, [onExecutionStarted, onNodeExecuting, onNodeCompleted, onExecutionCompleted, onExecutionError]);

  const connect = useCallback(async () => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      setConnectionState('connecting');
      setError(null);

      const token = getAuthToken();
      
      // Try connecting to the SignalR hub
      // The hub path should match your backend configuration (e.g., /hubs/workflow or /workflowHub)
      const hubUrl = `${API_URL}/hubs/workflow`;
      console.log('[SignalR] Attempting to connect to:', hubUrl);

      const tenant = getCurrentTenant();
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          withCredentials: false,
          accessTokenFactory: token ? () => token : undefined,
          headers: tenant ? { [TENANT_HEADER]: tenant } : undefined,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      connection.on('ExecutionStarted', (data: WorkflowExecutionStartedEvent) => {
        console.log('[SignalR] ExecutionStarted:', data);
        callbacksRef.current.onExecutionStarted?.(data);
      });

      connection.on('NodeExecuting', (data: WorkflowNodeExecutingEvent) => {
        console.log('[SignalR] NodeExecuting:', data);
        callbacksRef.current.onNodeExecuting?.(data);
      });

      connection.on('NodeCompleted', (data: WorkflowNodeCompletedEvent) => {
        console.log('[SignalR] NodeCompleted:', data);
        callbacksRef.current.onNodeCompleted?.(data);
      });

      connection.on('ExecutionCompleted', (data: WorkflowExecutionCompletedEvent) => {
        console.log('[SignalR] ExecutionCompleted:', data);
        callbacksRef.current.onExecutionCompleted?.(data);
      });

      connection.on('ExecutionError', (data: WorkflowExecutionErrorEvent) => {
        console.log('[SignalR] ExecutionError:', data);
        callbacksRef.current.onExecutionError?.(data);
      });

      // Connection state handlers
      connection.onreconnecting(() => {
        if (mountedRef.current) {
          setConnectionState('reconnecting');
          console.log('[SignalR] Reconnecting...');
        }
      });

      connection.onreconnected(() => {
        if (mountedRef.current) {
          setConnectionState('connected');
          console.log('[SignalR] Reconnected');
        }
      });

      connection.onclose((err) => {
        if (mountedRef.current) {
          setConnectionState('disconnected');
          if (err) {
            setError(err.message);
            console.error('[SignalR] Connection closed with error:', err);
          } else {
            console.log('[SignalR] Connection closed');
          }
        }
      });

      await connection.start();
      connectionRef.current = connection;

      if (mountedRef.current) {
        setConnectionState('connected');
        console.log('[SignalR] Connected to workflow hub');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      console.error('[SignalR] Failed to connect:', errorMessage, err);
      
      // Check if the hub endpoint exists by testing health
      try {
        const healthCheck = await fetch(`${API_URL}/api/health`, { 
          method: 'GET',
          mode: 'cors' 
        });
        if (healthCheck.ok) {
          console.log('[SignalR] Backend is healthy but SignalR hub may not be configured at /hubs/workflow');
        }
      } catch (healthErr) {
        console.log('[SignalR] Backend health check also failed - backend may be sleeping or unavailable');
      }
      
      if (mountedRef.current) {
        setConnectionState('disconnected');
        setError(errorMessage);
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
        connectionRef.current = null;
        if (mountedRef.current) {
          setConnectionState('disconnected');
        }
      } catch (err) {
        console.error('[SignalR] Error disconnecting:', err);
      }
    }
  }, []);

  const joinWorkflow = useCallback(async (id: number) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('JoinWorkflowGroup', id);
        console.log(`[SignalR] Joined workflow ${id}`);
      } catch (err) {
        console.error(`[SignalR] Failed to join workflow ${id}:`, err);
      }
    }
  }, []);

  const leaveWorkflow = useCallback(async (id: number) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('LeaveWorkflowGroup', id);
        console.log(`[SignalR] Left workflow ${id}`);
      } catch (err) {
        console.error(`[SignalR] Failed to leave workflow ${id}:`, err);
      }
    }
  }, []);

  const joinAllWorkflows = useCallback(async () => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('JoinAllWorkflows');
        console.log('[SignalR] Joined all-workflows group');
      } catch (err) {
        console.error('[SignalR] Failed to join all-workflows:', err);
      }
    }
  }, []);

  const leaveAllWorkflows = useCallback(async () => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('LeaveAllWorkflows');
        console.log('[SignalR] Left all-workflows group');
      } catch (err) {
        console.error('[SignalR] Failed to leave all-workflows:', err);
      }
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect) {
      connect().then(() => {
        // Join specific workflow or all workflows after connecting
        if (workflowId) {
          joinWorkflow(workflowId);
        } else {
          joinAllWorkflows();
        }
      });
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, workflowId, connect, disconnect, joinWorkflow, joinAllWorkflows]);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    connect,
    disconnect,
    joinWorkflow,
    leaveWorkflow,
    joinAllWorkflows,
    leaveAllWorkflows,
    error,
  };
}
