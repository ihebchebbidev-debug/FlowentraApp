// System Logs API Service - Backend Integration
import { apiFetch, API_URL } from './apiClient';

export type LogLevel = 'info' | 'warning' | 'error' | 'success';
export type LogAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'other';

export interface SystemLog {
  id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
  module: string;
  action: LogAction;
  userId?: string;
  userName?: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface LogsListResponse {
  logs: SystemLog[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface LogSearchParams {
  searchTerm?: string;
  level?: LogLevel | 'all';
  module?: string;
  action?: LogAction;
  userId?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateLogRequest {
  level: LogLevel;
  message: string;
  module: string;
  action: LogAction;
  userId?: string;
  userName?: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface LogStatistics {
  totalLogs: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  successCount: number;
  last24Hours: number;
  last7Days: number;
}

export const logsApi = {
  // Get all logs with filtering and pagination
  async getAll(params?: LogSearchParams): Promise<LogsListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params?.level && params.level !== 'all') queryParams.append('level', params.level);
    if (params?.module && params.module !== 'all') queryParams.append('module', params.module);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.pageNumber) queryParams.append('pageNumber', String(params.pageNumber));
    if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));

    const { data, error } = await apiFetch<LogsListResponse>(`/api/SystemLogs?${queryParams}`);
    
    if (error || !data) {
      throw new Error(error || 'Failed to fetch logs');
    }

    return data;
  },

  // Get log by ID
  async getById(id: number): Promise<SystemLog> {
    const { data, error } = await apiFetch<SystemLog>(`/api/SystemLogs/${id}`);
    
    if (error || !data) {
      throw new Error(error || `Failed to fetch log ${id}`);
    }

    return data;
  },

  // Create new log entry
  async create(request: CreateLogRequest): Promise<SystemLog> {
    const { data, error } = await apiFetch<SystemLog>('/api/SystemLogs', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (error || !data) {
      throw new Error(error || 'Failed to create log');
    }

    return data;
  },

  // Delete old logs (admin only)
  async deleteOld(daysOld: number = 7): Promise<{ deletedCount: number }> {
    const { data, error } = await apiFetch<{ deletedCount: number }>(`/api/SystemLogs/cleanup?daysOld=${daysOld}`, {
      method: 'DELETE',
    });

    if (error || !data) {
      throw new Error(error || 'Failed to delete old logs');
    }

    return data;
  },

  // Get log statistics
  async getStatistics(): Promise<LogStatistics> {
    const { data, error } = await apiFetch<LogStatistics>('/api/SystemLogs/statistics');
    
    if (error || !data) {
      throw new Error(error || 'Failed to fetch log statistics');
    }

    return data;
  },

  // Get available modules (for filter dropdown)
  async getModules(): Promise<string[]> {
    const { data, error } = await apiFetch<string[]>('/api/SystemLogs/modules');
    
    if (error || !data) {
      throw new Error(error || 'Failed to fetch modules');
    }

    return data;
  },

  // Export logs
  async export(params?: LogSearchParams): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (params?.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params?.level && params.level !== 'all') queryParams.append('level', params.level);
    if (params?.module && params.module !== 'all') queryParams.append('module', params.module);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await fetch(`${API_URL}/api/SystemLogs/export?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export logs');
    }

    return response.blob();
  },
};
