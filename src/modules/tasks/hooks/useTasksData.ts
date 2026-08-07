import { useState, useEffect, useCallback } from 'react';
import { tasksApi, type TaskSearchRequestDto } from '@/services/api/tasksApi';
import type { Task, DailyTask } from '@/modules/tasks/types';

// Hook for project tasks
export const useProjectTasks = (projectId: number | string | undefined) => {
  const [data, setData] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setData([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const id = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
      if (isNaN(id)) {
        throw new Error('Invalid project ID');
      }
      const result = await tasksApi.getProjectTasks(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
      console.error('Failed to fetch project tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTasks,
  };
};

// Hook for a single task
export const useTask = (taskId: number | string | undefined) => {
  const [data, setData] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setData(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const id = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId;
      if (isNaN(id)) {
        throw new Error('Invalid task ID');
      }
      const result = await tasksApi.getProjectTaskById(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch task'));
      console.error('Failed to fetch task:', err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTask,
  };
};

// Hook for daily tasks
export const useDailyTasks = (userId: number | string | undefined) => {
  const [data, setData] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!userId) {
      setData([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      if (isNaN(id)) {
        throw new Error('Invalid user ID');
      }
      const result = await tasksApi.getUserDailyTasks(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch daily tasks'));
      console.error('Failed to fetch daily tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTasks,
  };
};

// Hook for tasks by assignee
export const useTasksByAssignee = (assigneeId: number | string | undefined, projectId?: number | string) => {
  const [data, setData] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!assigneeId) {
      setData([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const id = typeof assigneeId === 'string' ? parseInt(assigneeId, 10) : assigneeId;
      const pId = projectId ? (typeof projectId === 'string' ? parseInt(projectId, 10) : projectId) : undefined;
      
      if (isNaN(id)) {
        throw new Error('Invalid assignee ID');
      }
      
      const result = await tasksApi.getTasksByAssignee(id, pId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
      console.error('Failed to fetch tasks by assignee:', err);
    } finally {
      setIsLoading(false);
    }
  }, [assigneeId, projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTasks,
  };
};

// Hook for overdue tasks
export const useOverdueTasks = (projectId?: number | string, assigneeId?: number | string) => {
  const [data, setData] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const pId = projectId ? (typeof projectId === 'string' ? parseInt(projectId, 10) : projectId) : undefined;
      const aId = assigneeId ? (typeof assigneeId === 'string' ? parseInt(assigneeId, 10) : assigneeId) : undefined;
      
      const result = await tasksApi.getOverdueTasks(pId, aId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch overdue tasks'));
      console.error('Failed to fetch overdue tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, assigneeId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTasks,
  };
};

// Hook for task search
export const useTaskSearch = (params: TaskSearchRequestDto) => {
  const [data, setData] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const searchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await tasksApi.searchTasks(params);
      setData(result.tasks);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search tasks'));
      console.error('Failed to search tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    if (params.searchTerm || Object.keys(params).length > 0) {
      searchTasks();
    }
  }, [searchTasks]);

  return {
    data,
    isLoading,
    error,
    refetch: searchTasks,
    totalCount,
  };
};

// Hook for tasks by contact
export const useTasksByContact = (contactId: number | string | undefined) => {
  const [data, setData] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!contactId) {
      setData([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const id = typeof contactId === 'string' ? parseInt(contactId, 10) : contactId;
      if (isNaN(id)) {
        throw new Error('Invalid contact ID');
      }
      const result = await tasksApi.getTasksByContact(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
      console.error('Failed to fetch tasks by contact:', err);
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTasks,
  };
};
