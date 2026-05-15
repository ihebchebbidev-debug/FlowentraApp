/**
 * Users API Tests
 * CRUD operations for user management
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const usersTests: TestDefinition[] = [
  {
    id: 'users-create-1',
    name: 'Create User #1',
    category: 'Users',
    description: 'Create first test user',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      const id = randomId();
      const firstName = 'Alex';
      const lastName = 'Johnson';
      const testEmail = `apitest_${id}_${Date.now()}@test.flowservice.com`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Users', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: `Test${id}Pass123!@#`,
          firstName,
          lastName,
          phoneNumber: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          country: 'US',
          industry: 'Technology',
          companyName: `${firstName} Tech Corp`,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-user-1'] = data.data?.id || data.id || data.user?.id;
        return { success: true, details: `✓ User: "${firstName} ${lastName}" | Email: ${testEmail} (ID: ${testDataIds['test-user-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'users-create-2',
    name: 'Create User #2',
    category: 'Users',
    description: 'Create second test user',
    dependsOn: ['users-create-1'],
    test: async () => {
      const id = randomId();
      const firstName = 'Sarah';
      const lastName = 'Miller';
      const testEmail = `apitest_${id}_${Date.now()}@test.flowservice.com`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Users', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: `Test${id}Pass123!@#`,
          firstName,
          lastName,
          phoneNumber: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          country: 'CA',
          industry: 'Healthcare',
          companyName: `${firstName} Health Inc`,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-user-2'] = data.data?.id || data.id || data.user?.id;
        return { success: true, details: `✓ User: "${firstName} ${lastName}" | Email: ${testEmail} (ID: ${testDataIds['test-user-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'users-create-3',
    name: 'Create User #3',
    category: 'Users',
    description: 'Create third test user',
    dependsOn: ['users-create-2'],
    test: async () => {
      const id = randomId();
      const firstName = 'Michael';
      const lastName = 'Chen';
      const testEmail = `apitest_${id}_${Date.now()}@test.flowservice.com`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Users', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: `Test${id}Pass123!@#`,
          firstName,
          lastName,
          phoneNumber: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          country: 'GB',
          industry: 'Finance',
          companyName: `${firstName} Finance Ltd`,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-user-3'] = data.data?.id || data.id || data.user?.id;
        return { success: true, details: `✓ User: "${firstName} ${lastName}" | Email: ${testEmail} (ID: ${testDataIds['test-user-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'users-list',
    name: 'List All Users',
    category: 'Users',
    description: 'Fetch all users from the system',
    dependsOn: ['users-create-3'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Users');
      if (status === 200 && data) {
        let users: any[] = [];
        if (Array.isArray(data)) {
          users = data;
        } else if (Array.isArray(data.users)) {
          users = data.users;
        } else if (Array.isArray(data.data)) {
          users = data.data;
        } else if (data.items && Array.isArray(data.items)) {
          users = data.items;
        }
        const count = users.length || data.totalCount || 0;
        const names = users.length > 0 
          ? users.slice(0, 3).map((u: any) => `${u.firstName || ''} ${u.lastName || ''}`.trim()).join(', ')
          : 'none';
        return { success: true, details: `✓ Found ${count} users: [${names}${count > 3 ? '...' : ''}]`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'users-get-by-id',
    name: 'Get User by ID',
    category: 'Users',
    description: 'Retrieve a specific user by their ID',
    dependsOn: ['users-list'],
    test: async () => {
      if (!testDataIds['test-user-1']) {
        return { success: false, error: 'No test user ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Users/${testDataIds['test-user-1']}`);
      if (status === 200 && data) {
        const user = data.data || data;
        return { success: true, details: `✓ Retrieved: "${user.firstName} ${user.lastName}" | Company: ${user.companyName || 'N/A'}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'users-update',
    name: 'Update User',
    category: 'Users',
    description: 'Update test user information',
    dependsOn: ['users-get-by-id'],
    test: async () => {
      if (!testDataIds['test-user-1']) {
        return { success: false, error: 'No test user ID available' };
      }
      const newCompany = 'Updated Global Tech';
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Users/${testDataIds['test-user-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: 'UpdatedAlex',
          lastName: 'UpdatedJohnson',
          companyName: newCompany,
        }),
      });
      if (status === 200) {
        return { success: true, details: `✓ Updated user: "UpdatedAlex UpdatedJohnson" | Company: "${newCompany}"`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'users-delete',
    name: 'Delete One User',
    category: 'Users',
    description: 'Delete user #1 (keep others)',
    dependsOn: ['users-update'],
    test: async () => {
      if (!testDataIds['test-user-1']) {
        return { success: false, error: 'No test user to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/Users/${testDataIds['test-user-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-user-1'];
        delete testDataIds['test-user-1'];
        return { success: true, details: `✓ Deleted user ID: ${deletedId} (kept users #2, #3)`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'users-cleanup',
    name: 'Cleanup Remaining Users',
    category: 'Users',
    description: 'Delete remaining test users',
    dependsOn: ['users-delete'],
    test: async () => {
      let cleaned = 0;
      let lastRequestData: any, lastResponseData: any;
      for (const key of ['test-user-2', 'test-user-3']) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/Users/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) cleaned++;
          delete testDataIds[key];
        }
      }
      return { success: true, details: `✓ Cleaned up ${cleaned} remaining users`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
    },
  },
];
