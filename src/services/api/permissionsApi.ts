import { RolePermission, UpdateRolePermissionsRequest, PermissionModule, PermissionAction, PERMISSION_MODULES } from '@/types/permissions';
import { getAuthHeaders, getMutationHeaders, getMutationHeadersNoContentType } from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';
import {
  isOfflineNoCache503,
  parseOfflineNoCacheBody,
  throwIfNotOkAfterOfflineCheck,
} from '@/services/offline/offlineHttpRead';

// Response types from backend
interface RolePermissionsResponse {
  roleId: number;
  roleName: string;
  permissions: Array<{
    id: number;
    roleId: number;
    module: string;
    action: string;
    granted: boolean;
    createdAt: string;
    updatedAt?: string;
  }>;
}

interface UserPermissionsResponse {
  userId: number;
  permissions: string[]; // Format: "module:action"
}

// Mock data storage for fallback
let mockPermissions: RolePermission[] = [];

export const permissionsApi = {
  // Get all permissions for a specific role
  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    try {
      const response = await fetch(`${API_URL}/api/Permissions/role/${roleId}`, {
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
        'Failed to load role permissions'
      );

      const result = await response.json();
      const data: RolePermissionsResponse = result.data || result;
      
      // Map backend response to frontend type
      return data.permissions.map(p => ({
        id: p.id,
        roleId: p.roleId,
        module: p.module as PermissionModule,
        action: p.action as PermissionAction,
        granted: p.granted,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    } catch (error) {
      console.warn('Error fetching role permissions:', error);
      return mockPermissions.filter(p => p.roleId === roleId);
    }
  },

  // Update permissions for a role (batch update)
  async updateRolePermissions(request: UpdateRolePermissionsRequest): Promise<RolePermission[]> {
    try {
      const response = await fetch(`${API_URL}/api/Permissions/role/${request.roleId}`, {
        method: 'PUT',
        headers: getMutationHeaders(),
        body: JSON.stringify({
          permissions: request.permissions.map(p => ({
            module: p.module,
            action: p.action,
            granted: p.granted,
          })),
        }),
      });

      if (!response.ok) {
        console.warn('Permissions API update failed, using mock data');
        return handleMockUpdate(request);
      }

      const result = await response.json();
      const data: RolePermissionsResponse = result.data || result;
      
      return data.permissions.map(p => ({
        id: p.id,
        roleId: p.roleId,
        module: p.module as PermissionModule,
        action: p.action as PermissionAction,
        granted: p.granted,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    } catch (error) {
      console.warn('Error updating role permissions:', error);
      return handleMockUpdate(request);
    }
  },

  // Set a single permission
  async setPermission(
    roleId: number,
    module: PermissionModule,
    action: PermissionAction,
    granted: boolean
  ): Promise<RolePermission> {
    try {
      const response = await fetch(`${API_URL}/api/Permissions/role/${roleId}/set`, {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify({ module, action, granted }),
      });

      if (!response.ok) {
        console.warn('Permissions API set failed, using mock data');
        return handleMockSetPermission(roleId, module, action, granted);
      }

      const result = await response.json();
      const data = result.data || result;
      
      return {
        id: data.id,
        roleId: data.roleId,
        module: data.module as PermissionModule,
        action: data.action as PermissionAction,
        granted: data.granted,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.warn('Error setting permission:', error);
      return handleMockSetPermission(roleId, module, action, granted);
    }
  },

  // Get current user's permissions (based on userId from auth context)
  async getMyPermissions(userId: number): Promise<string[]> {
    try {
      const response = await fetch(`${API_URL}/api/Permissions/user/${userId}`, {
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
        'Failed to load user permissions'
      );

      const result = await response.json();
      const data: UserPermissionsResponse = result.data || result;
      return data.permissions || [];
    } catch (error) {
      console.warn('Error fetching user permissions:', error);
      return [];
    }
  },

  // Check if user has a specific permission
  async checkPermission(userId: number, module: PermissionModule, action: PermissionAction): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/Permissions/user/${userId}/check`, {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify({ module, action }),
      });

      if (!response.ok) {
        console.warn('Permission check API not available, defaulting to allowed');
        return true;
      }

      const result = await response.json();
      return result.data?.hasPermission ?? true;
    } catch (error) {
      console.warn('Error checking permission:', error);
      return true; // Default to allowed if error
    }
  },

  // Grant all permissions to a role
  async grantAllPermissions(roleId: number): Promise<void> {
    // Derive the full set from the single source of truth (PERMISSION_MODULES)
    // so newly added modules (hr, purchases, dynamic_forms, ai_assistant,
    // external_endpoints, stock_management, …) are never silently omitted.
    const allPermissions: Array<{ module: string; action: string; granted: boolean }> = [];
    for (const mod of PERMISSION_MODULES) {
      for (const action of mod.actions) {
        allPermissions.push({ module: mod.module, action, granted: true });
      }
    }

    try {
      // Try the grant-all endpoint first
      const response = await fetch(`${API_URL}/api/Permissions/role/${roleId}/grant-all`, {
        method: 'POST',
        headers: getMutationHeaders(),
      });

      if (response.ok) {
        return;
      }

      // If grant-all fails, fall back to batch update
      console.log('grant-all endpoint failed, using batch update fallback');
      const batchResponse = await fetch(`${API_URL}/api/Permissions/role/${roleId}`, {
        method: 'PUT',
        headers: getMutationHeaders(),
        body: JSON.stringify({ permissions: allPermissions }),
      });

      if (!batchResponse.ok) {
        throw new Error('Failed to grant all permissions via batch update');
      }
    } catch (error) {
      console.warn('Error granting all permissions:', error);
      throw error;
    }
  },

  // Revoke all permissions from a role
  async revokeAllPermissions(roleId: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/Permissions/role/${roleId}/revoke-all`, {
        method: 'POST',
        headers: getMutationHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke all permissions');
      }
    } catch (error) {
      console.warn('Error revoking all permissions:', error);
      throw error;
    }
  },

  // Grant all permissions for a specific module
  async grantModulePermissions(roleId: number, module: PermissionModule): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/Permissions/role/${roleId}/module/${module}/grant`, {
        method: 'POST',
        headers: getMutationHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to grant ${module} permissions`);
      }
    } catch (error) {
      console.warn(`Error granting ${module} permissions:`, error);
      throw error;
    }
  },

  // Revoke all permissions for a specific module
  async revokeModulePermissions(roleId: number, module: PermissionModule): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/Permissions/role/${roleId}/module/${module}/revoke`, {
        method: 'POST',
        headers: getMutationHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to revoke ${module} permissions`);
      }
    } catch (error) {
      console.warn(`Error revoking ${module} permissions:`, error);
      throw error;
    }
  },
};

// Helper functions for mock data fallback
function handleMockUpdate(request: UpdateRolePermissionsRequest): RolePermission[] {
  mockPermissions = mockPermissions.filter(p => p.roleId !== request.roleId);
  const newPermissions: RolePermission[] = request.permissions.map((p, idx) => ({
    id: Date.now() + idx,
    roleId: request.roleId,
    module: p.module,
    action: p.action,
    granted: p.granted,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  mockPermissions.push(...newPermissions);
  return newPermissions;
}

function handleMockSetPermission(
  roleId: number,
  module: PermissionModule,
  action: PermissionAction,
  granted: boolean
): RolePermission {
  const existing = mockPermissions.find(
    p => p.roleId === roleId && p.module === module && p.action === action
  );
  if (existing) {
    existing.granted = granted;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }
  const newPerm: RolePermission = {
    id: Date.now(),
    roleId,
    module,
    action,
    granted,
    createdAt: new Date().toISOString(),
  };
  mockPermissions.push(newPerm);
  return newPerm;
}

export default permissionsApi;
