/**
 * Roles API Tests
 * CRUD operations for role management
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const rolesTests: TestDefinition[] = [
  {
    id: 'roles-create-1',
    name: 'Create Role #1 (Admin)',
    category: 'Roles',
    description: 'Create Admin role',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      const id = randomId();
      const roleName = `Admin_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Roles', {
        method: 'POST',
        body: JSON.stringify({
          name: roleName,
          description: 'Full system access - manages users, settings, and all modules',
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-role-1'] = data.data?.id || data.id || data.role?.id;
        return { success: true, details: `✓ Role: "${roleName}" | Access: Full System (ID: ${testDataIds['test-role-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'roles-create-2',
    name: 'Create Role #2 (Technician)',
    category: 'Roles',
    description: 'Create Technician role',
    dependsOn: ['roles-create-1'],
    test: async () => {
      const id = randomId();
      const roleName = `Technician_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Roles', {
        method: 'POST',
        body: JSON.stringify({
          name: roleName,
          description: 'Field service technician - handles installations and repairs',
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-role-2'] = data.data?.id || data.id || data.role?.id;
        return { success: true, details: `✓ Role: "${roleName}" | Access: Field Service (ID: ${testDataIds['test-role-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'roles-create-3',
    name: 'Create Role #3 (Dispatcher)',
    category: 'Roles',
    description: 'Create Dispatcher role',
    dependsOn: ['roles-create-2'],
    test: async () => {
      const id = randomId();
      const roleName = `Dispatcher_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Roles', {
        method: 'POST',
        body: JSON.stringify({
          name: roleName,
          description: 'Schedules and coordinates field technicians',
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-role-3'] = data.data?.id || data.id || data.role?.id;
        return { success: true, details: `✓ Role: "${roleName}" | Access: Scheduling (ID: ${testDataIds['test-role-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'roles-list',
    name: 'List All Roles',
    category: 'Roles',
    description: 'Fetch all roles from the system',
    dependsOn: ['roles-create-3'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Roles');
      if (status === 200 && data) {
        let roles: any[] = [];
        if (Array.isArray(data)) roles = data;
        else if (Array.isArray(data.roles)) roles = data.roles;
        else if (Array.isArray(data.data)) roles = data.data;
        else if (data.items) roles = data.items;
        
        const count = roles.length || data.totalCount || 0;
        const names = roles.length > 0 ? roles.slice(0, 3).map((r: any) => r.name).join(', ') : 'none';
        return { success: true, details: `✓ Found ${count} roles: [${names}${count > 3 ? '...' : ''}]`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'roles-get-by-id',
    name: 'Get Role by ID',
    category: 'Roles',
    description: 'Retrieve a specific role',
    dependsOn: ['roles-list'],
    test: async () => {
      if (!testDataIds['test-role-1']) {
        return { success: false, error: 'No test role ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Roles/${testDataIds['test-role-1']}`);
      if (status === 200 && data) {
        const role = data.data || data;
        const roleName = role.name || 'Unknown';
        const roleDesc = role.description || 'No description';
        return { success: true, details: `✓ Retrieved: "${roleName}" | Description: ${roleDesc.substring(0, 40)}...`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'roles-update',
    name: 'Update Role',
    category: 'Roles',
    description: 'Update the first test role',
    dependsOn: ['roles-get-by-id'],
    test: async () => {
      if (!testDataIds['test-role-1']) {
        return { success: false, error: 'No test role ID available' };
      }
      const newName = `SuperAdmin_${Date.now()}`;
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Roles/${testDataIds['test-role-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: newName,
          description: 'Updated: Super Administrator with elevated privileges',
        }),
      });
      if (status === 200) {
        return { success: true, details: `✓ Updated role to: "${newName}"`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'roles-delete',
    name: 'Delete One Role',
    category: 'Roles',
    description: 'Delete role #1 (keep others)',
    dependsOn: ['roles-update'],
    test: async () => {
      if (!testDataIds['test-role-1']) {
        return { success: false, error: 'No test role to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/Roles/${testDataIds['test-role-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-role-1'];
        delete testDataIds['test-role-1'];
        return { success: true, details: `✓ Deleted role ID: ${deletedId} (kept roles #2, #3)`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'roles-cleanup',
    name: 'Cleanup Remaining Roles',
    category: 'Roles',
    description: 'Delete remaining test roles',
    dependsOn: ['roles-delete'],
    test: async () => {
      let cleaned = 0;
      let lastRequestData: any, lastResponseData: any;
      for (const key of ['test-role-2', 'test-role-3']) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/Roles/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) cleaned++;
          delete testDataIds[key];
        }
      }
      return { success: true, details: `✓ Cleaned up ${cleaned} remaining roles`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
    },
  },
];
