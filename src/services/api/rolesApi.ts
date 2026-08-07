// Real API service for Roles Management
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
} from '@/types/users';
import { getAuthHeaders, getMutationHeaders, getMutationHeadersNoContentType } from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';
import { getOfflineDetailPlaceholder } from '@/services/offline/offlineDetailPlaceholders';
import {
  isOfflineNoCache503,
  parseOfflineNoCacheBody,
  throwIfNotOkAfterOfflineCheck,
} from '@/services/offline/offlineHttpRead';

function roleFromOfflinePlaceholder(id: number): Role {
  const ph = (getOfflineDetailPlaceholder(`/api/Roles/${id}`) as Partial<Role>) || {};
  return {
    id: ph.id ?? id,
    name: ph.name ?? '',
    description: ph.description,
    createdAt: ph.createdAt ?? '1970-01-01T00:00:00.000Z',
    updatedAt: ph.updatedAt,
    isActive: ph.isActive ?? true,
    userCount: ph.userCount ?? 0,
  };
}

export type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
};

export const rolesApi = {
  async getAll(): Promise<Role[]> {
    const response = await fetch(`${API_URL}/api/Roles`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch roles' }));
      throw new Error(error.message || 'Failed to fetch roles');
    }

    const result = await response.json();
    return result.data || result;
  },

  async getById(id: number): Promise<Role> {
    const response = await fetch(`${API_URL}/api/Roles/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return roleFromOfflinePlaceholder(id);
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch role');

    const result = await response.json();
    return result.data || result;
  },

  async create(request: CreateRoleRequest): Promise<Role> {
    const response = await fetch(`${API_URL}/api/Roles`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create role' }));
      throw new Error(error.message || 'Failed to create role');
    }

    const result = await response.json();
    return result.data || result;
  },

  async update(id: number, request: UpdateRoleRequest): Promise<Role> {
    const response = await fetch(`${API_URL}/api/Roles/${id}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update role' }));
      throw new Error(error.message || 'Failed to update role');
    }

    const result = await response.json();
    return result.data || result;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Roles/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete role' }));
      throw new Error(error.message || 'Failed to delete role');
    }
  },

  async assignToUser(roleId: number, userId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Roles/${roleId}/assign/${userId}`, {
      method: 'POST',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to assign role to user');
    }
  },

  async removeFromUser(roleId: number, userId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Roles/${roleId}/remove/${userId}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to remove role from user');
    }
  },

  async getUserRoles(userId: number): Promise<Role[]> {
    const response = await fetch(`${API_URL}/api/Roles/user/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }

    if (!response.ok) {
      throw new Error('Failed to fetch user roles');
    }

    const result = await response.json();
    return result.data || result;
  },
};

export default rolesApi;
