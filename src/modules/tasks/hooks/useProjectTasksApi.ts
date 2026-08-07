// Hook for fetching project tasks from API
import { useState, useEffect, useCallback } from 'react';
import { TasksService } from '../services/tasks.service';
import type { Task } from '../types';

interface UseProjectTasksApiResult {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProjectTasksApi(projectId: number | null): UseProjectTasksApiResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedTasks = await TasksService.getProjectTasks(projectId);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Failed to fetch project tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
  };
}
