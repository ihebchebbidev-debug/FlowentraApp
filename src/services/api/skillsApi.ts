// Real API service for Skills Management
import type {
  Skill,
  CreateSkillRequest,
  UpdateSkillRequest,
  UserSkill,
  AssignSkillToUserRequest,
  AssignSkillToRoleRequest,
} from '@/types/users';
import { getAuthHeaders, getMutationHeaders, getMutationHeadersNoContentType } from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';
import {
  isOfflineNoCache503,
  parseOfflineNoCacheBody,
  throwIfNotOkAfterOfflineCheck,
} from '@/services/offline/offlineHttpRead';

export type {
  Skill,
  CreateSkillRequest,
  UpdateSkillRequest,
  UserSkill,
  AssignSkillToUserRequest,
  AssignSkillToRoleRequest,
};

export const skillsApi = {
  async getAll(): Promise<Skill[]> {
    const response = await fetch(`${API_URL}/api/Skills`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) return [];

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch skills');

    const result = await response.json();
    return result.data || result;
  },

  async getById(id: number): Promise<Skill> {
    const response = await fetch(`${API_URL}/api/Skills/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return {
        id,
        name: '',
        description: '',
        category: '',
        level: '',
        createdAt: '1970-01-01T00:00:00.000Z',
        isActive: true,
        userCount: 0,
      };
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch skill');

    const result = await response.json();
    return result.data || result;
  },

  async getByCategory(category: string): Promise<Skill[]> {
    const response = await fetch(`${API_URL}/api/Skills/category/${encodeURIComponent(category)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) return [];

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch skills by category');

    const result = await response.json();
    return result.data || result;
  },

  async create(request: CreateSkillRequest): Promise<Skill> {
    const response = await fetch(`${API_URL}/api/Skills`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create skill' }));
      throw new Error(error.message || 'Failed to create skill');
    }

    const result = await response.json();
    return result.data || result;
  },

  async update(id: number, request: UpdateSkillRequest): Promise<Skill> {
    const response = await fetch(`${API_URL}/api/Skills/${id}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update skill' }));
      throw new Error(error.message || 'Failed to update skill');
    }

    const result = await response.json();
    return result.data || result;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Skills/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete skill' }));
      throw new Error(error.message || 'Failed to delete skill');
    }
  },

  async assignToUser(skillId: number, userId: number, request?: AssignSkillToUserRequest): Promise<void> {
    const response = await fetch(`${API_URL}/api/Skills/${skillId}/assign/${userId}`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request || {}),
    });

    if (!response.ok) {
      throw new Error('Failed to assign skill to user');
    }
  },

  async removeFromUser(skillId: number, userId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Skills/${skillId}/remove/${userId}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to remove skill from user');
    }
  },

  async getUserSkills(userId: number): Promise<UserSkill[]> {
    const response = await fetch(`${API_URL}/api/Skills/user/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) return [];

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch user skills');

    const result = await response.json();
    return result.data || result;
  },

  async assignToRole(roleId: number, skillId: number, request?: AssignSkillToRoleRequest): Promise<void> {
    const response = await fetch(`${API_URL}/api/Skills/role/${roleId}/assign/${skillId}`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request || {}),
    });

    if (!response.ok) {
      throw new Error('Failed to assign skill to role');
    }
  },

  async removeFromRole(roleId: number, skillId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/Skills/role/${roleId}/remove/${skillId}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to remove skill from role');
    }
  },

  async getRoleSkills(roleId: number): Promise<Skill[]> {
    const response = await fetch(`${API_URL}/api/Skills/role/${roleId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) return [];

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch role skills');

    const result = await response.json();
    return result.data || result;
  },
};

export default skillsApi;
