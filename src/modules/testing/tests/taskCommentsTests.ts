/**
 * Task Comments API Tests
 * CRUD operations for task comment management
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const taskCommentsTests: TestDefinition[] = [
  {
    id: 'task-comments-create-project',
    name: 'Create Project for Comments Test',
    category: 'Task Comments',
    description: 'Create a project to hold test tasks for comments',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      const id = randomId(4);
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Projects', {
        method: 'POST',
        body: JSON.stringify({
          name: `CommentsTestProject_${id}`,
          description: `Project for comment testing - Created at ${new Date().toISOString()}`,
          status: 'active',
          priority: 'medium',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['comments-project'] = data.data?.id || data.id;
        const columns = data.columns || data.data?.columns || [];
        testDataIds['comments-column'] = columns[0]?.id;
        return { success: true, details: `✓ Project: "CommentsTestProject_${id}" (ID: ${testDataIds['comments-project']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'task-comments-create-task',
    name: 'Create Task for Comments',
    category: 'Task Comments',
    description: 'Create a task to add comments to',
    dependsOn: ['task-comments-create-project'],
    test: async () => {
      if (!testDataIds['comments-project'] || !testDataIds['comments-column']) {
        return { success: false, error: 'No project or column available' };
      }
      const id = randomId(5);
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Tasks/project-task', {
        method: 'POST',
        body: JSON.stringify({
          projectId: testDataIds['comments-project'],
          columnId: testDataIds['comments-column'],
          title: `TaskForComments_${id}`,
          description: 'Task to test comments functionality',
          priority: 'medium',
          displayOrder: 1,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['comments-task'] = data.data?.id || data.id;
        return { success: true, details: `✓ Task: "TaskForComments_${id}" (ID: ${testDataIds['comments-task']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'task-comments-create-1',
    name: 'Create Comment #1',
    category: 'Task Comments',
    description: 'Create first test comment',
    dependsOn: ['task-comments-create-task'],
    test: async () => {
      if (!testDataIds['comments-task']) {
        return { success: false, error: 'No task available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/TaskComments', {
        method: 'POST',
        body: JSON.stringify({
          taskId: testDataIds['comments-task'],
          comment: `Test comment #1 - Created at ${new Date().toISOString()}`,
          createdBy: 'API Test User',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-comment-1'] = data.data?.id || data.id;
        const comment = data.data || data;
        return { success: true, details: `✓ Comment #1 created (ID: ${testDataIds['test-comment-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'task-comments-create-2',
    name: 'Create Comment #2',
    category: 'Task Comments',
    description: 'Create second test comment',
    dependsOn: ['task-comments-create-1'],
    test: async () => {
      if (!testDataIds['comments-task']) {
        return { success: false, error: 'No task available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/TaskComments', {
        method: 'POST',
        body: JSON.stringify({
          taskId: testDataIds['comments-task'],
          comment: `Test comment #2 - Follow-up discussion`,
          createdBy: 'API Test User',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-comment-2'] = data.data?.id || data.id;
        return { success: true, details: `✓ Comment #2 created (ID: ${testDataIds['test-comment-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'task-comments-create-3',
    name: 'Create Comment #3',
    category: 'Task Comments',
    description: 'Create third test comment',
    dependsOn: ['task-comments-create-2'],
    test: async () => {
      if (!testDataIds['comments-task']) {
        return { success: false, error: 'No task available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/TaskComments', {
        method: 'POST',
        body: JSON.stringify({
          taskId: testDataIds['comments-task'],
          comment: `Test comment #3 - Final notes`,
          createdBy: 'API Test User',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-comment-3'] = data.data?.id || data.id;
        return { success: true, details: `✓ Comment #3 created (ID: ${testDataIds['test-comment-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'task-comments-list',
    name: 'List Task Comments',
    category: 'Task Comments',
    description: 'Fetch all comments for the test task',
    dependsOn: ['task-comments-create-3'],
    test: async () => {
      if (!testDataIds['comments-task']) {
        return { success: false, error: 'No task ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/TaskComments/task/${testDataIds['comments-task']}`);
      if (status === 200) {
        const comments = data?.comments || data?.data || (Array.isArray(data) ? data : []);
        const count = comments.length || data?.totalCount || 0;
        return { success: true, details: `✓ Found ${count} comments for task`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'task-comments-get-by-id',
    name: 'Get Comment by ID',
    category: 'Task Comments',
    description: 'Retrieve a specific comment',
    dependsOn: ['task-comments-list'],
    test: async () => {
      if (!testDataIds['test-comment-1']) {
        return { success: false, error: 'No test comment ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/TaskComments/${testDataIds['test-comment-1']}`);
      if (status === 200 && data) {
        const comment = data.data || data;
        return { success: true, details: `✓ Retrieved comment ID: ${comment.id} | Author: ${comment.createdBy}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'task-comments-update',
    name: 'Update Comment',
    category: 'Task Comments',
    description: 'Update the first test comment',
    dependsOn: ['task-comments-get-by-id'],
    test: async () => {
      if (!testDataIds['test-comment-1']) {
        return { success: false, error: 'No test comment ID available' };
      }
      const updatedContent = `Updated comment - Modified at ${new Date().toISOString()}`;
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/TaskComments/${testDataIds['test-comment-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          comment: updatedContent,
        }),
      });
      if (status === 200) {
        return { success: true, details: `✓ Updated comment content`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'task-comments-delete-one',
    name: 'Delete One Comment',
    category: 'Task Comments',
    description: 'Delete comment #1 (keep others)',
    dependsOn: ['task-comments-update'],
    test: async () => {
      if (!testDataIds['test-comment-1']) {
        return { success: false, error: 'No test comment to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/TaskComments/${testDataIds['test-comment-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-comment-1'];
        delete testDataIds['test-comment-1'];
        return { success: true, details: `✓ Deleted comment ID: ${deletedId} (kept 2 comments)`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'task-comments-verify-count',
    name: 'Verify Remaining Comments',
    category: 'Task Comments',
    description: 'Verify 2 comments remain after deletion',
    dependsOn: ['task-comments-delete-one'],
    test: async () => {
      if (!testDataIds['comments-task']) {
        return { success: false, error: 'No task ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/TaskComments/task/${testDataIds['comments-task']}`);
      if (status === 200) {
        const comments = data?.comments || data?.data || (Array.isArray(data) ? data : []);
        const count = comments.length || data?.totalCount || 0;
        return { success: true, details: `✓ Verified: ${count} comments remain after delete`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'task-comments-cleanup',
    name: 'Cleanup Comments, Task & Project',
    category: 'Task Comments',
    description: 'Delete remaining comments, task, and project',
    dependsOn: ['task-comments-verify-count'],
    test: async () => {
      let cleaned = 0;
      let lastRequestData: any, lastResponseData: any;
      
      // Delete remaining comments
      for (const key of ['test-comment-2', 'test-comment-3']) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/TaskComments/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) cleaned++;
          delete testDataIds[key];
        }
      }
      
      // Delete the task
      if (testDataIds['comments-task']) {
        const { status, requestData, responseData } = await apiCall<any>(`/api/Tasks/project-task/${testDataIds['comments-task']}`, { method: 'DELETE' });
        lastRequestData = requestData;
        lastResponseData = responseData;
        if (status === 200 || status === 204) cleaned++;
        delete testDataIds['comments-task'];
      }
      
      // Delete the project
      if (testDataIds['comments-project']) {
        const { status, requestData, responseData } = await apiCall<any>(`/api/Projects/${testDataIds['comments-project']}`, { method: 'DELETE' });
        lastRequestData = requestData;
        lastResponseData = responseData;
        if (status === 200 || status === 204) cleaned++;
        delete testDataIds['comments-project'];
        delete testDataIds['comments-column'];
      }
      
      return { success: true, details: `✓ Cleaned up ${cleaned} items (comments + task + project)`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
    },
  },
];
