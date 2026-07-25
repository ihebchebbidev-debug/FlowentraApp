// Real API service for User Groups Management
import { API_URL } from '@/config/api';
import { getAuthHeaders, getMutationHeaders } from '@/utils/apiHeaders';
import {
  isOfflineNoCache503,
  parseOfflineNoCacheBody,
} from '@/services/offline/offlineHttpRead';

export interface UserGroup {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UserGroupMember {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
  assignedAt: string;
}

export interface CreateUserGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateUserGroupRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

async function unwrap<T>(response: Response, fallbackMsg: string): Promise<T> {
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: fallbackMsg }));
    throw new Error(err.message || fallbackMsg);
  }
  const result = await response.json();
  return (result.data ?? result) as T;
}

export const userGroupsApi = {
  async getAll(): Promise<UserGroup[]> {
    const response = await fetch(`${API_URL}/api/UserGroups`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) return [];
    return unwrap<UserGroup[]>(response, 'Failed to fetch user groups');
  },

  async getById(id: number): Promise<UserGroup> {
    const response = await fetch(`${API_URL}/api/UserGroups/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return unwrap<UserGroup>(response, 'Failed to fetch user group');
  },

  async create(request: CreateUserGroupRequest): Promise<UserGroup> {
    const response = await fetch(`${API_URL}/api/UserGroups`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });
    return unwrap<UserGroup>(response, 'Failed to create user group');
  },

  async update(id: number, request: UpdateUserGroupRequest): Promise<UserGroup> {
    const response = await fetch(`${API_URL}/api/UserGroups/${id}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });
    return unwrap<UserGroup>(response, 'Failed to update user group');
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/UserGroups/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Failed to delete user group' }));
      throw new Error(err.message || 'Failed to delete user group');
    }
  },

  async getMembers(id: number): Promise<UserGroupMember[]> {
    const response = await fetch(`${API_URL}/api/UserGroups/${id}/members`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) return [];
    return unwrap<UserGroupMember[]>(response, 'Failed to fetch group members');
  },

  async assignUsers(id: number, userIds: number[]): Promise<void> {
    const response = await fetch(`${API_URL}/api/UserGroups/${id}/members`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify({ userIds }),
    });
    if (!response.ok) throw new Error('Failed to assign users to group');
  },

  async removeMember(groupId: number, userId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/UserGroups/${groupId}/members/${userId}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });
    if (!response.ok) throw new Error('Failed to remove user from group');
  },

  async getUserGroups(userId: number): Promise<UserGroup[]> {
    const response = await fetch(`${API_URL}/api/UserGroups/user/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) return [];
    return unwrap<UserGroup[]>(response, 'Failed to fetch user groups');
  },
};

export default userGroupsApi;
