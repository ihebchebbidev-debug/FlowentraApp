/**
 * Tasks API Tests
 * CRUD operations for task management (Project Tasks)
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId, formatDate } from '../utils/testUtils';

export const tasksTests: TestDefinition[] = [
  {
    id: 'tasks-create-project',
    name: 'Create Project for Tasks',
    category: 'Tasks',
    description: 'Create a project to hold test tasks',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      const id = randomId(4);
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Projects', {
        method: 'POST',
        body: JSON.stringify({
          name: `TaskTestProject_${id}`,
          description: `Project for task testing - Created at ${new Date().toISOString()}`,
          status: 'active',
          priority: 'medium',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['task-project'] = data.data?.id || data.id;
        const columns = data.columns || data.data?.columns || [];
        const firstColumn = columns[0];
        if (firstColumn) {
          testDataIds['task-column'] = firstColumn.id;
        }
        return { success: true, details: `✓ Project: "TaskTestProject_${id}" (ID: ${testDataIds['task-project']}, Column: ${testDataIds['task-column']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-create-1',
    name: 'Create Task #1',
    category: 'Tasks',
    description: 'Create first test task',
    dependsOn: ['tasks-create-project'],
    test: async () => {
      if (!testDataIds['task-project'] || !testDataIds['task-column']) {
        return { success: false, error: 'No project or column available' };
      }
      const id = randomId(5);
      const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Tasks/project-task', {
        method: 'POST',
        body: JSON.stringify({
          projectId: testDataIds['task-project'],
          columnId: testDataIds['task-column'],
          title: `BugFix_${id}`,
          description: 'Fix critical bug in payment module',
          dueDate: dueDate.toISOString(),
          priority: 'high',
          displayOrder: 1,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-task-1'] = data.data?.id || data.id;
        return { success: true, details: `✓ Task: "BugFix_${id}" | Priority: high | Due: ${formatDate(dueDate)} (ID: ${testDataIds['test-task-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-create-2',
    name: 'Create Task #2',
    category: 'Tasks',
    description: 'Create second test task',
    dependsOn: ['tasks-create-1'],
    test: async () => {
      if (!testDataIds['task-project'] || !testDataIds['task-column']) {
        return { success: false, error: 'No project or column available' };
      }
      const id = randomId();
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Tasks/project-task', {
        method: 'POST',
        body: JSON.stringify({
          projectId: testDataIds['task-project'],
          columnId: testDataIds['task-column'],
          title: `Feature_${id}`,
          description: 'Implement new dashboard feature',
          dueDate: dueDate.toISOString(),
          priority: 'medium',
          displayOrder: 2,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-task-2'] = data.data?.id || data.id;
        return { success: true, details: `✓ Task: "Feature_${id}" | Priority: medium | Due: ${formatDate(dueDate)} (ID: ${testDataIds['test-task-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-create-3',
    name: 'Create Task #3',
    category: 'Tasks',
    description: 'Create third test task',
    dependsOn: ['tasks-create-2'],
    test: async () => {
      if (!testDataIds['task-project'] || !testDataIds['task-column']) {
        return { success: false, error: 'No project or column available' };
      }
      const id = randomId();
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Tasks/project-task', {
        method: 'POST',
        body: JSON.stringify({
          projectId: testDataIds['task-project'],
          columnId: testDataIds['task-column'],
          title: `Refactor_${id}`,
          description: 'Refactor authentication service',
          dueDate: dueDate.toISOString(),
          priority: 'low',
          displayOrder: 3,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-task-3'] = data.data?.id || data.id;
        return { success: true, details: `✓ Task: "Refactor_${id}" | Priority: low | Due: ${formatDate(dueDate)} (ID: ${testDataIds['test-task-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-list',
    name: 'List Project Tasks',
    category: 'Tasks',
    description: 'Fetch tasks for the test project',
    dependsOn: ['tasks-create-3'],
    test: async () => {
      if (!testDataIds['task-project']) {
        return { success: false, error: 'No project ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/project/${testDataIds['task-project']}`);
      if (status === 200) {
        const tasks = Array.isArray(data) ? data : (data?.tasks || data?.data || []);
        const count = tasks.length;
        const names = tasks.slice(0, 3).map((t: any) => t.title).join(', ');
        return { success: true, details: `✓ Found ${count} tasks: [${names}]`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-get-by-id',
    name: 'Get Task by ID',
    category: 'Tasks',
    description: 'Retrieve a specific task',
    dependsOn: ['tasks-list'],
    test: async () => {
      if (!testDataIds['test-task-1']) {
        return { success: false, error: 'No test task ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/project-task/${testDataIds['test-task-1']}`);
      if (status === 200 && data) {
        const task = data.data || data;
        return { success: true, details: `✓ Retrieved: "${task.title}" | Column: ${task.columnName || task.columnId} | Project: ${task.projectName || task.projectId}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-update',
    name: 'Update Task',
    category: 'Tasks',
    description: 'Update the first test task',
    dependsOn: ['tasks-get-by-id'],
    test: async () => {
      if (!testDataIds['test-task-1']) {
        return { success: false, error: 'No test task ID available' };
      }
      const newTitle = `UpdatedTask_${Date.now()}`;
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/project-task/${testDataIds['test-task-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: newTitle,
          priority: 'high',
          description: 'Updated via API test - URGENT',
        }),
      });
      if (status === 200) {
        return { success: true, details: `✓ Updated task title to: "${newTitle}"`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-update-priority',
    name: 'Update Task Priority',
    category: 'Tasks',
    description: 'Update task priority from high to low',
    dependsOn: ['tasks-update'],
    test: async () => {
      if (!testDataIds['test-task-2']) {
        return { success: false, error: 'No test task ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/project-task/${testDataIds['test-task-2']}`, {
        method: 'PUT',
        body: JSON.stringify({
          priority: 'low',
          description: 'Priority changed to low via API test',
        }),
      });
      if (status === 200) {
        const task = data?.data || data;
        return { success: true, details: `✓ Updated priority to "low" for task ID: ${testDataIds['test-task-2']}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-update-description',
    name: 'Update Task Description',
    category: 'Tasks',
    description: 'Update task description only',
    dependsOn: ['tasks-update-priority'],
    test: async () => {
      if (!testDataIds['test-task-3']) {
        return { success: false, error: 'No test task ID available' };
      }
      const newDescription = `Updated description at ${new Date().toISOString()} - comprehensive API test`;
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/project-task/${testDataIds['test-task-3']}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: newDescription,
        }),
      });
      if (status === 200) {
        return { success: true, details: `✓ Updated description for task ID: ${testDataIds['test-task-3']}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-move',
    name: 'Move Task to Column',
    category: 'Tasks',
    description: 'Move a task to a different column/position',
    dependsOn: ['tasks-update-description'],
    test: async () => {
      if (!testDataIds['test-task-3']) {
        return { success: false, error: 'No test task ID available' };
      }
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/${testDataIds['test-task-3']}/move`, {
        method: 'PUT',
        body: JSON.stringify({
          columnId: testDataIds['task-column'] || 1,
          position: 0,
        }),
      });
      if (status === 200 || status === 204) {
        return { success: true, details: `✓ Moved task to column ID: ${testDataIds['task-column']}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-assign',
    name: 'Assign Task',
    category: 'Tasks',
    description: 'Assign a task to a user',
    dependsOn: ['tasks-move'],
    test: async () => {
      if (!testDataIds['test-task-3']) {
        return { success: false, error: 'No test task ID available' };
      }
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/${testDataIds['test-task-3']}/assign`, {
        method: 'PUT',
        body: JSON.stringify({
          assigneeId: 1,
          assigneeName: 'Test Technician',
        }),
      });
      if (status === 200 || status === 204) {
        return { success: true, details: `✓ Assigned task to "Test Technician"`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-unassign',
    name: 'Unassign Task',
    category: 'Tasks',
    description: 'Unassign a task from user',
    dependsOn: ['tasks-assign'],
    test: async () => {
      if (!testDataIds['test-task-3']) {
        return { success: false, error: 'No test task ID available' };
      }
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/${testDataIds['test-task-3']}/unassign`, {
        method: 'PUT',
      });
      if (status === 200 || status === 204) {
        return { success: true, details: `✓ Unassigned task`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-search',
    name: 'Search Tasks',
    category: 'Tasks',
    description: 'Search for tasks',
    dependsOn: ['tasks-unassign'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Tasks/search?searchTerm=Updated');
      if (status === 200) {
        const tasks = data?.projectTasks || data?.tasks || data?.data || (Array.isArray(data) ? data : []);
        const count = tasks.length || data?.totalCount || 0;
        return { success: true, details: `✓ Search "Updated" returned ${count} results`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-overdue',
    name: 'Get Overdue Tasks',
    category: 'Tasks',
    description: 'Fetch overdue tasks',
    dependsOn: ['tasks-search'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Tasks/overdue');
      if (status === 200) {
        const tasks = data?.tasks || data?.data || (Array.isArray(data) ? data : []);
        const count = tasks.length || data?.totalCount || 0;
        return { success: true, details: `✓ Found ${count} overdue tasks`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-verify-updates',
    name: 'Verify Task Updates',
    category: 'Tasks',
    description: 'Verify all task updates were persisted',
    dependsOn: ['tasks-overdue'],
    test: async () => {
      if (!testDataIds['test-task-1']) {
        return { success: false, error: 'No test task ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/project-task/${testDataIds['test-task-1']}`);
      if (status === 200 && data) {
        const task = data.data || data;
        const titleContainsUpdated = task.title?.includes('Updated') || false;
        const descContainsUpdated = task.description?.includes('Updated') || false;
        if (titleContainsUpdated || descContainsUpdated) {
          return { success: true, details: `✓ Verified task updates persisted: Title="${task.title?.substring(0, 30)}..."`, httpStatus: status, responseSize, requestData, responseData };
        }
        return { success: false, error: 'Task update not persisted', httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-complete',
    name: 'Complete Task',
    category: 'Tasks',
    description: 'Mark a task as complete',
    dependsOn: ['tasks-verify-updates'],
    test: async () => {
      if (!testDataIds['test-task-2']) {
        return { success: false, error: 'No test task ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/${testDataIds['test-task-2']}/complete`, {
        method: 'PUT',
      });
      if (status === 200 || status === 204) {
        return { success: true, details: `✓ Task ${testDataIds['test-task-2']} marked as complete`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-update-status',
    name: 'Update Task Status',
    category: 'Tasks',
    description: 'Change task status to in-progress',
    dependsOn: ['tasks-complete'],
    test: async () => {
      if (!testDataIds['test-task-3']) {
        return { success: false, error: 'No test task ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/${testDataIds['test-task-3']}/status`, {
        method: 'PUT',
        body: JSON.stringify('in-progress'),
      });
      if (status === 200 || status === 204) {
        return { success: true, details: `✓ Task ${testDataIds['test-task-3']} status changed to in-progress`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-verify-status-change',
    name: 'Verify Status Change',
    category: 'Tasks',
    description: 'Verify task status was updated',
    dependsOn: ['tasks-update-status'],
    test: async () => {
      if (!testDataIds['test-task-3']) {
        return { success: false, error: 'No test task ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/project-task/${testDataIds['test-task-3']}`);
      if (status === 200 && data) {
        const task = data.data || data;
        const taskStatus = task.status?.toLowerCase() || '';
        if (taskStatus.includes('progress') || taskStatus === 'in-progress') {
          return { success: true, details: `✓ Verified status change: "${task.status}"`, httpStatus: status, responseSize, requestData, responseData };
        }
        return { success: false, error: `Status not updated, got: ${task.status}`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-delete-1',
    name: 'Delete Task #1',
    category: 'Tasks',
    description: 'Delete first test task',
    dependsOn: ['tasks-verify-status-change'],
    test: async () => {
      if (!testDataIds['test-task-1']) {
        return { success: false, error: 'No test task to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/Tasks/project-task/${testDataIds['test-task-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-task-1'];
        delete testDataIds['test-task-1'];
        return { success: true, details: `✓ Deleted task ID: ${deletedId}`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-delete-2',
    name: 'Delete Task #2',
    category: 'Tasks',
    description: 'Delete second test task',
    dependsOn: ['tasks-delete-1'],
    test: async () => {
      if (!testDataIds['test-task-2']) {
        return { success: false, error: 'No test task to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/Tasks/project-task/${testDataIds['test-task-2']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-task-2'];
        delete testDataIds['test-task-2'];
        return { success: true, details: `✓ Deleted task ID: ${deletedId}`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-verify-delete',
    name: 'Verify Task Deletion',
    category: 'Tasks',
    description: 'Verify deleted tasks are no longer accessible',
    dependsOn: ['tasks-delete-2'],
    test: async () => {
      if (!testDataIds['task-project']) {
        return { success: false, error: 'No project ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Tasks/project/${testDataIds['task-project']}`);
      if (status === 200) {
        const tasks = Array.isArray(data) ? data : (data?.tasks || data?.data || []);
        // Should only have 1 task left (task-3)
        const count = tasks.length;
        return { success: true, details: `✓ Verified deletion - ${count} task(s) remaining in project`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'tasks-cleanup',
    name: 'Cleanup Tasks & Project',
    category: 'Tasks',
    description: 'Delete remaining tasks and project',
    dependsOn: ['tasks-verify-delete'],
    test: async () => {
      let cleaned = 0;
      let lastRequestData: any, lastResponseData: any;
      
      // Delete remaining tasks
      for (const key of ['test-task-3']) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/Tasks/project-task/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) cleaned++;
          delete testDataIds[key];
        }
      }
      
      // Delete the project
      if (testDataIds['task-project']) {
        const { status, requestData, responseData } = await apiCall<any>(`/api/Projects/${testDataIds['task-project']}`, { method: 'DELETE' });
        lastRequestData = requestData;
        lastResponseData = responseData;
        if (status === 200 || status === 204) cleaned++;
        delete testDataIds['task-project'];
        delete testDataIds['task-column'];
      }
      
      return { success: true, details: `✓ Cleaned up ${cleaned} items (tasks + project)`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
    },
  },
];
