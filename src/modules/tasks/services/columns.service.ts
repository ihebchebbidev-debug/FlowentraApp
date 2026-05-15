// Project Columns Service - Integrated with backend API
import { getAuthHeaders , getMutationHeaders, getMutationHeadersNoContentType} from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';

export interface ProjectColumn {
  id: string;
  projectId: string;
  title: string;
  color: string;
  position: number;
  isDefault: boolean;
  taskLimit?: number;
  createdAt: Date;
  taskCount?: number;
}

export interface CreateColumnRequest {
  title: string;
  color?: string;
  position?: number;
  isDefault?: boolean;
  taskLimit?: number;
}

export interface UpdateColumnRequest {
  title?: string;
  color?: string;
  position?: number;
  isDefault?: boolean;
  taskLimit?: number;
}

const mapColumnResponse = (data: any): ProjectColumn => ({
  id: String(data.id),
  projectId: String(data.projectId),
  title: data.title || data.name,
  color: data.color || '#6366f1',
  position: data.position ?? data.displayOrder ?? 0,
  isDefault: data.isDefault || false,
  taskLimit: data.limit || data.taskLimit,
  createdAt: new Date(data.createdAt),
  taskCount: data.taskCount,
});

export const ProjectColumnsService = {
  async getColumns(projectId: string): Promise<ProjectColumn[]> {
    try {
      const response = await fetch(`${API_URL}/api/Projects/${projectId}/columns`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch columns');
      
      const data = await response.json();
      return (data.data || data || []).map(mapColumnResponse);
    } catch (error) {
      console.error('Failed to fetch columns:', error);
      return [];
    }
  },

  async createColumn(projectId: string, request: CreateColumnRequest): Promise<ProjectColumn | null> {
    try {
      const response = await fetch(`${API_URL}/api/Projects/${projectId}/columns`, {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify({
          name: request.title,
          color: request.color || '#6366f1',
          displayOrder: request.position ?? 0,
          isDefault: request.isDefault || false,
          limit: request.taskLimit,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create column');
      
      const data = await response.json();
      return mapColumnResponse(data.data || data);
    } catch (error) {
      console.error('Failed to create column:', error);
      return null;
    }
  },

  async updateColumn(columnId: string, request: UpdateColumnRequest): Promise<ProjectColumn | null> {
    try {
      const response = await fetch(`${API_URL}/api/ProjectColumns/${columnId}`, {
        method: 'PUT',
        headers: getMutationHeaders(),
        body: JSON.stringify({
          name: request.title,
          color: request.color,
          displayOrder: request.position,
          isDefault: request.isDefault,
          limit: request.taskLimit,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update column');
      
      const data = await response.json();
      return mapColumnResponse(data.data || data);
    } catch (error) {
      console.error('Failed to update column:', error);
      return null;
    }
  },

  async deleteColumn(columnId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/ProjectColumns/${columnId}`, {
        method: 'DELETE',
        headers: getMutationHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to delete column:', error);
      return false;
    }
  },

  async reorderColumns(projectId: string, columnIds: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/Projects/${projectId}/columns/reorder`, {
        method: 'PUT',
        headers: getMutationHeaders(),
        body: JSON.stringify({ columnIds: columnIds.map(id => parseInt(id)) }),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to reorder columns:', error);
      return false;
    }
  },
};
