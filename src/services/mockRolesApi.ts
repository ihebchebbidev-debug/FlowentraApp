// Mock roles API - frontend only, no real API calls
import rolesData from '@/data/mock/roles.json';

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions?: string[];
  level?: number;
  isActive?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
  level?: number;
  isActive?: boolean;
}

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

let mockRoles: Role[] = (rolesData as any[]).map(role => ({
  ...role,
  id: parseInt(role.id.replace('role-', '')) || Math.floor(Math.random() * 1000)
}));

export const rolesApi = {
  async getAllRoles(): Promise<{ success: boolean; data?: Role[]; message?: string }> {
    await delay();
    const rolesWithUserCount = mockRoles.map(role => ({
      ...role,
      userCount: Math.floor(Math.random() * 10) + 1
    }));
    return { success: true, data: rolesWithUserCount };
  },

  async getRoleById(id: number): Promise<{ success: boolean; data?: Role; message?: string }> {
    await delay();
    const role = mockRoles.find(r => r.id === id);
    if (!role) {
      return { success: false, message: 'Role not found' };
    }
    return { success: true, data: role };
  },

  async createRole(roleData: CreateRoleRequest): Promise<{ success: boolean; data?: Role; message?: string }> {
    await delay();
    const newRole: Role = {
      id: Math.max(...mockRoles.map(r => r.id)) + 1,
      ...roleData,
      permissions: roleData.permissions || [],
      level: roleData.level || 1,
      isActive: roleData.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockRoles.push(newRole);
    return { success: true, data: newRole };
  },

  async updateRole(id: number, updates: Partial<Role>): Promise<{ success: boolean; data?: Role; message?: string }> {
    await delay();
    const index = mockRoles.findIndex(r => r.id === id);
    if (index === -1) {
      return { success: false, message: 'Role not found' };
    }
    
    mockRoles[index] = {
      ...mockRoles[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return { success: true, data: mockRoles[index] };
  },

  async deleteRole(id: number): Promise<{ success: boolean; message?: string }> {
    await delay();
    const index = mockRoles.findIndex(r => r.id === id);
    if (index === -1) return { success: false, message: 'Role not found' };
    mockRoles.splice(index, 1);
    return { success: true };
  },

  async getUserRoles(userId: number): Promise<Role[]> {
    await delay();
    // Return random roles for the user
    const userRoles = mockRoles.slice(0, Math.floor(Math.random() * 3) + 1);
    return userRoles;
  },

  async assignRoleToUser(userId: number, roleId: number): Promise<{ success: boolean }> {
    await delay();
    return { success: true };
  },

  async removeRoleFromUser(userId: number, roleId: number): Promise<{ success: boolean }> {
    await delay();
    return { success: true };
  }
};

export default rolesApi;