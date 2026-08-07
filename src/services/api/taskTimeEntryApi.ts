// Task Time Entry API Service
import type {
  TaskTimeEntry,
  CreateTaskTimeEntryDto,
  UpdateTaskTimeEntryDto,
  TaskTimeTrackingSummary,
  TaskTimeEntryQuery,
} from '@/modules/tasks/types/timeTracking';
import { getAuthHeaders, getMutationHeaders, getMutationHeadersNoContentType } from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';
import {
  isOfflineNoCache503,
  parseOfflineNoCacheBody,
  throwIfNotOkAfterOfflineCheck,
} from '@/services/offline/offlineHttpRead';
import { getOfflineDetailPlaceholder } from '@/services/offline/offlineDetailPlaceholders';

const ISO_OFFLINE_STUB = '1970-01-01T00:00:00.000Z';

function taskTimeEntryDtoFromOfflinePlaceholder(id: number): TaskTimeEntryResponseDto {
  const ph =
    (getOfflineDetailPlaceholder(`/api/TaskTimeEntries/${id}`) as Partial<TaskTimeEntryResponseDto>) || {};
  return {
    id: ph.id ?? id,
    projectTaskId: ph.projectTaskId,
    projectTaskTitle: ph.projectTaskTitle,
    dailyTaskId: ph.dailyTaskId,
    dailyTaskTitle: ph.dailyTaskTitle,
    userId: ph.userId ?? 0,
    userName: ph.userName,
    startTime: ph.startTime ?? ISO_OFFLINE_STUB,
    endTime: ph.endTime,
    duration: ph.duration ?? 0,
    description: ph.description,
    isBillable: ph.isBillable ?? true,
    hourlyRate: ph.hourlyRate,
    totalCost: ph.totalCost,
    workType: ph.workType ?? 'work',
    approvalStatus: ph.approvalStatus ?? 'pending',
    approvedById: ph.approvedById,
    approvedByName: ph.approvedByName,
    approvedDate: ph.approvedDate,
    approvalNotes: ph.approvalNotes,
    createdDate: ph.createdDate ?? ISO_OFFLINE_STUB,
    createdBy: ph.createdBy ?? '',
    modifiedDate: ph.modifiedDate,
    modifiedBy: ph.modifiedBy,
  };
}

// Backend response DTO
interface TaskTimeEntryResponseDto {
  id: number;
  projectTaskId?: number;
  projectTaskTitle?: string;
  dailyTaskId?: number;
  dailyTaskTitle?: string;
  userId: number;
  userName?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  description?: string;
  isBillable: boolean;
  hourlyRate?: number;
  totalCost?: number;
  workType: string;
  approvalStatus: string;
  approvedById?: number;
  approvedByName?: string;
  approvedDate?: string;
  approvalNotes?: string;
  createdDate: string;
  createdBy: string;
  modifiedDate?: string;
  modifiedBy?: string;
}

interface TaskTimeTrackingSummaryDto {
  taskId: number;
  taskType: string;
  taskTitle: string;
  totalLoggedMinutes: number;
  totalLoggedHours: number;
  estimatedHours?: number;
  remainingEstimate?: number;
  totalBillableMinutes?: number;
  totalCost?: number;
  entryCount: number;
  entries: TaskTimeEntryResponseDto[];
}

// Mapper functions
const mapTimeEntryToFrontend = (dto: TaskTimeEntryResponseDto): TaskTimeEntry => ({
  id: String(dto.id),
  projectTaskId: dto.projectTaskId ? String(dto.projectTaskId) : undefined,
  projectTaskTitle: dto.projectTaskTitle,
  dailyTaskId: dto.dailyTaskId ? String(dto.dailyTaskId) : undefined,
  dailyTaskTitle: dto.dailyTaskTitle,
  userId: String(dto.userId),
  userName: dto.userName,
  startTime: new Date(dto.startTime),
  endTime: dto.endTime ? new Date(dto.endTime) : undefined,
  duration: dto.duration,
  description: dto.description,
  isBillable: dto.isBillable,
  hourlyRate: dto.hourlyRate,
  totalCost: dto.totalCost,
  workType: dto.workType as TaskTimeEntry['workType'],
  approvalStatus: dto.approvalStatus as TaskTimeEntry['approvalStatus'],
  approvedById: dto.approvedById ? String(dto.approvedById) : undefined,
  approvedByName: dto.approvedByName,
  approvedDate: dto.approvedDate ? new Date(dto.approvedDate) : undefined,
  approvalNotes: dto.approvalNotes,
  createdDate: new Date(dto.createdDate),
  createdBy: dto.createdBy,
  modifiedDate: dto.modifiedDate ? new Date(dto.modifiedDate) : undefined,
  modifiedBy: dto.modifiedBy,
});

const mapSummaryToFrontend = (dto: TaskTimeTrackingSummaryDto): TaskTimeTrackingSummary => ({
  taskId: String(dto.taskId),
  taskType: dto.taskType as 'project' | 'daily',
  taskTitle: dto.taskTitle,
  totalLoggedMinutes: dto.totalLoggedMinutes,
  totalLoggedHours: dto.totalLoggedHours,
  estimatedHours: dto.estimatedHours,
  remainingEstimate: dto.remainingEstimate,
  totalBillableMinutes: dto.totalBillableMinutes,
  totalCost: dto.totalCost,
  entryCount: dto.entryCount,
  entries: dto.entries.map(mapTimeEntryToFrontend),
});

export const taskTimeEntryApi = {
  // Create a new time entry
  async createTimeEntry(data: CreateTaskTimeEntryDto): Promise<TaskTimeEntry> {
    const response = await fetch(`${API_URL}/api/TaskTimeEntries`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create time entry' }));
      throw new Error(error.message || 'Failed to create time entry');
    }

    const result: TaskTimeEntryResponseDto = await response.json();
    return mapTimeEntryToFrontend(result);
  },

  // Update a time entry
  async updateTimeEntry(id: number, data: UpdateTaskTimeEntryDto): Promise<TaskTimeEntry> {
    const response = await fetch(`${API_URL}/api/TaskTimeEntries/${id}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update time entry' }));
      throw new Error(error.message || 'Failed to update time entry');
    }

    const result: TaskTimeEntryResponseDto = await response.json();
    return mapTimeEntryToFrontend(result);
  },

  // Delete a time entry
  async deleteTimeEntry(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/TaskTimeEntries/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete time entry');
    }
  },

  // Get time entry by ID
  async getTimeEntryById(id: number): Promise<TaskTimeEntry> {
    const response = await fetch(`${API_URL}/api/TaskTimeEntries/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return mapTimeEntryToFrontend(taskTimeEntryDtoFromOfflinePlaceholder(id));
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, `Failed to fetch time entry ${id}`);

    const result: TaskTimeEntryResponseDto = await response.json();
    return mapTimeEntryToFrontend(result);
  },

  // Get time entries for a project task
  async getTimeEntriesForProjectTask(projectTaskId: number): Promise<TaskTimeEntry[]> {
    const response = await fetch(`${API_URL}/api/TaskTimeEntries/project-task/${projectTaskId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(
      response,
      offline,
      `Failed to fetch time entries for project task ${projectTaskId}`
    );

    const result: TaskTimeEntryResponseDto[] = await response.json();
    return result.map(mapTimeEntryToFrontend);
  },

  // Get time entries for a daily task
  async getTimeEntriesForDailyTask(dailyTaskId: number): Promise<TaskTimeEntry[]> {
    const response = await fetch(`${API_URL}/api/TaskTimeEntries/daily-task/${dailyTaskId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offlineDailyList = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineDailyList)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(
      response,
      offlineDailyList,
      `Failed to fetch time entries for daily task ${dailyTaskId}`
    );

    const result: TaskTimeEntryResponseDto[] = await response.json();
    return result.map(mapTimeEntryToFrontend);
  },

  // Get time tracking summary for a project task
  async getProjectTaskTimeSummary(projectTaskId: number): Promise<TaskTimeTrackingSummary> {
    // Backend route is /summary/project-task/{id}
    const response = await fetch(`${API_URL}/api/TaskTimeEntries/summary/project-task/${projectTaskId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return {
        taskId: String(projectTaskId),
        taskType: 'project',
        taskTitle: '',
        totalLoggedMinutes: 0,
        totalLoggedHours: 0,
        entryCount: 0,
        entries: [],
      };
    }

    if (!response.ok) {
      // Return empty summary instead of throwing
      return {
        taskId: String(projectTaskId),
        taskType: 'project',
        taskTitle: '',
        totalLoggedMinutes: 0,
        totalLoggedHours: 0,
        entryCount: 0,
        entries: [],
      };
    }

    const result: TaskTimeTrackingSummaryDto = await response.json();
    return mapSummaryToFrontend(result);
  },

  // Get time tracking summary for a daily task
  async getDailyTaskTimeSummary(dailyTaskId: number): Promise<TaskTimeTrackingSummary> {
    // Backend route is /summary/daily-task/{id}
    const response = await fetch(`${API_URL}/api/TaskTimeEntries/summary/daily-task/${dailyTaskId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offlineDaily = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineDaily)) {
      return {
        taskId: String(dailyTaskId),
        taskType: 'daily',
        taskTitle: '',
        totalLoggedMinutes: 0,
        totalLoggedHours: 0,
        entryCount: 0,
        entries: [],
      };
    }

    if (!response.ok) {
      // Return empty summary instead of throwing
      return {
        taskId: String(dailyTaskId),
        taskType: 'daily',
        taskTitle: '',
        totalLoggedMinutes: 0,
        totalLoggedHours: 0,
        entryCount: 0,
        entries: [],
      };
    }

    const result: TaskTimeTrackingSummaryDto = await response.json();
    return mapSummaryToFrontend(result);
  },

  // Query time entries with filters
  async queryTimeEntries(query: TaskTimeEntryQuery): Promise<TaskTimeEntry[]> {
    const params = new URLSearchParams();
    if (query.projectTaskId) params.append('projectTaskId', String(query.projectTaskId));
    if (query.dailyTaskId) params.append('dailyTaskId', String(query.dailyTaskId));
    if (query.userId) params.append('userId', String(query.userId));
    if (query.projectId) params.append('projectId', String(query.projectId));
    if (query.fromDate) params.append('fromDate', query.fromDate);
    if (query.toDate) params.append('toDate', query.toDate);
    if (query.isBillable !== undefined) params.append('isBillable', String(query.isBillable));
    if (query.approvalStatus) params.append('approvalStatus', query.approvalStatus);
    if (query.workType) params.append('workType', query.workType);
    if (query.pageNumber) params.append('pageNumber', String(query.pageNumber));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortDirection) params.append('sortDirection', query.sortDirection);

    const response = await fetch(`${API_URL}/api/TaskTimeEntries/query?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to query time entries');

    const result: TaskTimeEntryResponseDto[] = await response.json();
    return result.map(mapTimeEntryToFrontend);
  },

  // Start timer
  async startTimer(projectTaskId?: number, dailyTaskId?: number, workType: string = 'work'): Promise<TaskTimeEntry> {
    // Backend expects query parameters, not body
    const params = new URLSearchParams();
    if (projectTaskId) params.append('projectTaskId', String(projectTaskId));
    if (dailyTaskId) params.append('dailyTaskId', String(dailyTaskId));
    params.append('workType', workType);
    
    const response = await fetch(`${API_URL}/api/TaskTimeEntries/timer/start?${params.toString()}`, {
      method: 'POST',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to start timer' }));
      throw new Error(error.message || 'Failed to start timer');
    }

    const result: TaskTimeEntryResponseDto = await response.json();
    return mapTimeEntryToFrontend(result);
  },

  // Stop timer
  async stopTimer(timeEntryId: number, description?: string): Promise<TaskTimeEntry> {
    // Backend expects description as query parameter
    const params = new URLSearchParams();
    if (description) params.append('description', description);
    
    const url = `${API_URL}/api/TaskTimeEntries/timer/${timeEntryId}/stop${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to stop timer' }));
      throw new Error(error.message || 'Failed to stop timer');
    }

    const result: TaskTimeEntryResponseDto = await response.json();
    return mapTimeEntryToFrontend(result);
  },

  // Get active timer for current user
  async getActiveTimer(): Promise<TaskTimeEntry | null> {
    const response = await fetch(`${API_URL}/api/TaskTimeEntries/timer/active`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return null;
    }

    if (response.status === 404) {
      return null;
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to get active timer');

    const result: TaskTimeEntryResponseDto = await response.json();
    return mapTimeEntryToFrontend(result);
  },

  // Approve or reject a time entry
  async approveTimeEntry(id: number, isApproved: boolean, notes?: string): Promise<TaskTimeEntry> {
    const response = await fetch(`${API_URL}/api/TaskTimeEntries/${id}/approve`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify({ isApproved, notes }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to approve time entry' }));
      throw new Error(error.message || 'Failed to approve time entry');
    }

    const result: TaskTimeEntryResponseDto = await response.json();
    return mapTimeEntryToFrontend(result);
  },

  // Bulk approve time entries
  async bulkApproveTimeEntries(timeEntryIds: number[], isApproved: boolean, notes?: string): Promise<boolean> {
    const response = await fetch(`${API_URL}/api/TaskTimeEntries/approve/bulk`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify({ timeEntryIds, isApproved, notes }),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk approve time entries');
    }

    return true;
  },
};
