import api from '@/services/api/axiosInstance';
import type {
  RecurringTask,
  RecurringTaskLog,
  CreateRecurringTaskDto,
  UpdateRecurringTaskDto,
} from '@/modules/tasks/types/recurring';

export const recurringTaskApi = {
  // CRUD
  async createRecurringTask(data: CreateRecurringTaskDto): Promise<RecurringTask> {
    const response = await api.post<RecurringTask>('/api/recurringtasks', data);
    return response.data;
  },

  async getRecurringTaskById(id: number): Promise<RecurringTask> {
    const response = await api.get<RecurringTask>(`/api/recurringtasks/${id}`);
    return response.data;
  },

  async updateRecurringTask(id: number, data: UpdateRecurringTaskDto): Promise<RecurringTask> {
    const response = await api.put<RecurringTask>(`/api/recurringtasks/${id}`, data);
    return response.data;
  },

  async deleteRecurringTask(id: number): Promise<void> {
    await api.delete(`/api/recurringtasks/${id}`);
  },

  // Query
  async getForProjectTask(projectTaskId: number): Promise<RecurringTask[]> {
    const response = await api.get<RecurringTask[]>(`/api/recurringtasks/project-task/${projectTaskId}`);
    return response.data;
  },

  async getForDailyTask(dailyTaskId: number): Promise<RecurringTask[]> {
    const response = await api.get<RecurringTask[]>(`/api/recurringtasks/daily-task/${dailyTaskId}`);
    return response.data;
  },

  async getAllActive(): Promise<RecurringTask[]> {
    const response = await api.get<RecurringTask[]>('/api/recurringtasks/active');
    return response.data;
  },

  async getLogs(recurringTaskId: number, limit = 50): Promise<RecurringTaskLog[]> {
    const response = await api.get<RecurringTaskLog[]>(`/api/recurringtasks/${recurringTaskId}/logs`, {
      params: { limit },
    });
    return response.data;
  },

  // Actions
  async pauseRecurringTask(id: number): Promise<RecurringTask> {
    const response = await api.post<RecurringTask>(`/api/recurringtasks/${id}/pause`);
    return response.data;
  },

  async resumeRecurringTask(id: number): Promise<RecurringTask> {
    const response = await api.post<RecurringTask>(`/api/recurringtasks/${id}/resume`);
    return response.data;
  },

  // Generation
  async generateDueTasks(upToDate?: string, dryRun = false): Promise<{
    totalProcessed: number;
    tasksGenerated: number;
    tasksSkipped: number;
    tasksFailed: number;
    messages: string[];
  }> {
    const response = await api.post('/api/recurringtasks/generate', { upToDate, dryRun });
    return response.data;
  },

  async getNextOccurrence(id: number): Promise<{ nextOccurrence: string | null }> {
    const response = await api.get<{ nextOccurrence: string | null }>(`/api/recurringtasks/${id}/next-occurrence`);
    return response.data;
  },
};
