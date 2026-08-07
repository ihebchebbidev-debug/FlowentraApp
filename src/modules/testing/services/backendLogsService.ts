import api from '@/services/api/axiosInstance';

export interface BackendLogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  exception?: string;
}

export interface BackendLogsResponse {
  count: number;
  totalInStore: number;
  logs: BackendLogEntry[];
}

export const backendLogsService = {
  async getLogs(count: number = 100, level?: string): Promise<BackendLogsResponse> {
    const params = new URLSearchParams();
    params.append('count', count.toString());
    if (level) params.append('level', level);
    
    const response = await api.get<BackendLogsResponse>(
      `/api/logs?${params.toString()}`
    );
    return response.data;
  },

  async clearLogs(): Promise<void> {
    await api.delete(`/api/logs`);
  },

  async testLog(message: string, level: string = 'Information'): Promise<void> {
    await api.post(`/api/logs/test?message=${encodeURIComponent(message)}&level=${level}`);
  }
};
