// Projects API Service - Backend Integration
import type { Project, Column, ProjectStats } from '@/modules/tasks/types';
import { getAuthHeaders, getMutationHeaders } from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';
import {
  isOfflineNoCache503,
  parseOfflineNoCacheBody,
  throwIfNotOkAfterOfflineCheck,
} from '@/services/offline/offlineHttpRead';
import { getOfflineDetailPlaceholder } from '@/services/offline/offlineDetailPlaceholders';

const EMPTY_PROJECT_STATS: ProjectStats = {
  totalTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  activeMembers: 0,
  completionPercentage: 0,
};

// Backend response DTOs — matches ProjectResponseDto in Backend/Modules/Projects/DTOs/ProjectDTOs.cs
export interface ProjectResponseDto {
  id: number;
  name: string;
  description?: string;
  contactId?: number;
  contactName?: string;
  status: string;
  projectKind: string;
  priority?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  teamMembers: number[];
  createdDate: string;
  createdBy?: string;
  modifiedDate?: string;
  modifiedBy?: string;
  columns: ColumnResponseDto[];
  settings?: ProjectSettingsDto;
}

export interface ColumnResponseDto {
  id: number;
  title?: string;
  name?: string; // Backend uses 'name' instead of 'title'
  color: string;
  position?: number;
  displayOrder?: number; // Backend uses 'displayOrder' instead of 'position'
  projectId?: number;
  isDefault?: boolean;
  limit?: number;
  createdAt?: string;
  taskCount?: number;
}


/** Merge shared offline project stub into full DTO for `mapProjectResponseToFrontend`. */
function projectResponseDtoFromOfflinePlaceholder(id: number): ProjectResponseDto {
  const ph =
    (getOfflineDetailPlaceholder(`/api/Projects/${id}`) as Partial<ProjectResponseDto>) || {};
  return {
    id: ph.id ?? id,
    name: ph.name ?? '',
    description: ph.description,
    contactId: ph.contactId,
    contactName: ph.contactName,
    status: ph.status ?? 'active',
    projectKind: ph.projectKind ?? 'client',
    priority: ph.priority ?? 'medium',
    startDate: ph.startDate,
    endDate: ph.endDate,
    teamMembers: ph.teamMembers ?? [],
    createdDate: ph.createdDate ?? '1970-01-01T00:00:00.000Z',
    createdBy: ph.createdBy,
    modifiedDate: ph.modifiedDate,
    modifiedBy: ph.modifiedBy,
    columns: ph.columns ?? [],
    settings: ph.settings,
  };
}

export interface ProjectLinkedEntityDto {
  entityType: string;
  entityId: number;
  number: string;
  title: string;
  status?: string;
  date?: string;
  isDeal?: boolean;
  amount?: number;
}

export interface ProjectLinksDto {
  projectId: number;
  offers: ProjectLinkedEntityDto[];
  sales: ProjectLinkedEntityDto[];
  serviceOrders: ProjectLinkedEntityDto[];
  dispatches: ProjectLinkedEntityDto[];
}

export interface ProjectSettingsDto {
  autoLinkConvertedEntities: boolean;
  requireProjectBeforeConvertingOffer: boolean;
  defaultTaskStatus: string;
  allowCrossProjectDispatch: boolean;
  showFinancialDataInProjectTabs: boolean;
  defaultLinkedEntityType: string;
}

const EMPTY_PROJECT_LINKS: ProjectLinksDto = {
  projectId: 0,
  offers: [],
  sales: [],
  serviceOrders: [],
  dispatches: [],
};

const EMPTY_PROJECT_SETTINGS: ProjectSettingsDto = {
  autoLinkConvertedEntities: false,
  requireProjectBeforeConvertingOffer: false,
  defaultTaskStatus: "",
  allowCrossProjectDispatch: false,
  showFinancialDataInProjectTabs: false,
  defaultLinkedEntityType: "",
};

export interface ProjectNoteDto {
  id: number;
  projectId: number;
  content: string;
  createdDate: string;
  createdBy: string;
  modifiedDate?: string;
  modifiedBy?: string;
}

export interface ProjectActivityDto {
  id: number;
  projectId: number;
  actionType: string;
  description: string;
  details?: string;
  createdDate: string;
  createdBy: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
}

export interface ProjectListResponseDto {
  projects: ProjectResponseDto[];
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Request DTOs — matches CreateProjectRequestDto / UpdateProjectRequestDto in ProjectDTOs.cs
export interface CreateProjectRequestDto {
  name: string;
  description?: string;
  contactId?: number;
  teamMembers?: number[];
  status?: string;
  projectKind?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  linkOfferId?: number;
  linkSaleId?: number;
  linkServiceOrderId?: number;
  linkDispatchId?: number;
  createDefaultColumns?: boolean;
}

export interface UpdateProjectRequestDto {
  name?: string;
  description?: string;
  contactId?: number;
  teamMembers?: number[];
  status?: string;
  projectKind?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  linkOfferId?: number;
  linkSaleId?: number;
  linkServiceOrderId?: number;
  linkDispatchId?: number;
}

export interface ProjectSearchRequestDto {
  searchTerm?: string;
  status?: string;
  type?: string;
  priority?: string;
  ownerId?: number;
  contactId?: number;
  teamMemberIds?: number[];
  tags?: string[];
  isArchived?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface AssignTeamMemberDto {
  userId: number;
  userName: string;
}

export interface RemoveTeamMemberDto {
  userId: number;
}

export interface BulkUpdateProjectStatusDto {
  projectIds: number[];
  status: string;
}

// Mappers
const mapProjectResponseToFrontend = (dto: ProjectResponseDto): Project => ({
  id: String(dto.id),
  name: dto.name,
  description: dto.description,
  contactId: dto.contactId ? String(dto.contactId) : undefined,
  contactName: dto.contactName,
  // Backend has no owner concept — use createdBy as display fallback
  ownerId: '',
  ownerName: dto.createdBy || '',
  teamMembers: (dto.teamMembers || []).map(String),
  status: (dto.status || 'active') as Project['status'],
  // Backend stores this as projectKind (free string); treat it as the frontend type
  type: ((dto.projectKind as Project['type']) || 'internal'),
  priority: (dto.priority || 'medium') as Project['priority'],
  budget: dto.budget,
  progress: 0,
  startDate: dto.startDate ? new Date(dto.startDate) : undefined,
  endDate: dto.endDate ? new Date(dto.endDate) : undefined,
  tags: [],
  isArchived: false,
  createdAt: dto.createdDate ? new Date(dto.createdDate) : new Date(),
  updatedAt: dto.modifiedDate ? new Date(dto.modifiedDate) : (dto.createdDate ? new Date(dto.createdDate) : new Date()),
  createdBy: dto.createdBy,
  modifiedBy: dto.modifiedBy,
  columns: (dto.columns || []).map(mapColumnResponseToFrontend),
  stats: undefined,
  settings: dto.settings ? {
    autoLinkConvertedEntities: dto.settings.autoLinkConvertedEntities,
    requireProjectBeforeConvertingOffer: dto.settings.requireProjectBeforeConvertingOffer,
    defaultTaskStatus: dto.settings.defaultTaskStatus,
    allowCrossProjectDispatch: dto.settings.allowCrossProjectDispatch,
    showFinancialDataInProjectTabs: dto.settings.showFinancialDataInProjectTabs,
    defaultLinkedEntityType: dto.settings.defaultLinkedEntityType,
  } : undefined,
});

const mapColumnResponseToFrontend = (dto: ColumnResponseDto): Column => ({
  id: String(dto.id),
  title: dto.title || dto.name || 'Untitled', // Backend uses 'name' instead of 'title'
  color: dto.color || '#64748b',
  position: dto.position ?? dto.displayOrder ?? 0, // Backend uses 'displayOrder' instead of 'position'
  projectId: dto.projectId ? String(dto.projectId) : undefined,
  isDefault: dto.isDefault ?? false,
  taskLimit: dto.limit,
  createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
  taskCount: dto.taskCount,
});

export const projectsApi = {
  // Get all projects with optional filtering and pagination
  async getAll(params?: ProjectSearchRequestDto): Promise<{ projects: Project[]; totalCount: number; pageSize: number; pageNumber: number }> {
    const queryParams = new URLSearchParams();
    
    if (params?.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.ownerId) queryParams.append('ownerId', String(params.ownerId));
    if (params?.contactId) queryParams.append('contactId', String(params.contactId));
    if (params?.isArchived !== undefined) queryParams.append('isArchived', String(params.isArchived));
    if (params?.pageNumber) queryParams.append('pageNumber', String(params.pageNumber));
    if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params?.startDateFrom) queryParams.append('startDateFrom', params.startDateFrom);
    if (params?.startDateTo) queryParams.append('startDateTo', params.startDateTo);
    if (params?.endDateFrom) queryParams.append('endDateFrom', params.endDateFrom);
    if (params?.endDateTo) queryParams.append('endDateTo', params.endDateTo);
    
    if (params?.teamMemberIds) {
      params.teamMemberIds.forEach(id => queryParams.append('teamMemberIds', String(id)));
    }
    if (params?.tags) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }

    const url = queryParams.toString() 
      ? `${API_URL}/api/Projects?${queryParams}` 
      : `${API_URL}/api/Projects`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    // Offline / explicit offline mode: no hydration hit for this exact URL (see hydrationStore loose list fallback).
    if (response.status === 503) {
      const errJson = (await response.json().catch(() => null)) as {
        offline?: boolean;
        cached?: boolean;
        message?: string;
      } | null;
      if (errJson?.offline === true && errJson?.cached === false) {
        return {
          projects: [],
          totalCount: 0,
          pageSize: params?.pageSize ?? 20,
          pageNumber: params?.pageNumber ?? 1,
        };
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch projects' }));
      throw new Error(error.message || 'Failed to fetch projects');
    }

    const data: ProjectListResponseDto = await response.json();
    return {
      projects: data.projects.map(mapProjectResponseToFrontend),
      totalCount: data.totalCount,
      pageSize: data.pageSize,
      pageNumber: data.pageNumber,
    };
  },

  // Get project by ID
  async getById(id: number): Promise<Project> {
    const response = await fetch(`${API_URL}/api/Projects/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return mapProjectResponseToFrontend(projectResponseDtoFromOfflinePlaceholder(id));
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, `Failed to fetch project ${id}`);

    const data: ProjectResponseDto = await response.json();
    return mapProjectResponseToFrontend(data);
  },

  // Create new project
  async create(request: CreateProjectRequestDto): Promise<Project> {
    const response = await fetch(`${API_URL}/api/Projects`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create project' }));
      throw new Error(error.message || 'Failed to create project');
    }

    const data: ProjectResponseDto = await response.json();
    return mapProjectResponseToFrontend(data);
  },

  // Update existing project
  async update(id: number, request: UpdateProjectRequestDto): Promise<Project> {
    const response = await fetch(`${API_URL}/api/Projects/${id}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update project' }));
      throw new Error(error.message || 'Failed to update project');
    }

    const data: ProjectResponseDto = await response.json();
    return mapProjectResponseToFrontend(data);
  },

  // Delete project (soft delete)
  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Projects/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  },

  // Search projects
  async search(searchTerm: string, pageNumber = 1, pageSize = 20): Promise<{ projects: Project[]; totalCount: number }> {
    const queryParams = new URLSearchParams({
      searchTerm,
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });

    const response = await fetch(`${API_URL}/api/Projects/search?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offlineSearch = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineSearch)) {
      return { projects: [], totalCount: 0 };
    }

    await throwIfNotOkAfterOfflineCheck(response, offlineSearch, 'Failed to search projects');

    const data: ProjectListResponseDto = await response.json();
    return {
      projects: data.projects.map(mapProjectResponseToFrontend),
      totalCount: data.totalCount,
    };
  },

  // Get projects by owner — backend has no owner filter, use getAll with pagination
  async getByOwner(_ownerId: number, pageNumber = 1, pageSize = 20): Promise<{ projects: Project[]; totalCount: number }> {
    return projectsApi.getAll({ pageNumber, pageSize });
  },

  // Get projects by contact — ContactId is supported by the backend search
  async getByContact(contactId: number, pageNumber = 1, pageSize = 20): Promise<{ projects: Project[]; totalCount: number }> {
    return projectsApi.getAll({ contactId, pageNumber, pageSize });
  },

  // Get projects by team member — backend has no team-member filter, use getAll with pagination
  async getByTeamMember(_userId: number, pageNumber = 1, pageSize = 20): Promise<{ projects: Project[]; totalCount: number }> {
    return projectsApi.getAll({ pageNumber, pageSize });
  },

  // Assign team member to project
  async assignTeamMember(projectId: number, dto: AssignTeamMemberDto): Promise<void> {
    const response = await fetch(`${API_URL}/api/Projects/${projectId}/team-members`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to assign team member (${response.status})${text ? `: ${text}` : ''}`);
    }

  },

  // Remove team member from project
  async removeTeamMember(projectId: number, dto: RemoveTeamMemberDto): Promise<void> {
    const response = await fetch(`${API_URL}/api/Projects/${projectId}/team-members`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      throw new Error('Failed to remove team member');
    }
  },

  // Get project team members
  async getTeamMembers(projectId: number): Promise<number[]> {
    const response = await fetch(`${API_URL}/api/Projects/${projectId}/team-members`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offlineTm = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineTm)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offlineTm, 'Failed to fetch team members');

    return await response.json();
  },

  // Per-project stats endpoint does not exist in backend — task-based stats are
  // loaded separately via TasksService. Return empty to avoid 404 errors.
  async getStats(_projectId: number): Promise<ProjectStats> {
    return { ...EMPTY_PROJECT_STATS };
  },

  // Bulk update project status — not yet implemented in backend, no-op
  async bulkUpdateStatus(_dto: BulkUpdateProjectStatusDto): Promise<void> {
    // Backend endpoint not yet available; callers catch errors and treat them as warnings.
  },

  // Bulk archive — not yet implemented in backend, no-op
  async bulkArchive(_projectIds: number[], _archive = true): Promise<void> {
    // Backend endpoint not yet available; callers catch errors and treat them as warnings.
  },

  // Project Notes
  async getProjectNotes(projectId: number): Promise<ProjectNoteDto[]> {
    const response = await fetch(`${API_URL}/api/Projects/${projectId}/notes`, {
      headers: getAuthHeaders(),
    });

    const offlineN = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineN)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offlineN, 'Failed to fetch project notes');

    return await response.json();
  },

  async createProjectNote(projectId: number, content: string): Promise<ProjectNoteDto> {
    const response = await fetch(`${API_URL}/api/Projects/${projectId}/notes`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to create project note');
    }

    return await response.json();
  },

  async deleteProjectNote(noteId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Projects/notes/${noteId}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete project note');
    }
  },

  // Project Activity
  async getProjectActivity(projectId: number): Promise<ProjectActivityDto[]> {
    const response = await fetch(`${API_URL}/api/Projects/${projectId}/activity`, {
      headers: getAuthHeaders(),
    });

    const offlineA = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineA)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offlineA, 'Failed to fetch project activity');

    return await response.json();
  },

  async getProjectLinks(projectId: number): Promise<ProjectLinksDto> {
    const response = await fetch(`${API_URL}/api/Projects/${projectId}/links`, {
      headers: getAuthHeaders(),
    });
    const offlineL = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineL)) {
      return { ...EMPTY_PROJECT_LINKS, projectId };
    }
    await throwIfNotOkAfterOfflineCheck(response, offlineL, 'Failed to fetch project links');
    return await response.json();
  },

  async linkEntity(projectId: number, entityType: string, entityId: number): Promise<ProjectLinksDto> {
    const response = await fetch(`${API_URL}/api/Projects/${projectId}/links`, {
      method: "POST",
      headers: getMutationHeaders(),
      body: JSON.stringify({ entityType, entityId }),
    });
    if (!response.ok) throw new Error("Failed to link entity");
    return await response.json();
  },

  async unlinkEntity(projectId: number, entityType: string, entityId: number): Promise<ProjectLinksDto> {
    const response = await fetch(`${API_URL}/api/Projects/${projectId}/links/${entityType}/${entityId}`, {
      method: "DELETE",
      headers: getMutationHeaders(),
    });
    if (!response.ok) throw new Error("Failed to unlink entity");
    return await response.json();
  },

  async getSettings(): Promise<ProjectSettingsDto> {
    const response = await fetch(`${API_URL}/api/Projects/settings`, {
      headers: getAuthHeaders(),
    });
    const offlineS = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offlineS)) {
      return { ...EMPTY_PROJECT_SETTINGS };
    }
    await throwIfNotOkAfterOfflineCheck(response, offlineS, 'Failed to fetch project settings');
    return await response.json();
  },

  async updateSettings(settings: ProjectSettingsDto): Promise<ProjectSettingsDto> {
    const response = await fetch(`${API_URL}/api/Projects/settings`, {
      method: "PUT",
      headers: getMutationHeaders(),
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error("Failed to update project settings");
    return await response.json();
  },
};
