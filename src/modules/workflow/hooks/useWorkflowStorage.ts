import { useState, useEffect, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';

export interface SavedWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'lovable-workflows';

export function useWorkflowStorage() {
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<SavedWorkflow | null>(null);

  // Load workflows from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const workflows = parsed.map((w: any) => ({
          ...w,
          createdAt: new Date(w.createdAt),
          updatedAt: new Date(w.updatedAt)
        }));
        setWorkflows(workflows);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  }, []);

  // Save workflows to localStorage whenever they change
  const saveToStorage = useCallback((workflows: SavedWorkflow[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    } catch (error) {
      console.error('Failed to save workflows:', error);
    }
  }, []);

  const saveWorkflow = useCallback((name: string, description: string, nodes: Node[], edges: Edge[]) => {
    const now = new Date();
    
    if (currentWorkflow) {
      // Update existing workflow
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
      saveToStorage(updatedWorkflows);
      
      return updated;
    } else {
      // Create new workflow
      const newWorkflow: SavedWorkflow = {
        id: `workflow-${Date.now()}`,
        name,
        description,
        nodes,
        edges,
        createdAt: now,
        updatedAt: now
      };
      
      const updatedWorkflows = [...workflows, newWorkflow];
      setWorkflows(updatedWorkflows);
      setCurrentWorkflow(newWorkflow);
      saveToStorage(updatedWorkflows);
      
      return newWorkflow;
    }
  }, [workflows, currentWorkflow, saveToStorage]);

  const loadWorkflow = useCallback((workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      setCurrentWorkflow(workflow);
      return workflow;
    }
    return null;
  }, [workflows]);

  const deleteWorkflow = useCallback((workflowId: string) => {
    const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
    setWorkflows(updatedWorkflows);
    saveToStorage(updatedWorkflows);
    
    if (currentWorkflow?.id === workflowId) {
      setCurrentWorkflow(null);
    }
  }, [workflows, currentWorkflow, saveToStorage]);

  const createNewWorkflow = useCallback(() => {
    setCurrentWorkflow(null);
  }, []);

  const duplicateWorkflow = useCallback((workflowId: string) => {
    const original = workflows.find(w => w.id === workflowId);
    if (original) {
      const now = new Date();
      const duplicate: SavedWorkflow = {
        ...original,
        id: `workflow-${Date.now()}`,
        name: `${original.name} (Copy)`,
        createdAt: now,
        updatedAt: now
      };
      
      const updatedWorkflows = [...workflows, duplicate];
      setWorkflows(updatedWorkflows);
      saveToStorage(updatedWorkflows);
      
      return duplicate;
    }
    return null;
  }, [workflows, saveToStorage]);

  return {
    workflows,
    currentWorkflow,
    saveWorkflow,
    loadWorkflow,
    deleteWorkflow,
    createNewWorkflow,
    duplicateWorkflow
  };
}