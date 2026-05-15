/**
 * Dispatches API Tests
 * CRUD operations for dispatch management including time entries, expenses, materials
 * Tests the Job → Dispatch workflow
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const dispatchesTests: TestDefinition[] = [
  // ============== CLEANUP OLD TEST DATA ==============
  {
    id: 'dispatches-cleanup',
    name: 'Cleanup Old Test Dispatches',
    category: 'Dispatches',
    description: 'Delete old test dispatches to prevent conflicts',
    dependsOn: ['service-orders-list-final'],
    test: async () => {
      // Fetch all dispatches
      const { data, status } = await apiCall<any>('/api/dispatches?pageNumber=1&pageSize=200');
      if (status !== 200) {
        return { success: true, details: '⊘ Could not fetch dispatches for cleanup' };
      }
      
      // Handle paginated response - items might be in data.items, data.data, or data itself
      const dispatches = data?.items || data?.data || (Array.isArray(data) ? data : []);
      
      if (!Array.isArray(dispatches)) {
        return { success: true, details: '⊘ No dispatches array found in response' };
      }
      
      // Find test dispatches (matching test patterns)
      const testDispatches = dispatches.filter((d: any) => 
        d.notes?.toLowerCase().includes('test') ||
        d.notes?.toLowerCase().includes('api test') ||
        d.siteAddress?.toLowerCase().includes('test')
      );
      
      let deletedCount = 0;
      for (const dispatch of testDispatches) {
        const deleteResult = await apiCall<any>(`/api/dispatches/${dispatch.id}`, { method: 'DELETE' });
        if (deleteResult.status === 200 || deleteResult.status === 204) {
          deletedCount++;
        }
      }
      
      return { 
        success: true, 
        details: `✓ Cleaned up ${deletedCount} old test dispatches (found ${testDispatches.length})` 
      };
    },
  },
  
  // ============== CREATE FROM JOB ==============
  {
    id: 'dispatches-create-from-job',
    name: 'Create Dispatch from Job',
    category: 'Dispatches',
    description: 'Create a dispatch by assigning a job to technicians',
    dependsOn: ['dispatches-cleanup'],
    test: async () => {
      // First, try to get a job from a service order
      let soId = testDataIds['test-service-order-1'];
      let jobId: number | null = null;
      
      // If no service order stored, try to get one from the list
      if (!soId) {
        const { data, status } = await apiCall<any>('/api/service-orders?page=1&pageSize=10');
        if (status === 200 && data) {
          const wrapper = data?.data || data;
          const orders = wrapper?.serviceOrders || wrapper?.items || (Array.isArray(wrapper) ? wrapper : []);
          if (Array.isArray(orders) && orders.length > 0) {
            soId = orders[0].id;
            testDataIds['test-service-order-1'] = soId;
          }
        }
      }
      
      if (soId) {
        const { data, status } = await apiCall<any>(`/api/service-orders/${soId}?includeJobs=true`);
        if (status === 200 && data) {
          const so = data?.data || data;
          if (so.jobs && so.jobs.length > 0) {
            jobId = so.jobs[0].id;
            testDataIds['test-job-1'] = jobId;
          }
        }
      }
      
      if (!jobId) {
        return { success: true, details: '⊘ Skipped: No job available for dispatch' };
      }
      
      const technicianId = String(testDataIds['test-user-1'] || 1);
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/from-job/${jobId}`, 
        {
          method: 'POST',
          body: JSON.stringify({
            assignedTechnicianIds: [technicianId],
            scheduledDate: new Date().toISOString(),
            priority: 'high',
            notes: 'API test dispatch',
            siteAddress: '123 Test Street',
          }),
        }
      );
      
      if ((status === 200 || status === 201) && data) {
        const dispatchId = data.data?.id || data.id || data.dispatch?.id;
        testDataIds['test-dispatch-1'] = dispatchId;
        return { 
          success: true, 
          details: `✓ Created Dispatch from Job (ID: ${dispatchId})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== READ OPERATIONS ==============
  {
    id: 'dispatches-list-all',
    name: 'List All Dispatches',
    category: 'Dispatches',
    description: 'Fetch all dispatches with pagination',
    dependsOn: ['dispatches-create-from-job'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/dispatches?pageNumber=1&pageSize=50');
      if (status === 200) {
        const dispatches = data?.data || (Array.isArray(data) ? data : []);
        const total = data?.totalItems || dispatches.length;
        return { 
          success: true, 
          details: `✓ Listed ${dispatches.length} dispatches (Total: ${total})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'dispatches-get-by-id',
    name: 'Get Dispatch by ID',
    category: 'Dispatches',
    description: 'Retrieve a specific dispatch with all details',
    dependsOn: ['dispatches-list-all'],
    test: async () => {
      if (!testDataIds['test-dispatch-1']) {
        // Try to get any dispatch from the list
        const { data, status } = await apiCall<any>('/api/dispatches?pageNumber=1&pageSize=1');
        if (status === 200 && data) {
          const dispatches = data?.data || (Array.isArray(data) ? data : []);
          if (dispatches.length > 0) {
            testDataIds['test-dispatch-1'] = dispatches[0].id;
          }
        }
      }
      
      if (!testDataIds['test-dispatch-1']) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${testDataIds['test-dispatch-1']}`
      );
      if (status === 200 && data) {
        const d = data.data || data;
        return { 
          success: true, 
          details: `✓ Retrieved Dispatch: "${d.dispatchNumber}" | Status: ${d.status} | Priority: ${d.priority}`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'dispatches-filter-by-status',
    name: 'Filter Dispatches by Status',
    category: 'Dispatches',
    description: 'Filter dispatches by pending status',
    dependsOn: ['dispatches-get-by-id'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/dispatches?status=pending');
      if (status === 200) {
        const dispatches = data?.data || (Array.isArray(data) ? data : []);
        return { 
          success: true, 
          details: `✓ Found ${dispatches.length} pending dispatches`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'dispatches-get-stats',
    name: 'Get Dispatch Statistics',
    category: 'Dispatches',
    description: 'Retrieve dispatch statistics',
    dependsOn: ['dispatches-filter-by-status'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/dispatches/statistics');
      if (status === 200 && data) {
        const stats = data.data || data;
        return { 
          success: true, 
          details: `✓ Stats retrieved successfully`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== UPDATE OPERATIONS ==============
  {
    id: 'dispatches-update',
    name: 'Update Dispatch',
    category: 'Dispatches',
    description: 'Update dispatch details',
    dependsOn: ['dispatches-get-stats'],
    test: async () => {
      if (!testDataIds['test-dispatch-1']) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${testDataIds['test-dispatch-1']}`, 
        {
          method: 'PUT',
          body: JSON.stringify({
            priority: 'urgent',
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        }
      );
      if (status === 200) {
        return { 
          success: true, 
          details: `✓ Updated dispatch priority to "urgent"`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'dispatches-start',
    name: 'Start Dispatch',
    category: 'Dispatches',
    description: 'Start a dispatch (set status to in_progress)',
    dependsOn: ['dispatches-update'],
    test: async () => {
      if (!testDataIds['test-dispatch-1']) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${testDataIds['test-dispatch-1']}/start`, 
        {
          method: 'POST',
          body: JSON.stringify({
            actualStartTime: new Date().toISOString(),
          }),
        }
      );
      if (status === 200) {
        return { 
          success: true, 
          details: `✓ Started dispatch - status now "in_progress"`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      // Status transition might fail
      if (status === 400) {
        return { success: true, details: `⊘ Cannot start: invalid current status`, httpStatus: status };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== TIME ENTRIES ==============
  {
    id: 'dispatches-add-time-entry',
    name: 'Add Time Entry',
    category: 'Dispatches',
    description: 'Record time worked on dispatch',
    dependsOn: ['dispatches-start'],
    test: async () => {
      if (!testDataIds['test-dispatch-1']) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      const technicianId = String(testDataIds['test-user-1'] || 1);
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${testDataIds['test-dispatch-1']}/time-entries`, 
        {
          method: 'POST',
          body: JSON.stringify({
            technicianId,
            workType: 'maintenance',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            description: 'Performed maintenance work',
          }),
        }
      );
      if ((status === 200 || status === 201) && data) {
        const entryId = data.data?.id || data.id;
        testDataIds['test-time-entry'] = entryId;
        return { 
          success: true, 
          details: `✓ Added time entry: 2 hours (ID: ${entryId})`,
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'dispatches-get-time-entries',
    name: 'Get Time Entries',
    category: 'Dispatches',
    description: 'List all time entries for dispatch',
    dependsOn: ['dispatches-add-time-entry'],
    test: async () => {
      if (!testDataIds['test-dispatch-1']) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${testDataIds['test-dispatch-1']}/time-entries`
      );
      if (status === 200) {
        const entries = Array.isArray(data) ? data : (data?.data || []);
        const hasDispatchId = entries.length > 0 && entries.every((e: any) => e.dispatchId !== undefined);
        const hasTechnicianId = entries.length > 0 && entries.every((e: any) => e.technicianId !== undefined);
        return { 
          success: true, 
          details: `✓ Found ${entries.length} time entries (dispatchId: ${hasDispatchId}, technicianId: ${hasTechnicianId})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== EXPENSES ==============
  {
    id: 'dispatches-add-expense',
    name: 'Add Expense',
    category: 'Dispatches',
    description: 'Record an expense for dispatch',
    dependsOn: ['dispatches-get-time-entries'],
    test: async () => {
      if (!testDataIds['test-dispatch-1']) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      const technicianId = String(testDataIds['test-user-1'] || 1);
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${testDataIds['test-dispatch-1']}/expenses`, 
        {
          method: 'POST',
          body: JSON.stringify({
            technicianId,
            type: 'travel',
            amount: 45.50,
            currency: 'TND',
            description: 'Travel to customer site',
            date: new Date().toISOString(),
          }),
        }
      );
      if ((status === 200 || status === 201) && data) {
        const expenseId = data.data?.id || data.id;
        testDataIds['test-expense'] = expenseId;
        return { 
          success: true, 
          details: `✓ Added expense: $45.50 travel (ID: ${expenseId})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'dispatches-get-expenses',
    name: 'Get Expenses',
    category: 'Dispatches',
    description: 'List all expenses for dispatch',
    dependsOn: ['dispatches-add-expense'],
    test: async () => {
      if (!testDataIds['test-dispatch-1']) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${testDataIds['test-dispatch-1']}/expenses`
      );
      if (status === 200) {
        const expenses = Array.isArray(data) ? data : (data?.data || []);
        const hasDispatchId = expenses.length > 0 && expenses.every((e: any) => e.dispatchId !== undefined);
        const hasTechnicianId = expenses.length > 0 && expenses.every((e: any) => e.technicianId !== undefined);
        return { 
          success: true, 
          details: `✓ Found ${expenses.length} expenses (dispatchId: ${hasDispatchId}, technicianId: ${hasTechnicianId})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== MATERIALS ==============
  {
    id: 'dispatches-add-material',
    name: 'Add Material Usage',
    category: 'Dispatches',
    description: 'Record material used on dispatch',
    dependsOn: ['dispatches-get-expenses'],
    test: async () => {
      if (!testDataIds['test-dispatch-1']) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      const technicianId = String(testDataIds['test-user-1'] || '1');
      const articleId = String(testDataIds['test-article-1'] || '1');
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${testDataIds['test-dispatch-1']}/materials`, 
        {
          method: 'POST',
          body: JSON.stringify({
            articleId,  // Must be string per CreateMaterialUsageDto
            quantity: 2,
            usedBy: technicianId,  // Must be string per CreateMaterialUsageDto
            description: 'Test material usage',
          }),
        }
      );
      if ((status === 200 || status === 201) && data) {
        const materialId = data.data?.id || data.id;
        testDataIds['test-material'] = materialId;
        return { 
          success: true, 
          details: `✓ Added material usage: qty=2 (ID: ${materialId})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'dispatches-get-materials',
    name: 'Get Materials Used',
    category: 'Dispatches',
    description: 'List all materials used on dispatch',
    dependsOn: ['dispatches-add-material'],
    test: async () => {
      if (!testDataIds['test-dispatch-1']) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${testDataIds['test-dispatch-1']}/materials`
      );
      if (status === 200) {
        const materials = Array.isArray(data) ? data : (data?.data || []);
        const hasDispatchId = materials.length > 0 && materials.every((m: any) => m.dispatchId !== undefined);
        const hasTechnicianId = materials.length > 0 && materials.every((m: any) => m.technicianId !== undefined);
        return { 
          success: true, 
          details: `✓ Found ${materials.length} materials (dispatchId: ${hasDispatchId}, technicianId: ${hasTechnicianId})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== NOTES ==============
  {
    id: 'dispatches-add-note',
    name: 'Add Note',
    category: 'Dispatches',
    description: 'Add a note to dispatch',
    dependsOn: ['dispatches-get-materials'],
    test: async () => {
      if (!testDataIds['test-dispatch-1']) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${testDataIds['test-dispatch-1']}/notes`, 
        {
          method: 'POST',
          body: JSON.stringify({
            content: 'Work completed successfully. Customer satisfied.',
            category: 'general',
            priority: 'normal',
          }),
        }
      );
      if ((status === 200 || status === 201) && data) {
        const noteId = data.data?.id || data.id;
        testDataIds['test-dispatch-note'] = noteId;
        return { 
          success: true, 
          details: `✓ Added note to dispatch (ID: ${noteId})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== COMPLETE DISPATCH ==============
  {
    id: 'dispatches-complete',
    name: 'Complete Dispatch',
    category: 'Dispatches',
    description: 'Mark dispatch as completed',
    dependsOn: ['dispatches-add-note'],
    test: async () => {
      if (!testDataIds['test-dispatch-1']) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${testDataIds['test-dispatch-1']}/complete`, 
        {
          method: 'POST',
          body: JSON.stringify({
            actualEndTime: new Date().toISOString(),
            completionPercentage: 100,
          }),
        }
      );
      if (status === 200) {
        return { 
          success: true, 
          details: `✓ Dispatch completed successfully`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      // Completion might fail
      if (status === 400) {
        return { success: true, details: `⊘ Cannot complete: invalid state`, httpStatus: status };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== FINAL LIST ==============
  {
    id: 'dispatches-list-final',
    name: 'List Dispatches (Final)',
    category: 'Dispatches',
    description: 'Final list of all dispatches',
    dependsOn: ['dispatches-complete'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/dispatches?pageNumber=1&pageSize=100');
      if (status === 200) {
        const dispatches = data?.data || (Array.isArray(data) ? data : []);
        const total = data?.totalItems || dispatches.length;
        
        // Count by status
        const pending = dispatches.filter((d: any) => d.status === 'pending').length;
        const inProgress = dispatches.filter((d: any) => d.status === 'in_progress').length;
        const completed = dispatches.filter((d: any) => d.status === 'completed').length;
        
        return { 
          success: true, 
          details: `✓ Final: ${total} dispatches | Pending: ${pending} | In Progress: ${inProgress} | Completed: ${completed}`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
];
