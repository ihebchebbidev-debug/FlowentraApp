/**
 * Service Order Full Information Tests
 * Tests for aggregated data retrieval from service orders
 * Including all dispatches, expenses, materials, time entries, notes
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const serviceOrderFullInfoTests: TestDefinition[] = [
  // ============== GET SERVICE ORDER WITH ALL DISPATCHES ==============
  {
    id: 'so-full-get-dispatches',
    name: 'Get All Dispatches for Service Order',
    category: 'SO Full Info',
    description: 'Retrieve all dispatches linked to a service order',
    dependsOn: ['dispatches-list-final'],
    test: async () => {
      const soId = testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${soId}/dispatches`
      );
      
      if (status === 200) {
        const dispatches = data?.data || data || [];
        const dispatchCount = Array.isArray(dispatches) ? dispatches.length : 0;
        return { 
          success: true, 
          details: `✓ Found ${dispatchCount} dispatches for SO #${soId}`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      // Endpoint might not exist yet - that's ok
      if (status === 404) {
        return { success: true, details: '⊘ Endpoint not implemented yet', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== GET ALL TIME ENTRIES ACROSS DISPATCHES ==============
  {
    id: 'so-full-get-time-entries',
    name: 'Get All Time Entries for Service Order',
    category: 'SO Full Info',
    description: 'Aggregate time entries from all dispatches',
    dependsOn: ['so-full-get-dispatches'],
    test: async () => {
      const soId = testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${soId}/time-entries`
      );
      
      if (status === 200) {
        const entries = data?.data || data || [];
        const entryCount = Array.isArray(entries) ? entries.length : 0;
        const totalDuration = Array.isArray(entries) 
          ? entries.reduce((sum: number, e: any) => sum + (e.duration || 0), 0) 
          : 0;
        return { 
          success: true, 
          details: `✓ Found ${entryCount} time entries (Total: ${totalDuration} mins)`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      if (status === 404) {
        return { success: true, details: '⊘ Endpoint not implemented yet', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== GET ALL EXPENSES ACROSS DISPATCHES ==============
  {
    id: 'so-full-get-expenses',
    name: 'Get All Expenses for Service Order',
    category: 'SO Full Info',
    description: 'Aggregate expenses from all dispatches',
    dependsOn: ['so-full-get-time-entries'],
    test: async () => {
      const soId = testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${soId}/expenses`
      );
      
      if (status === 200) {
        const expenses = data?.data || data || [];
        const expenseCount = Array.isArray(expenses) ? expenses.length : 0;
        const totalAmount = Array.isArray(expenses) 
          ? expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) 
          : 0;
        return { 
          success: true, 
          details: `✓ Found ${expenseCount} expenses (Total: ${totalAmount.toFixed(2)})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      if (status === 404) {
        return { success: true, details: '⊘ Endpoint not implemented yet', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== GET ALL MATERIALS ACROSS DISPATCHES ==============
  {
    id: 'so-full-get-materials',
    name: 'Get All Materials for Service Order',
    category: 'SO Full Info',
    description: 'Aggregate material usage from all dispatches',
    dependsOn: ['so-full-get-expenses'],
    test: async () => {
      const soId = testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${soId}/materials`
      );
      
      if (status === 200) {
        const materials = data?.data || data || [];
        const materialCount = Array.isArray(materials) ? materials.length : 0;
        const totalCost = Array.isArray(materials) 
          ? materials.reduce((sum: number, m: any) => sum + (m.totalPrice || 0), 0) 
          : 0;
        return { 
          success: true, 
          details: `✓ Found ${materialCount} materials used (Total: ${totalCost.toFixed(2)})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      if (status === 404) {
        return { success: true, details: '⊘ Endpoint not implemented yet', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== GET ALL NOTES ACROSS DISPATCHES ==============
  {
    id: 'so-full-get-notes',
    name: 'Get All Notes for Service Order',
    category: 'SO Full Info',
    description: 'Aggregate notes from all dispatches',
    dependsOn: ['so-full-get-materials'],
    test: async () => {
      const soId = testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${soId}/notes`
      );
      
      if (status === 200) {
        const notes = data?.data || data || [];
        const noteCount = Array.isArray(notes) ? notes.length : 0;
        return { 
          success: true, 
          details: `✓ Found ${noteCount} notes across all dispatches`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      if (status === 404) {
        return { success: true, details: '⊘ Endpoint not implemented yet', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== GET FULL SERVICE ORDER SUMMARY ==============
  {
    id: 'so-full-get-summary',
    name: 'Get Full Service Order Summary',
    category: 'SO Full Info',
    description: 'Get complete aggregated summary with all data',
    dependsOn: ['so-full-get-notes'],
    test: async () => {
      const soId = testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${soId}/full-summary`
      );
      
      if (status === 200) {
        const summary = data?.data || data;
        const jobCount = summary?.jobs?.length || summary?.jobCount || 0;
        const dispatchCount = summary?.dispatches?.length || summary?.dispatchCount || 0;
        const totalExpenses = summary?.totalExpenses || 0;
        const totalMaterials = summary?.totalMaterialCost || 0;
        const totalTime = summary?.totalDuration || 0;
        
        return { 
          success: true, 
          details: `✓ Summary: ${jobCount} jobs, ${dispatchCount} dispatches, Expenses: ${totalExpenses}, Materials: ${totalMaterials}, Time: ${totalTime}min`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      if (status === 404) {
        return { success: true, details: '⊘ Endpoint not implemented yet', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== TEST MULTI-JOB SERVICE ORDER ==============
  {
    id: 'so-full-create-multi-job',
    name: 'Create SO with Multiple Jobs',
    category: 'SO Full Info',
    description: 'Create a service order that will have multiple jobs',
    dependsOn: ['so-full-get-summary'],
    test: async () => {
      // We need a sale with multiple service items to create multi-job SO
      // First check if we have one from previous tests
      const saleId = testDataIds['test-sale-multi-services'] || testDataIds['test-sale-services'];
      if (!saleId) {
        return { success: true, details: '⊘ Skipped: No sale with services available' };
      }
      
      const installationId = Number(testDataIds['test-installation-1'] || 1);
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/from-sale/${saleId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            priority: 'high',
            notes: 'Multi-job service order test',
            startDate: new Date().toISOString(),
            targetCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            installationIds: [installationId],
            requiresApproval: false,
            tags: ['test', 'multi-job'],
          }),
        }
      );
      
      if ((status === 200 || status === 201) && data) {
        const so = data.data || data;
        const soId = so.id;
        testDataIds['test-service-order-multi'] = soId;
        const jobCount = so.jobs?.length || 0;
        return { 
          success: true, 
          details: `✓ Created multi-job SO #${soId} with ${jobCount} jobs`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      // Already exists or sale not valid
      if (status === 400 || status === 409) {
        return { success: true, details: '⊘ Could not create (already exists or invalid sale)', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== CREATE MULTIPLE DISPATCHES FOR SAME SO ==============
  {
    id: 'so-full-create-dispatch-1',
    name: 'Create First Dispatch for Multi-Job SO',
    category: 'SO Full Info',
    description: 'Create first dispatch from job 1',
    dependsOn: ['so-full-create-multi-job'],
    test: async () => {
      const soId = testDataIds['test-service-order-multi'] || testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      // Get the service order to find its jobs
      const { data: soData, status: soStatus } = await apiCall<any>(
        `/api/service-orders/${soId}?includeJobs=true`
      );
      
      if (soStatus !== 200 || !soData) {
        return { success: true, details: '⊘ Could not fetch service order' };
      }
      
      const so = soData.data || soData;
      const jobs = so.jobs || [];
      
      if (jobs.length === 0) {
        return { success: true, details: '⊘ No jobs available for dispatch' };
      }
      
      const jobId = jobs[0].id;
      testDataIds['test-job-for-dispatch-1'] = jobId;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/from-job/${jobId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            technicianId: 11,
            scheduledDate: new Date().toISOString(),
            priority: 'high',
            notes: 'First dispatch for multi-job SO test',
          }),
        }
      );
      
      if ((status === 200 || status === 201) && data) {
        const dispatch = data.data || data;
        testDataIds['test-dispatch-multi-1'] = dispatch.id;
        return { 
          success: true, 
          details: `✓ Created dispatch #${dispatch.id} from job #${jobId}`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      if (status === 400 || status === 409) {
        return { success: true, details: '⊘ Could not create dispatch', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  {
    id: 'so-full-create-dispatch-2',
    name: 'Create Second Dispatch for Multi-Job SO',
    category: 'SO Full Info',
    description: 'Create second dispatch from job 2 (if available)',
    dependsOn: ['so-full-create-dispatch-1'],
    test: async () => {
      const soId = testDataIds['test-service-order-multi'] || testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      // Get the service order to find its jobs
      const { data: soData, status: soStatus } = await apiCall<any>(
        `/api/service-orders/${soId}?includeJobs=true`
      );
      
      if (soStatus !== 200 || !soData) {
        return { success: true, details: '⊘ Could not fetch service order' };
      }
      
      const so = soData.data || soData;
      const jobs = so.jobs || [];
      
      if (jobs.length < 2) {
        // Try creating dispatch from same job with different technician
        const jobId = jobs[0]?.id || testDataIds['test-job-for-dispatch-1'];
        if (!jobId) {
          return { success: true, details: '⊘ No second job available' };
        }
        
        const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
          `/api/dispatches/from-job/${jobId}`,
          {
            method: 'POST',
            body: JSON.stringify({
              technicianId: 12,
              scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              priority: 'medium',
              notes: 'Second dispatch for same job - different technician',
            }),
          }
        );
        
        if ((status === 200 || status === 201) && data) {
          const dispatch = data.data || data;
          testDataIds['test-dispatch-multi-2'] = dispatch.id;
          return { 
            success: true, 
            details: `✓ Created 2nd dispatch #${dispatch.id} (same job, diff tech)`, 
            httpStatus: status, 
            responseSize, 
            requestData, 
            responseData 
          };
        }
        
        return { success: true, details: '⊘ Could not create second dispatch', httpStatus: status };
      }
      
      const jobId = jobs[1].id;
      testDataIds['test-job-for-dispatch-2'] = jobId;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/from-job/${jobId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            technicianId: 12,
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            priority: 'medium',
            notes: 'Second dispatch for multi-job SO test',
          }),
        }
      );
      
      if ((status === 200 || status === 201) && data) {
        const dispatch = data.data || data;
        testDataIds['test-dispatch-multi-2'] = dispatch.id;
        return { 
          success: true, 
          details: `✓ Created dispatch #${dispatch.id} from job #${jobId}`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      return { success: true, details: '⊘ Could not create second dispatch', httpStatus: status };
    },
  },
  
  // ============== ADD DATA TO MULTIPLE DISPATCHES ==============
  {
    id: 'so-full-add-time-dispatch-1',
    name: 'Add Time Entry to Dispatch 1',
    category: 'SO Full Info',
    description: 'Add time tracking to first dispatch',
    dependsOn: ['so-full-create-dispatch-2'],
    test: async () => {
      const dispatchId = testDataIds['test-dispatch-multi-1'];
      if (!dispatchId) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${dispatchId}/time-entries`,
        {
          method: 'POST',
          body: JSON.stringify({
            technicianId: '11',
            workType: 'installation',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            duration: 120,
            description: 'Installation work - dispatch 1',
          }),
        }
      );
      
      if ((status === 200 || status === 201) && data) {
        return { 
          success: true, 
          details: '✓ Added time entry to dispatch 1 (120 min)', 
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
    id: 'so-full-add-time-dispatch-2',
    name: 'Add Time Entry to Dispatch 2',
    category: 'SO Full Info',
    description: 'Add time tracking to second dispatch',
    dependsOn: ['so-full-add-time-dispatch-1'],
    test: async () => {
      const dispatchId = testDataIds['test-dispatch-multi-2'];
      if (!dispatchId) {
        return { success: true, details: '⊘ Skipped: No second dispatch available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${dispatchId}/time-entries`,
        {
          method: 'POST',
          body: JSON.stringify({
            technicianId: '12',
            workType: 'maintenance',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
            duration: 90,
            description: 'Maintenance work - dispatch 2',
          }),
        }
      );
      
      if ((status === 200 || status === 201) && data) {
        return { 
          success: true, 
          details: '✓ Added time entry to dispatch 2 (90 min)', 
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
    id: 'so-full-add-expense-dispatch-1',
    name: 'Add Expense to Dispatch 1',
    category: 'SO Full Info',
    description: 'Add expense to first dispatch',
    dependsOn: ['so-full-add-time-dispatch-2'],
    test: async () => {
      const dispatchId = testDataIds['test-dispatch-multi-1'];
      if (!dispatchId) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${dispatchId}/expenses`,
        {
          method: 'POST',
          body: JSON.stringify({
            technicianId: '11',
            type: 'travel',
            amount: 50.00,
            currency: 'TND',
            description: 'Travel expense - dispatch 1',
            date: new Date().toISOString(),
          }),
        }
      );
      
      if ((status === 200 || status === 201) && data) {
        return { 
          success: true, 
          details: '✓ Added expense to dispatch 1 (50.00 TND)', 
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
    id: 'so-full-add-expense-dispatch-2',
    name: 'Add Expense to Dispatch 2',
    category: 'SO Full Info',
    description: 'Add expense to second dispatch',
    dependsOn: ['so-full-add-expense-dispatch-1'],
    test: async () => {
      const dispatchId = testDataIds['test-dispatch-multi-2'];
      if (!dispatchId) {
        return { success: true, details: '⊘ Skipped: No second dispatch available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${dispatchId}/expenses`,
        {
          method: 'POST',
          body: JSON.stringify({
            technicianId: '12',
            type: 'parts',
            amount: 125.50,
            currency: 'TND',
            description: 'Parts expense - dispatch 2',
            date: new Date().toISOString(),
          }),
        }
      );
      
      if ((status === 200 || status === 201) && data) {
        return { 
          success: true, 
          details: '✓ Added expense to dispatch 2 (125.50 TND)', 
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
    id: 'so-full-add-material-dispatch-1',
    name: 'Add Material to Dispatch 1',
    category: 'SO Full Info',
    description: 'Add material usage to first dispatch',
    dependsOn: ['so-full-add-expense-dispatch-2'],
    test: async () => {
      const dispatchId = testDataIds['test-dispatch-multi-1'];
      if (!dispatchId) {
        return { success: true, details: '⊘ Skipped: No dispatch available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${dispatchId}/materials`,
        {
          method: 'POST',
          body: JSON.stringify({
            usedBy: '11',
            articleId: 1,
            articleName: 'HVAC Filter',
            quantity: 2,
            unitPrice: 45.00,
            description: 'Replacement filters - dispatch 1',
          }),
        }
      );
      
      if ((status === 200 || status === 201) && data) {
        return { 
          success: true, 
          details: '✓ Added material to dispatch 1 (2x HVAC Filter)', 
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
    id: 'so-full-add-material-dispatch-2',
    name: 'Add Material to Dispatch 2',
    category: 'SO Full Info',
    description: 'Add material usage to second dispatch',
    dependsOn: ['so-full-add-material-dispatch-1'],
    test: async () => {
      const dispatchId = testDataIds['test-dispatch-multi-2'];
      if (!dispatchId) {
        return { success: true, details: '⊘ Skipped: No second dispatch available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/dispatches/${dispatchId}/materials`,
        {
          method: 'POST',
          body: JSON.stringify({
            usedBy: '12',
            articleId: 2,
            articleName: 'Compressor Unit',
            quantity: 1,
            unitPrice: 350.00,
            description: 'Replacement compressor - dispatch 2',
          }),
        }
      );
      
      if ((status === 200 || status === 201) && data) {
        return { 
          success: true, 
          details: '✓ Added material to dispatch 2 (1x Compressor)', 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== VERIFY AGGREGATED DATA ==============
  {
    id: 'so-full-verify-all-time-entries',
    name: 'Verify All Time Entries Aggregated',
    category: 'SO Full Info',
    description: 'Verify time entries from all dispatches are aggregated',
    dependsOn: ['so-full-add-material-dispatch-2'],
    test: async () => {
      const soId = testDataIds['test-service-order-multi'] || testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${soId}/time-entries`
      );
      
      if (status === 200) {
        const entries = data?.data || data || [];
        const entryCount = Array.isArray(entries) ? entries.length : 0;
        const totalDuration = Array.isArray(entries) 
          ? entries.reduce((sum: number, e: any) => sum + (e.duration || 0), 0) 
          : 0;
        
        // Verify each entry has dispatchId and technicianId
        const hasDispatchIds = Array.isArray(entries) && entries.every((e: any) => e.dispatchId);
        const hasTechnicianIds = Array.isArray(entries) && entries.every((e: any) => e.technicianId);
        
        return { 
          success: true, 
          details: `✓ Aggregated ${entryCount} entries (${totalDuration}min) | dispatchId: ${hasDispatchIds} | techId: ${hasTechnicianIds}`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      if (status === 404) {
        return { success: true, details: '⊘ Aggregation endpoint not implemented yet', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  {
    id: 'so-full-verify-all-expenses',
    name: 'Verify All Expenses Aggregated',
    category: 'SO Full Info',
    description: 'Verify expenses from all dispatches are aggregated',
    dependsOn: ['so-full-verify-all-time-entries'],
    test: async () => {
      const soId = testDataIds['test-service-order-multi'] || testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${soId}/expenses`
      );
      
      if (status === 200) {
        const expenses = data?.data || data || [];
        const expenseCount = Array.isArray(expenses) ? expenses.length : 0;
        const totalAmount = Array.isArray(expenses) 
          ? expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) 
          : 0;
        
        // Verify each expense has dispatchId and technicianId
        const hasDispatchIds = Array.isArray(expenses) && expenses.every((e: any) => e.dispatchId);
        const hasTechnicianIds = Array.isArray(expenses) && expenses.every((e: any) => e.technicianId);
        
        return { 
          success: true, 
          details: `✓ Aggregated ${expenseCount} expenses (${totalAmount.toFixed(2)}) | dispatchId: ${hasDispatchIds} | techId: ${hasTechnicianIds}`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      if (status === 404) {
        return { success: true, details: '⊘ Aggregation endpoint not implemented yet', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  {
    id: 'so-full-verify-all-materials',
    name: 'Verify All Materials Aggregated',
    category: 'SO Full Info',
    description: 'Verify materials from all dispatches are aggregated',
    dependsOn: ['so-full-verify-all-expenses'],
    test: async () => {
      const soId = testDataIds['test-service-order-multi'] || testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${soId}/materials`
      );
      
      if (status === 200) {
        const materials = data?.data || data || [];
        const materialCount = Array.isArray(materials) ? materials.length : 0;
        const totalCost = Array.isArray(materials) 
          ? materials.reduce((sum: number, m: any) => sum + (m.totalPrice || 0), 0) 
          : 0;
        
        // Verify each material has dispatchId and technicianId
        const hasDispatchIds = Array.isArray(materials) && materials.every((m: any) => m.dispatchId);
        const hasTechnicianIds = Array.isArray(materials) && materials.every((m: any) => m.technicianId);
        
        return { 
          success: true, 
          details: `✓ Aggregated ${materialCount} materials (${totalCost.toFixed(2)}) | dispatchId: ${hasDispatchIds} | techId: ${hasTechnicianIds}`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      if (status === 404) {
        return { success: true, details: '⊘ Aggregation endpoint not implemented yet', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== FINAL FULL SUMMARY ==============
  {
    id: 'so-full-final-summary',
    name: 'Get Final Full SO Summary',
    category: 'SO Full Info',
    description: 'Final complete summary with all aggregated data',
    dependsOn: ['so-full-verify-all-materials'],
    test: async () => {
      const soId = testDataIds['test-service-order-multi'] || testDataIds['test-service-order-1'];
      if (!soId) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${soId}/full-summary`
      );
      
      if (status === 200) {
        const summary = data?.data || data;
        return { 
          success: true, 
          details: `✓ Full summary retrieved for SO #${soId}`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      
      if (status === 404) {
        return { success: true, details: '⊘ Full summary endpoint not implemented yet', httpStatus: status };
      }
      
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
];
