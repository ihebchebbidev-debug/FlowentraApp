import api from '@/services/api/axiosInstance';
import type {
  TaskChecklist,
  TaskChecklistItem,
  CreateTaskChecklistDto,
  UpdateTaskChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  ReorderChecklistItemsDto,
  BulkCreateChecklistItemsDto,
} from '@/modules/tasks/types/checklist';

export const taskChecklistApi = {
  // Checklist CRUD
  async getChecklistsForProjectTask(projectTaskId: number): Promise<TaskChecklist[]> {
    const response = await api.get<TaskChecklist[]>(`/api/taskchecklists/project-task/${projectTaskId}`);
    return response.data;
  },

  async getChecklistsForDailyTask(dailyTaskId: number): Promise<TaskChecklist[]> {
    const response = await api.get<TaskChecklist[]>(`/api/taskchecklists/daily-task/${dailyTaskId}`);
    return response.data;
  },

  async getChecklistById(id: number): Promise<TaskChecklist> {
    const response = await api.get<TaskChecklist>(`/api/taskchecklists/${id}`);
    return response.data;
  },

  async createChecklist(data: CreateTaskChecklistDto): Promise<TaskChecklist> {
    const response = await api.post<TaskChecklist>('/api/taskchecklists', data);
    return response.data;
  },

  async updateChecklist(id: number, data: UpdateTaskChecklistDto): Promise<TaskChecklist> {
    const response = await api.put<TaskChecklist>(`/api/taskchecklists/${id}`, data);
    return response.data;
  },

  async deleteChecklist(id: number): Promise<void> {
    await api.delete(`/api/taskchecklists/${id}`);
  },

  // Checklist Items CRUD
  async createChecklistItem(data: CreateChecklistItemDto): Promise<TaskChecklistItem> {
    const response = await api.post<TaskChecklistItem>('/api/taskchecklists/items', data);
    return response.data;
  },

  async updateChecklistItem(id: number, data: UpdateChecklistItemDto): Promise<TaskChecklistItem> {
    const response = await api.put<TaskChecklistItem>(`/api/taskchecklists/items/${id}`, data);
    return response.data;
  },

  async deleteChecklistItem(id: number): Promise<void> {
    await api.delete(`/api/taskchecklists/items/${id}`);
  },

  async toggleChecklistItem(id: number): Promise<TaskChecklistItem> {
    const response = await api.post<TaskChecklistItem>(`/api/taskchecklists/items/${id}/toggle`);
    return response.data;
  },

  async reorderChecklistItems(data: ReorderChecklistItemsDto): Promise<void> {
    await api.post('/api/taskchecklists/items/reorder', data);
  },

  async bulkCreateChecklistItems(data: BulkCreateChecklistItemsDto): Promise<TaskChecklistItem[]> {
    const response = await api.post<TaskChecklistItem[]>('/api/taskchecklists/items/bulk', data);
    return response.data;
  },

  // Convert checklist item to subtask
  async convertItemToSubtask(itemId: number): Promise<{ taskId: number }> {
    const response = await api.post<{ taskId: number }>(`/api/taskchecklists/items/${itemId}/convert-to-task`);
    return response.data;
  },
};
