/**
 * Projects API Tests
 * CRUD operations for project management
 * Includes multiple project types with various statuses and priorities
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId, formatDate } from '../utils/testUtils';

export const projectsTests: TestDefinition[] = [
  // ============== CREATE PROJECTS ==============
  {
    id: 'projects-create-1',
    name: 'Create Project #1 (Active)',
    category: 'Projects',
    description: 'Create first project - Website Redesign',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      const id = randomId();
      const projectName = `WebsiteRedesign_${id}`;
      const startDate = new Date();
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectName,
          description: 'Complete website redesign with new branding',
          status: 'active',
          priority: 'high',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-project-1'] = data.data?.id || data.id || data.project?.id;
        return { success: true, details: `✓ Project: "${projectName}" | Status: active | Priority: high (ID: ${testDataIds['test-project-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'projects-create-2',
    name: 'Create Project #2 (Planning)',
    category: 'Projects',
    description: 'Create second project - Mobile App',
    dependsOn: ['projects-create-1'],
    test: async () => {
      const id = randomId();
      const projectName = `MobileApp_${id}`;
      const startDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectName,
          description: 'Native mobile application for iOS and Android',
          status: 'planning',
          priority: 'medium',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-project-2'] = data.data?.id || data.id || data.project?.id;
        return { success: true, details: `✓ Project: "${projectName}" | Status: planning | Priority: medium (ID: ${testDataIds['test-project-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'projects-create-3',
    name: 'Create Project #3 (On-Hold)',
    category: 'Projects',
    description: 'Create third project - CRM Integration',
    dependsOn: ['projects-create-2'],
    test: async () => {
      const id = randomId();
      const projectName = `CRMIntegration_${id}`;
      const startDate = new Date();
      const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectName,
          description: 'Integration with third-party CRM system',
          status: 'on-hold',
          priority: 'low',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-project-3'] = data.data?.id || data.id || data.project?.id;
        return { success: true, details: `✓ Project: "${projectName}" | Status: on-hold | Priority: low (ID: ${testDataIds['test-project-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== READ OPERATIONS ==============
  {
    id: 'projects-get-by-id',
    name: 'Get Project by ID',
    category: 'Projects',
    description: 'Retrieve a specific project',
    dependsOn: ['projects-create-3'],
    test: async () => {
      if (!testDataIds['test-project-1']) {
        return { success: false, error: 'No test project ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Projects/${testDataIds['test-project-1']}`);
      if (status === 200 && data) {
        const project = data.data || data;
        return { success: true, details: `✓ Retrieved: "${project.name}" | Status: ${project.status} | Priority: ${project.priority}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'projects-statistics',
    name: 'Get Project Statistics',
    category: 'Projects',
    description: 'Fetch project statistics',
    dependsOn: ['projects-get-by-id'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Projects/statistics');
      if (status === 200) {
        const stats = data.data || data;
        return { success: true, details: `✓ Statistics: Active=${stats.activeCount || 0}, Planning=${stats.planningCount || 0}, OnHold=${stats.onHoldCount || 0}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'projects-search',
    name: 'Search Projects',
    category: 'Projects',
    description: 'Search for projects',
    dependsOn: ['projects-statistics'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Projects/search?searchTerm=test');
      if (status === 200) {
        const projects = data?.projects || data?.data || (Array.isArray(data) ? data : []);
        const count = projects.length || data?.totalCount || 0;
        return { success: true, details: `✓ Search "test" returned ${count} results`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== UPDATE OPERATIONS ==============
  {
    id: 'projects-update',
    name: 'Update Project',
    category: 'Projects',
    description: 'Update project #1',
    dependsOn: ['projects-search'],
    test: async () => {
      if (!testDataIds['test-project-1']) {
        return { success: false, error: 'No test project ID available' };
      }
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Projects/${testDataIds['test-project-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: `UpdatedWebsite_${Date.now()}`,
          status: 'completed',
          priority: 'high',
          description: 'Website redesign completed successfully!',
        }),
      });
      if (status === 200) {
        return { success: true, details: `✓ Updated project: status=completed`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== DELETE OPERATIONS ==============
  {
    id: 'projects-delete-one',
    name: 'Delete One Project',
    category: 'Projects',
    description: 'Delete project #1 (keep #2, #3)',
    dependsOn: ['projects-update'],
    test: async () => {
      if (!testDataIds['test-project-1']) {
        return { success: false, error: 'No test project to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/Projects/${testDataIds['test-project-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-project-1'];
        delete testDataIds['test-project-1'];
        return { success: true, details: `✓ Deleted project ID: ${deletedId}`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== FINAL LIST (ALWAYS LAST BEFORE CLEANUP) ==============
  {
    id: 'projects-list-all',
    name: 'List All Projects (Final)',
    category: 'Projects',
    description: 'Fetch all projects - shows final state before cleanup',
    dependsOn: ['projects-delete-one'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Projects?pageSize=100');
      if (status === 200 && data) {
        const projects = data.projects || data.data || (Array.isArray(data) ? data : []);
        const count = projects.length || data.totalCount || 0;
        const active = projects.filter((p: any) => p.status === 'active').length;
        const planning = projects.filter((p: any) => p.status === 'planning').length;
        const names = projects.slice(0, 5).map((p: any) => p.name).join(', ');
        return { success: true, details: `✓ Found ${count} projects (${active} active, ${planning} planning): [${names}${count > 5 ? '...' : ''}]`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== CLEANUP ==============
  {
    id: 'projects-cleanup',
    name: 'Cleanup All Test Projects',
    category: 'Projects',
    description: 'Delete all remaining test projects',
    dependsOn: ['projects-list-all'],
    test: async () => {
      let cleaned = 0;
      let lastRequestData: any, lastResponseData: any;
      
      for (const key of ['test-project-2', 'test-project-3']) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/Projects/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) cleaned++;
          delete testDataIds[key];
        }
      }
      return { success: true, details: `✓ Cleaned up ${cleaned} remaining projects`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
    },
  },
];
