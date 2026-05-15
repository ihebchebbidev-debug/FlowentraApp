import { useState, useEffect, useCallback } from 'react';
import { projectsApi, type ProjectSearchRequestDto } from '@/services/api/projectsApi';
import type { Project } from '@/modules/tasks/types';

interface UseProjectsDataOptions {
  params?: ProjectSearchRequestDto;
  enabled?: boolean;
}

interface UseProjectsDataResult {
  data: Project[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  totalCount: number;
}

export const useProjectsData = (options: UseProjectsDataOptions = {}): UseProjectsDataResult => {
  const { params, enabled = true } = options;
  const [data, setData] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProjects = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await projectsApi.getAll(params);
      setData(result.projects);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, JSON.stringify(params)]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchProjects,
    totalCount,
  };
};

// Hook to get a single project by ID
export const useProject = (projectId: number | string | undefined) => {
  const [data, setData] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setData(null);
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
      const result = await projectsApi.getById(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch project'));
      console.error('Failed to fetch project:', err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchProject,
  };
};

// Hook for projects by contact
export const useProjectsByContact = (contactId: number | string | undefined) => {
  const [data, setData] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
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
      const result = await projectsApi.getByContact(id);
      setData(result.projects);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
      console.error('Failed to fetch projects by contact:', err);
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchProjects,
  };
};
