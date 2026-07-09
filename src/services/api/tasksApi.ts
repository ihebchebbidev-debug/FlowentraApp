// Tasks API Service - Backend Integration
import type { Task, DailyTask, TaskComment, TaskAttachment } from '@/modules/tasks/types';
import { getAuthHeaders, getAuthToken, getMutationHeaders, getMutationHeadersNoContentType } from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';
import {
  buildCreateProjectTaskPayload,
  mapTaskStatusToColumnId,
  normalizeTaskStatus,
} from '@/modules/tasks/utils/taskStatusMapping';
import {
  isOfflineNoCache503,
  parseOfflineNoCacheBody,
  throwIfNotOkAfterOfflineCheck,
} from '@/services/offline/offlineHttpRead';
import { getOfflineDetailPlaceholder } from '@/services/offline/offlineDetailPlaceholders';

const ISO_OFFLINE_STUB = '1970-01-01T00:00:00.000Z';

/** Merge shared offline detail stub into a DTO so mappers always receive required fields. */
function projectTaskDtoFromOfflinePlaceholder(id: number): ProjectTaskResponseDto {
  const ph =
    (getOfflineDetailPlaceholder(`/api/Tasks/project-task/${id}`) as Partial<ProjectTaskResponseDto>) || {};
  return {
    id: ph.id ?? id,
    title: ph.title ?? '',
    description: ph.description,
    projectId: ph.projectId ?? 0,
    projectName: ph.projectName ?? '',
    contactId: ph.contactId,
    contactName: ph.contactName,
    assigneeId: ph.assigneeId,
    assigneeName: ph.assigneeName,
    assignedUserId: ph.assignedUserId,
    assignedUserName: ph.assignedUserName,
    status: ph.status,
    priority: ph.priority,
    columnId: ph.columnId ?? 0,
    columnTitle: ph.columnTitle,
    columnName: ph.columnName,
    columnColor: ph.columnColor,
    position: ph.position,
    displayOrder: ph.displayOrder,
    parentTaskId: ph.parentTaskId,
    parentTaskTitle: ph.parentTaskTitle,
    dueDate: ph.dueDate,
    startDate: ph.startDate,
    estimatedHours: ph.estimatedHours,
    actualHours: ph.actualHours,
    tags: ph.tags,
    attachments: ph.attachments,
    createdAt: ph.createdAt,
    createdDate: ph.createdDate,
    updatedAt: ph.updatedAt,
    modifiedDate: ph.modifiedDate,
    completedAt: ph.completedAt,
    createdBy: ph.createdBy,
    modifiedBy: ph.modifiedBy,
    subTasks: ph.subTasks,
    commentsCount: ph.commentsCount ?? 0,
    attachmentsCount: ph.attachmentsCount ?? 0,
  };
}

function dailyTaskDtoFromOfflinePlaceholder(id: number): DailyTaskResponseDto {
  const ph =
    (getOfflineDetailPlaceholder(`/api/Tasks/daily-task/${id}`) as Partial<DailyTaskResponseDto>) || {};
  const due = ph.dueDate ?? ISO_OFFLINE_STUB;
  const created = ph.createdDate ?? due;
  return {
    id: ph.id ?? id,
    title: ph.title ?? '',
    description: ph.description,
    dueDate: due,
    isCompleted: ph.isCompleted ?? false,
    completedDate: ph.completedDate,
    assignedUserId: ph.assignedUserId,
    assignedUserName: ph.assignedUserName,
    priority: ph.priority,
    status: ph.status ?? 'todo',
    createdDate: created,
    createdBy: ph.createdBy ?? '',
  };
}

// Backend response DTOs — aligned with Backend/Modules/Projects/DTOs/TaskDTOs.cs
export interface ProjectTaskResponseDto {
  id: number;
  title: string;
  description?: string;
  taskType?: string;
  status?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  assignedUserId?: number;
  assignedUserName?: string | null;
  assignedUserProfilePictureUrl?: string | null;
  dueDate?: string;
  createdDate?: string;
  createdAt?: string;
  modifiedDate?: string;
  updatedAt?: string;
  createdBy?: string;
  modifiedBy?: string;
  // Legacy / extended fields (optional, not in current backend)
  projectId?: number;
  projectName?: string;
  contactId?: number;
  contactName?: string;
  assigneeId?: number;
  assigneeName?: string;
  priority?: string;
  columnId?: number;
  columnTitle?: string;
  columnName?: string;
  columnColor?: string;
  position?: number;
  displayOrder?: number;
  parentTaskId?: number;
  parentTaskTitle?: string;
  startDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  attachments?: string[];
  completedAt?: string;
  subTasks?: ProjectTaskResponseDto[];
  commentsCount?: number;
  attachmentsCount?: number;
}

// Backend actual response format for DailyTask
export interface DailyTaskResponseDto {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  completedDate?: string;
  assignedUserId?: number;
  assignedUserName?: string;
  priority?: string;
  status: string; // todo, in-progress, done
  createdDate: string;
  createdBy: string;
}

export interface TaskListResponseDto {
  projectTasks: ProjectTaskResponseDto[];
  dailyTasks: DailyTaskResponseDto[];
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Request DTOs — aligned with backend CreateProjectTaskRequestDto
export interface CreateProjectTaskRequestDto {
  title: string;
  description?: string;
  taskType?: string;
  status?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  assignedUserId?: number;
  dueDate?: string;
  /** @deprecated legacy callers — mapped to relatedEntityId */
  projectId?: number;
  /** @deprecated legacy callers — mapped to assignedUserId */
  assigneeId?: number;
  assigneeName?: string;
  columnId?: number;
  priority?: string;
  tags?: string[];
}

export interface CreateDailyTaskRequestDto {
  title: string;
  description?: string;
  taskType?: string;
  status?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  assignedUserId?: number;
  dueDate?: string;
  priority?: string;
}

export interface UpdateProjectTaskRequestDto {
  title?: string;
  description?: string;
  taskType?: string;
  status?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  assignedUserId?: number;
  dueDate?: string;
}

export interface UpdateDailyTaskRequestDto {
  title?: string;
  description?: string;
  taskType?: string;
  status?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  assignedUserId?: number;
  dueDate?: string;
  isCompleted?: boolean;
  completedDate?: string;
}

export interface MoveTaskRequestDto {
  status: string;
}

export interface TaskSearchRequestDto {
  searchTerm?: string;
  status?: string;
  priority?: string;
  projectId?: number;
  assigneeId?: number;
  contactId?: number;
  tags?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  isOverdue?: boolean;
  hasParent?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface AssignTaskRequestDto {
  assignedUserId: number;  // Backend expects AssignedUserId (not assigneeId)
}

export interface BulkMoveTasksRequestDto {
  tasks: TaskMoveDto[];
}

export interface TaskMoveDto {
  id: number;
  status: string;
}

export interface BulkAssignTasksRequestDto {
  taskIds: number[];
  assignedUserId: number;  // Backend expects AssignedUserId (not assigneeId)
}

export interface BulkUpdateTaskStatusDto {
  taskIds: number[];
  status: string;
}

// Mappers
const getMainAdminFromStorage = (): { id?: string; name?: string; profilePictureUrl?: string } => {
  try {
    const raw = localStorage.getItem('user_data');
    if (!raw) return {};
    const user = JSON.parse(raw);
    const id = user?.id != null ? String(user.id) : undefined;
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email;
    const profilePictureUrl = user?.profilePictureUrl || undefined;
    return { id, name, profilePictureUrl };
  } catch {
    return {};
  }
};

const mapProjectTaskToFrontend = (dto: ProjectTaskResponseDto): Task => {
  const assigneeIdNum =
    dto.assignedUserId ??
    dto.assigneeId ??
    (dto as any).AssignedUserId ??
    (dto as any).AssigneeId;

  const assigneeId = assigneeIdNum != null ? String(assigneeIdNum) : undefined;

  let assigneeName =
    dto.assignedUserName ??
    dto.assigneeName ??
    (dto as any).AssignedUserName ??
    (dto as any).AssigneeName;

  const assigneeProfilePicUrl =
    dto.assignedUserProfilePictureUrl ??
    (dto as any).AssignedUserProfilePictureUrl ??
    undefined;

  if ((!assigneeName || assigneeName === 'null') && assigneeId) {
    const mainAdmin = getMainAdminFromStorage();
    if (mainAdmin.id && mainAdmin.id === assigneeId) {
      assigneeName = mainAdmin.name;
    }
  }

  let resolvedAssigneeProfilePicUrl = assigneeProfilePicUrl;
  if (!resolvedAssigneeProfilePicUrl && assigneeId) {
    const mainAdmin = getMainAdminFromStorage();
    if (mainAdmin.id && mainAdmin.id === assigneeId) {
      resolvedAssigneeProfilePicUrl = mainAdmin.profilePictureUrl;
    }
  }

  const createdAtRaw = dto.createdAt ?? dto.createdDate;
  const updatedAtRaw = dto.updatedAt ?? dto.modifiedDate ?? dto.createdAt ?? dto.createdDate;
  const status = normalizeTaskStatus(dto.status ?? dto.columnId);
  const relatedEntityType = dto.relatedEntityType ?? (dto as any).RelatedEntityType;
  const relatedEntityId = dto.relatedEntityId ?? (dto as any).RelatedEntityId;
  const projectId =
    relatedEntityType === 'project' && relatedEntityId != null
      ? String(relatedEntityId)
      : dto.projectId != null
        ? String(dto.projectId)
        : undefined;

  return {
    id: String(dto.id),
    title: dto.title,
    description: dto.description,
    taskType: dto.taskType || (dto as any).TaskType,
    status,
    priority: (dto.priority || 'medium') as Task['priority'],
    assigneeId,
    assigneeName: assigneeName || undefined,
    assignee: assigneeName || '',
    assigneeProfilePicUrl: resolvedAssigneeProfilePicUrl,
    projectId,
    projectName: dto.projectName,
    relatedEntityType,
    relatedEntityId,
    contactId: dto.contactId ? String(dto.contactId) : undefined,
    contactName: dto.contactName,
    parentTaskId: dto.parentTaskId ? String(dto.parentTaskId) : undefined,
    parentTaskTitle: dto.parentTaskTitle,
    dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    startDate: dto.startDate ? new Date(dto.startDate) : undefined,
    tags: dto.tags || [],
    attachments: dto.attachments || [],
    estimatedHours: dto.estimatedHours,
    actualHours: dto.actualHours,
    createdAt: createdAtRaw ? new Date(createdAtRaw) : new Date(),
    updatedAt: updatedAtRaw ? new Date(updatedAtRaw) : new Date(),
    completedAt:
      status === 'completed' || status === 'cancelled'
        ? dto.completedAt
          ? new Date(dto.completedAt)
          : updatedAtRaw
            ? new Date(updatedAtRaw)
            : undefined
        : dto.completedAt
          ? new Date(dto.completedAt)
          : undefined,
    columnId: dto.columnId != null ? String(dto.columnId) : mapTaskStatusToColumnId(status),
    columnTitle: dto.columnTitle || dto.columnName || '',
    columnColor: dto.columnColor || '',
    position: dto.position ?? dto.displayOrder ?? 0,
    subTasks: dto.subTasks?.map(mapProjectTaskToFrontend) || [],
    commentsCount: dto.commentsCount,
    attachmentsCount: dto.attachmentsCount,
    createdBy: dto.createdBy,
    modifiedBy: dto.modifiedBy,
  };
};

const mapDailyTaskToFrontend = (dto: DailyTaskResponseDto): DailyTask => ({
  id: String(dto.id),
  title: dto.title,
  description: dto.description,
  // Use status from backend directly
  status: dto.status || (dto.isCompleted ? 'done' : 'todo'),
  priority: (dto.priority || 'medium') as DailyTask['priority'],
  userId: dto.assignedUserId ? String(dto.assignedUserId) : '',
  userName: dto.assignedUserName || '',
  position: 0,
  dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
  tags: [],
  attachments: [],
  createdAt: new Date(dto.createdDate),
  updatedAt: new Date(dto.createdDate),
  completedAt: dto.completedDate ? new Date(dto.completedDate) : undefined,
  commentsCount: 0,
  attachmentsCount: 0,
  createdBy: dto.createdBy,
  // Quick completion fields
  isCompleted: dto.isCompleted || false,
  completedDate: dto.completedDate ? new Date(dto.completedDate) : undefined,
});

export const tasksApi = {
  // ============ Project Tasks ============

  // Get all tasks for a project (entity/project or legacy project/{id} route)
  async getProjectTasks(projectId: number): Promise<Task[]> {
    const entityUrl = `${API_URL}/api/Tasks/entity/project/${projectId}`;
    const legacyUrl = `${API_URL}/api/Tasks/project/${projectId}`;

    const fetchTasks = async (url: string) => {
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const offlineBody = await parseOfflineNoCacheBody(response);
      if (isOfflineNoCache503(offlineBody)) {
        return { ok: true as const, tasks: [] as ProjectTaskResponseDto[] };
      }

      if (response.status === 404) {
        return { ok: false as const, notFound: true };
      }

      await throwIfNotOkAfterOfflineCheck(
        response,
        offlineBody,
        `Failed to fetch tasks for project ${projectId}: ${response.status}`
      );

      const data: ProjectTaskResponseDto[] = await response.json();
      return { ok: true as const, tasks: data ?? [] };
    };

    let result = await fetchTasks(entityUrl);
    if (!result.ok && result.notFound) {
      result = await fetchTasks(legacyUrl);
    }

    if (!result.ok) {
      return [];
    }

    console.log('[tasksApi] Project tasks received:', result.tasks.length, 'tasks');
    return result.tasks.map(mapProjectTaskToFrontend);
  },

  // Get all tasks for a column
  async getColumnTasks(columnId: number): Promise<Task[]> {
    const response = await fetch(`${API_URL}/api/Tasks/column/${columnId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offlineCol = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineCol)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(
      response,
      offlineCol,
      `Failed to fetch tasks for column ${columnId}`
    );

    const data: ProjectTaskResponseDto[] = await response.json();
    return data.map(mapProjectTaskToFrontend);
  },

  // Get project task by ID
  async getProjectTaskById(id: number): Promise<Task> {
    const response = await fetch(`${API_URL}/api/Tasks/project-task/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offlineTask = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineTask)) {
      return mapProjectTaskToFrontend(projectTaskDtoFromOfflinePlaceholder(id));
    }

    await throwIfNotOkAfterOfflineCheck(response, offlineTask, `Failed to fetch task ${id}`);

    const data: ProjectTaskResponseDto = await response.json();
    return mapProjectTaskToFrontend(data);
  },

  // Create project task
  async createProjectTask(request: CreateProjectTaskRequestDto): Promise<Task> {
    const payload = buildCreateProjectTaskPayload(
      request as unknown as Record<string, unknown>,
      request.projectId ?? request.relatedEntityId
    );

    if (!payload.title) {
      throw new Error('Task title is required');
    }

    const response = await fetch(`${API_URL}/api/Tasks/project-task`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create task' }));
      throw new Error(error.message || 'Failed to create task');
    }

    const data: ProjectTaskResponseDto = await response.json();
    return mapProjectTaskToFrontend(data);
  },

  // Update project task
  async updateProjectTask(id: number, request: UpdateProjectTaskRequestDto): Promise<Task> {
    const response = await fetch(`${API_URL}/api/Tasks/project-task/${id}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update task' }));
      throw new Error(error.message || 'Failed to update task');
    }

    const data: ProjectTaskResponseDto = await response.json();
    return mapProjectTaskToFrontend(data);
  },

  // Delete project task
  async deleteProjectTask(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Tasks/project-task/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  },

  // ============ Daily Tasks ============

  // Get all daily tasks for a user
  async getUserDailyTasks(userId: number): Promise<DailyTask[]> {
    const url = `${API_URL}/api/Tasks/daily/user/${userId}`;
    console.log('[tasksApi] Fetching daily tasks from:', url);
    console.log('[tasksApi] Auth token present:', !!getAuthToken());
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('[tasksApi] Response status:', response.status, response.statusText);

    const offlineDaily = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineDaily)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(
      response,
      offlineDaily,
      `Failed to fetch daily tasks for user ${userId}: ${response.status}`
    );

    const data: DailyTaskResponseDto[] = await response.json();
    console.log('[tasksApi] Daily tasks received:', data?.length || 0, 'tasks');
    return data.map(mapDailyTaskToFrontend);
  },

  // Get daily task by ID
  async getDailyTaskById(id: number): Promise<DailyTask> {
    const response = await fetch(`${API_URL}/api/Tasks/daily-task/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offlineDt = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineDt)) {
      return mapDailyTaskToFrontend(dailyTaskDtoFromOfflinePlaceholder(id));
    }

    await throwIfNotOkAfterOfflineCheck(response, offlineDt, `Failed to fetch daily task ${id}`);

    const data: DailyTaskResponseDto = await response.json();
    return mapDailyTaskToFrontend(data);
  },

  // Create daily task
  async createDailyTask(request: CreateDailyTaskRequestDto): Promise<DailyTask> {
    const response = await fetch(`${API_URL}/api/Tasks/daily-task`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create daily task' }));
      throw new Error(error.message || 'Failed to create daily task');
    }

    const data: DailyTaskResponseDto = await response.json();
    return mapDailyTaskToFrontend(data);
  },

  // Update daily task
  async updateDailyTask(id: number, request: UpdateDailyTaskRequestDto): Promise<DailyTask> {
    const response = await fetch(`${API_URL}/api/Tasks/daily-task/${id}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update daily task' }));
      throw new Error(error.message || 'Failed to update daily task');
    }

    const data: DailyTaskResponseDto = await response.json();
    return mapDailyTaskToFrontend(data);
  },

  // Delete daily task
  async deleteDailyTask(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Tasks/daily-task/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete daily task');
    }
  },

  // Complete daily task (mark as fully closed)
  async completeDailyTask(id: number): Promise<DailyTask> {
    const response = await fetch(`${API_URL}/api/Tasks/daily-task/${id}/complete`, {
      method: 'PUT',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to complete daily task');
    }

    const data: DailyTaskResponseDto = await response.json();
    return mapDailyTaskToFrontend(data);
  },

  // ============ Task Search and Filtering ============

  // Search tasks with filters
  async searchTasks(params: TaskSearchRequestDto): Promise<{ tasks: Task[]; totalCount: number }> {
    const queryParams = new URLSearchParams();
    
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.status) queryParams.append('status', normalizeTaskStatus(params.status));
    if (params.projectId) {
      queryParams.append('relatedEntityType', 'project');
      queryParams.append('relatedEntityId', String(params.projectId));
    }
    if (params.assigneeId) queryParams.append('assignedUserId', String(params.assigneeId));
    if (params.dueDateFrom) queryParams.append('dueDateFrom', params.dueDateFrom);
    if (params.dueDateTo) queryParams.append('dueDateTo', params.dueDateTo);
    if (params.isOverdue !== undefined) queryParams.append('isOverdue', String(params.isOverdue));
    if (params.hasParent !== undefined) queryParams.append('hasParent', String(params.hasParent));
    if (params.pageNumber) queryParams.append('pageNumber', String(params.pageNumber));
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    
    if (params.tags) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }

    const query = queryParams.toString();
    const url = query ? `${API_URL}/api/Tasks/search?${query}` : `${API_URL}/api/Tasks/search`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offlineSearch = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineSearch)) {
      return { tasks: [], totalCount: 0 };
    }

    await throwIfNotOkAfterOfflineCheck(response, offlineSearch, 'Failed to search tasks');

    const data: TaskListResponseDto = await response.json();
    return {
      tasks: data.projectTasks.map(mapProjectTaskToFrontend),
      totalCount: data.totalCount,
    };
  },

  // Get tasks by assignee
  async getTasksByAssignee(assigneeId: number, projectId?: number): Promise<Task[]> {
    const queryParams = projectId ? `?entityType=project&entityId=${projectId}` : '';
    
    const response = await fetch(`${API_URL}/api/Tasks/assignee/${assigneeId}${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offlineAsg = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineAsg)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offlineAsg, 'Failed to fetch tasks by assignee');

    const data: ProjectTaskResponseDto[] = await response.json();
    return data.map(mapProjectTaskToFrontend);
  },

  // Get overdue tasks
  async getOverdueTasks(projectId?: number, assigneeId?: number): Promise<Task[]> {
    const queryParams = new URLSearchParams();
    if (projectId) {
      queryParams.append('entityType', 'project');
      queryParams.append('entityId', String(projectId));
    }
    if (assigneeId) queryParams.append('assigneeId', String(assigneeId));

    const url = queryParams.toString()
      ? `${API_URL}/api/Tasks/overdue?${queryParams}`
      : `${API_URL}/api/Tasks/overdue`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offlineOd = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineOd)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offlineOd, 'Failed to fetch overdue tasks');

    const data: ProjectTaskResponseDto[] = await response.json();
    return data.map(mapProjectTaskToFrontend);
  },

  // Get tasks by contact
  async getTasksByContact(contactId: number): Promise<Task[]> {
    const response = await fetch(`${API_URL}/api/Tasks/contact/${contactId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offlineTc = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineTc)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offlineTc, 'Failed to fetch tasks by contact');

    const data: ProjectTaskResponseDto[] = await response.json();
    return data.map(mapProjectTaskToFrontend);
  },

  // ============ Task Movement and Positioning ============

  // Move task to different column/position
  async moveTask(taskId: number, moveDto: MoveTaskRequestDto): Promise<void> {
    const response = await fetch(`${API_URL}/api/Tasks/${taskId}/move`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(moveDto),
    });

    if (!response.ok) {
      throw new Error('Failed to move task');
    }
  },

  // Bulk move tasks
  async bulkMoveTasks(bulkMoveDto: BulkMoveTasksRequestDto): Promise<void> {
    const response = await fetch(`${API_URL}/api/Tasks/bulk/move`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(bulkMoveDto),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk move tasks');
    }
  },

  // ============ Task Assignment ============

  // Assign task to user
  async assignTask(taskId: number, assignDto: AssignTaskRequestDto): Promise<void> {
    const url = `${API_URL}/api/Tasks/${taskId}/assign`;
    // Backend expects PascalCase property names
    const body = { AssignedUserId: assignDto.assignedUserId };
    
    console.log('[tasksApi] Assigning task:', { url, body, taskId });
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(body),
    });

    console.log('[tasksApi] Assign response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      console.error('[tasksApi] Failed to assign task:', errorText);
      throw new Error('Failed to assign task');
    }
  },

  // Unassign task
  async unassignTask(taskId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Tasks/${taskId}/unassign`, {
      method: 'PUT',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to unassign task');
    }
  },

  // Bulk assign tasks
  async bulkAssignTasks(bulkAssignDto: BulkAssignTasksRequestDto): Promise<void> {
    const response = await fetch(`${API_URL}/api/Tasks/bulk/assign`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(bulkAssignDto),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk assign tasks');
    }
  },

  // ============ Task Status Management ============

  // Update task status (uses move endpoint — dedicated /status route was removed)
  async updateTaskStatus(taskId: number, status: string): Promise<void> {
    await this.moveTask(taskId, { status: normalizeTaskStatus(status) });
  },

  // Complete task (uses move endpoint — dedicated /complete route was removed)
  async completeTask(taskId: number): Promise<void> {
    await this.moveTask(taskId, { status: 'completed' });
  },

  // Bulk update task status
  async bulkUpdateTaskStatus(bulkUpdateDto: BulkUpdateTaskStatusDto): Promise<void> {
    const response = await fetch(`${API_URL}/api/Tasks/bulk/status`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(bulkUpdateDto),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk update task status');
    }
  },

  // ============ Task Statistics ============

  // Get task status counts for project
  async getTaskStatusCounts(projectId: number): Promise<Record<string, number>> {
    const response = await fetch(`${API_URL}/api/Tasks/project/${projectId}/status-counts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return {};
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch task status counts');
    return await response.json();
  },

  // Get user task status counts
  async getUserTaskStatusCounts(userId: number): Promise<Record<string, number>> {
    const response = await fetch(`${API_URL}/api/Tasks/user/${userId}/status-counts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return {};
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch user task status counts');
    return await response.json();
  },

  // Get user overdue task count
  async getUserOverdueTaskCount(userId: number): Promise<number> {
    const response = await fetch(`${API_URL}/api/Tasks/user/${userId}/overdue-count`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return 0;
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch user overdue task count');
    return await response.json();
  },

  // Get task completion percentage for project
  async getTaskCompletionPercentage(projectId: number): Promise<number> {
    const response = await fetch(`${API_URL}/api/Tasks/project/${projectId}/completion-percentage`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return 0;
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch task completion percentage');
    return await response.json();
  },

  // ============ Sub-tasks ============

  // Get sub-tasks
  async getSubTasks(parentTaskId: number): Promise<Task[]> {
    const response = await fetch(`${API_URL}/api/Tasks/${parentTaskId}/subtasks`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch sub-tasks');

    const data: ProjectTaskResponseDto[] = await response.json();
    return data.map(mapProjectTaskToFrontend);
  },

  // Create sub-task
  async createSubTask(parentTaskId: number, request: CreateProjectTaskRequestDto): Promise<Task> {
    const response = await fetch(`${API_URL}/api/Tasks/${parentTaskId}/subtasks`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create sub-task' }));
      throw new Error(error.message || 'Failed to create sub-task');
    }

    const data: ProjectTaskResponseDto = await response.json();
    return mapProjectTaskToFrontend(data);
  },

  // Convert to sub-task
  async convertToSubTask(taskId: number, parentTaskId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Tasks/${taskId}/convert-to-subtask`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify({ parentTaskId }),
    });

    if (!response.ok) {
      throw new Error('Failed to convert to sub-task');
    }
  },

  // Convert to standalone task
  async convertToStandaloneTask(taskId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Tasks/${taskId}/convert-to-standalone`, {
      method: 'PUT',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to convert to standalone task');
    }
  },
};
