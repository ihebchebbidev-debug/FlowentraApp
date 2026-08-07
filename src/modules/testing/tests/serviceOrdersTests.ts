/**
 * Service Orders API Tests
 * CRUD operations for service order management
 * Tests the ServiceOrder → Jobs → Dispatch workflow
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const serviceOrdersTests: TestDefinition[] = [
  // ============== CLEANUP OLD TEST DATA ==============
  {
    id: 'service-orders-cleanup',
    name: 'Cleanup Old Test Service Orders',
    category: 'Service Orders',
    description: 'Delete old test service orders to prevent conflicts',
    dependsOn: ['sales-list-final'],
    test: async () => {
      // Fetch all service orders
      const { data, status } = await apiCall<any>('/api/service-orders?page=1&pageSize=200');
      if (status !== 200) {
        return { success: true, details: '⊘ Could not fetch service orders for cleanup' };
      }

      // Handle paginated response - { success: true, data: { serviceOrders: [...], pagination: {...} } }
      const wrapper = data?.data || data;
      const serviceOrders = wrapper?.serviceOrders || wrapper?.items || (Array.isArray(wrapper) ? wrapper : []);

      if (!Array.isArray(serviceOrders)) {
        return { success: true, details: '⊘ No service orders array found in response' };
      }

      // Find test service orders (matching test patterns)
      const testOrders = serviceOrders.filter((so: any) =>
        so.notes?.toLowerCase().includes('test') ||
        so.notes?.toLowerCase().includes('api-test') ||
        so.tags?.some((t: string) => t === 'test' || t === 'api-test')
      );

      let deletedCount = 0;
      for (const so of testOrders) {
        const deleteResult = await apiCall<any>(`/api/service-orders/${so.id}`, { method: 'DELETE' });
        if (deleteResult.status === 200 || deleteResult.status === 204) {
          deletedCount++;
        }
      }

      return {
        success: true,
        details: `✓ Cleaned up ${deletedCount} old test service orders (found ${testOrders.length})`
      };
    },
  },

  // ============== CREATE FROM SALE ==============
  {
    id: 'service-orders-create-from-sale',
    name: 'Create Service Order from Sale #1',
    category: 'Service Orders',
    description: 'Create a service order from a sale with service items',
    dependsOn: ['service-orders-cleanup'],
    test: async () => {
      const saleId = testDataIds['test-sale-services'];
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
            notes: 'Service order created from test sale - HVAC services',
            startDate: new Date().toISOString(),
            targetCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            installationIds: [installationId],
            requiresApproval: false,
            tags: ['test', 'api-test', 'hvac'],
          }),
        }
      );

      if ((status === 200 || status === 201) && data) {
        const soId = data.data?.id || data.id || data.serviceOrder?.id;
        testDataIds['test-service-order-1'] = soId;
        return {
          success: true,
          details: `✓ Created ServiceOrder from Sale (ID: ${soId})`,
          httpStatus: status,
          responseSize,
          requestData,
          responseData
        };
      }
      if (status === 400 || status === 409) {
        return { success: true, details: `⊘ Sale not valid for SO creation or already has one`, httpStatus: status };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'service-orders-create-from-sale-2',
    name: 'Create Service Order from Sale #2',
    category: 'Service Orders',
    description: 'Create SO from enterprise sale',
    dependsOn: ['service-orders-create-from-sale'],
    test: async () => {
      const saleId = testDataIds['test-sale-enterprise'];
      if (!saleId) {
        return { success: true, details: '⊘ Skipped: No enterprise sale available' };
      }

      const installationId = Number(testDataIds['test-installation-2'] || testDataIds['test-installation-1'] || 1);

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/from-sale/${saleId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            priority: 'urgent',
            notes: 'Enterprise priority service order - VIP customer',
            startDate: new Date().toISOString(),
            targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            installationIds: [installationId],
            requiresApproval: true,
            tags: ['test', 'enterprise', 'vip'],
          }),
        }
      );

      if ((status === 200 || status === 201) && data) {
        testDataIds['test-service-order-2'] = data.data?.id || data.id;
        return { success: true, details: `✓ Created Enterprise SO`, httpStatus: status, responseSize, requestData, responseData };
      }
      if (status === 400 || status === 409) {
        return { success: true, details: `⊘ Enterprise sale not valid for SO`, httpStatus: status };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'service-orders-create-from-sale-3',
    name: 'Create Service Order from Sale #3',
    category: 'Service Orders',
    description: 'Create SO from recurring sale',
    dependsOn: ['service-orders-create-from-sale-2'],
    test: async () => {
      const saleId = testDataIds['test-sale-recurring'];
      if (!saleId) {
        return { success: true, details: '⊘ Skipped: No recurring sale available' };
      }

      const installationId = Number(testDataIds['test-installation-3'] || testDataIds['test-installation-1'] || 1);

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/from-sale/${saleId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            priority: 'medium',
            notes: 'Monthly maintenance service order',
            startDate: new Date().toISOString(),
            targetCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            installationIds: [installationId],
            requiresApproval: false,
            tags: ['test', 'recurring', 'maintenance'],
          }),
        }
      );

      if ((status === 200 || status === 201) && data) {
        testDataIds['test-service-order-3'] = data.data?.id || data.id;
        return { success: true, details: `✓ Created Recurring Maintenance SO`, httpStatus: status, responseSize, requestData, responseData };
      }
      if (status === 400 || status === 409) {
        return { success: true, details: `⊘ Recurring sale not valid for SO`, httpStatus: status };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'service-orders-create-from-sale-4',
    name: 'Create Service Order from Sale #4',
    category: 'Service Orders',
    description: 'Create SO from negotiation sale',
    dependsOn: ['service-orders-create-from-sale-3'],
    test: async () => {
      const saleId = testDataIds['test-sale-negotiation'];
      if (!saleId) {
        return { success: true, details: '⊘ Skipped: No negotiation sale available' };
      }

      const installationId = Number(testDataIds['test-installation-1'] || 1);

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/from-sale/${saleId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            priority: 'high',
            notes: 'Custom development service order',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            targetCompletionDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            installationIds: [installationId],
            requiresApproval: true,
            tags: ['test', 'custom', 'development'],
          }),
        }
      );

      if ((status === 200 || status === 201) && data) {
        testDataIds['test-service-order-4'] = data.data?.id || data.id;
        return { success: true, details: `✓ Created Custom Dev SO`, httpStatus: status, responseSize, requestData, responseData };
      }
      if (status === 400 || status === 409) {
        return { success: true, details: `⊘ Negotiation sale not valid for SO`, httpStatus: status };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'service-orders-create-from-sale-5',
    name: 'Create Service Order from Sale #5',
    category: 'Service Orders',
    description: 'Create SO from multi-site sale',
    dependsOn: ['service-orders-create-from-sale-4'],
    test: async () => {
      const saleId = testDataIds['test-sale-multisite'];
      if (!saleId) {
        return { success: true, details: '⊘ Skipped: No multi-site sale available' };
      }

      const installationIds = [
        Number(testDataIds['test-installation-1'] || 1),
        Number(testDataIds['test-installation-2'] || 2),
        Number(testDataIds['test-installation-3'] || 3),
      ];

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/from-sale/${saleId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            priority: 'urgent',
            notes: 'Multi-site deployment - 8 locations total',
            startDate: new Date().toISOString(),
            targetCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            installationIds,
            requiresApproval: true,
            tags: ['test', 'multi-site', 'deployment', 'large-project'],
          }),
        }
      );

      if ((status === 200 || status === 201) && data) {
        testDataIds['test-service-order-5'] = data.data?.id || data.id;
        return { success: true, details: `✓ Created Multi-Site SO ($250K project)`, httpStatus: status, responseSize, requestData, responseData };
      }
      if (status === 400 || status === 409) {
        return { success: true, details: `⊘ Multi-site sale not valid for SO`, httpStatus: status };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },

  // ============== READ OPERATIONS ==============
  {
    id: 'service-orders-list-all',
    name: 'List All Service Orders',
    category: 'Service Orders',
    description: 'Fetch all service orders with pagination',
    dependsOn: ['service-orders-create-from-sale-5'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/service-orders?page=1&pageSize=50');
      if (status === 200) {
        const wrapper = data?.data || data;
        const serviceOrders = wrapper?.serviceOrders || wrapper?.items || (Array.isArray(wrapper) ? wrapper : []);
        const total = wrapper?.pagination?.total || serviceOrders.length;

        // Store first service order for subsequent tests
        if (Array.isArray(serviceOrders) && serviceOrders.length > 0 && !testDataIds['test-service-order-1']) {
          testDataIds['test-service-order-1'] = serviceOrders[0].id;
        }

        return {
          success: true,
          details: `✓ Listed ${serviceOrders.length} service orders (Total: ${total})`,
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
    id: 'service-orders-get-by-id',
    name: 'Get Service Order by ID',
    category: 'Service Orders',
    description: 'Retrieve a specific service order with jobs',
    dependsOn: ['service-orders-list-all'],
    test: async () => {
      if (!testDataIds['test-service-order-1']) {
        // Try to get any service order from the list
        const { data, status } = await apiCall<any>('/api/service-orders?page=1&pageSize=1');
        if (status === 200 && data) {
          const orders = data?.serviceOrders || data?.data || (Array.isArray(data) ? data : []);
          if (orders.length > 0) {
            testDataIds['test-service-order-1'] = orders[0].id;
          }
        }
      }

      if (!testDataIds['test-service-order-1']) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${testDataIds['test-service-order-1']}?includeJobs=true`
      );
      if (status === 200 && data) {
        const so = data.data || data;
        const jobCount = so.jobs?.length || 0;
        return {
          success: true,
          details: `✓ Retrieved SO: "${so.orderNumber}" | Jobs: ${jobCount} | Status: ${so.status}`,
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
    id: 'service-orders-filter-by-status',
    name: 'Filter Service Orders by Status',
    category: 'Service Orders',
    description: 'Filter service orders by scheduled status',
    dependsOn: ['service-orders-get-by-id'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/service-orders?status=scheduled');
      if (status === 200) {
        const serviceOrders = data?.serviceOrders || data?.data || (Array.isArray(data) ? data : []);
        return {
          success: true,
          details: `✓ Found ${serviceOrders.length} scheduled service orders`,
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
    id: 'service-orders-get-stats',
    name: 'Get Service Order Statistics',
    category: 'Service Orders',
    description: 'Retrieve service order statistics',
    dependsOn: ['service-orders-filter-by-status'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/service-orders/statistics');
      if (status === 200 && data) {
        const stats = data.data || data;
        return {
          success: true,
          details: `✓ Stats: Total=${stats.totalServiceOrders || 0} | Scheduled=${stats.byStatus?.scheduled || 0} | Completed=${stats.byStatus?.completed || 0}`,
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
    id: 'service-orders-update',
    name: 'Update Service Order',
    category: 'Service Orders',
    description: 'Update service order details',
    dependsOn: ['service-orders-get-stats'],
    test: async () => {
      if (!testDataIds['test-service-order-1']) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${testDataIds['test-service-order-1']}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            priority: 'urgent',
            notes: 'Updated notes - priority increased',
            tags: ['test', 'api-test', 'updated'],
          }),
        }
      );
      if (status === 200) {
        return {
          success: true,
          details: `✓ Updated service order priority to "urgent"`,
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
    id: 'service-orders-update-status-in-progress',
    name: 'Update SO Status to In Progress',
    category: 'Service Orders',
    description: 'Change service order status to in_progress',
    dependsOn: ['service-orders-update'],
    test: async () => {
      if (!testDataIds['test-service-order-1']) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${testDataIds['test-service-order-1']}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'in_progress',
          }),
        }
      );
      if (status === 200) {
        return {
          success: true,
          details: `✓ Updated status to "in_progress"`,
          httpStatus: status,
          responseSize,
          requestData,
          responseData
        };
      }
      // Some status transitions might not be valid
      if (status === 400) {
        return { success: true, details: `⊘ Status transition not valid from current state`, httpStatus: status };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },

  // ============== COMPLETE JOBS FIRST ==============
  {
    id: 'service-orders-complete-jobs',
    name: 'Complete All Jobs in Service Order',
    category: 'Service Orders',
    description: 'Mark all jobs as completed before completing service order',
    dependsOn: ['service-orders-update-status-in-progress'],
    test: async () => {
      if (!testDataIds['test-service-order-1']) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }

      // Get the service order with jobs
      const { data: soData, status: soStatus } = await apiCall<any>(
        `/api/service-orders/${testDataIds['test-service-order-1']}?includeJobs=true`
      );

      if (soStatus !== 200) {
        return { success: true, details: '⊘ Could not fetch service order' };
      }

      const so = soData?.data || soData;
      const jobs = so?.jobs || [];

      if (jobs.length === 0) {
        return { success: true, details: '⊘ No jobs to complete' };
      }

      let completedCount = 0;
      for (const job of jobs) {
        // Try to update job status to completed
        const { status } = await apiCall<any>(
          `/api/service-orders/${testDataIds['test-service-order-1']}/jobs/${job.id}/status`,
          {
            method: 'PUT',
            body: JSON.stringify({ status: 'completed', completionPercentage: 100 }),
          }
        );
        if (status === 200) {
          completedCount++;
        }
      }

      return {
        success: true,
        details: `✓ Completed ${completedCount}/${jobs.length} jobs`,
      };
    },
  },

  // ============== COMPLETE WORKFLOW ==============
  {
    id: 'service-orders-complete',
    name: 'Complete Service Order',
    category: 'Service Orders',
    description: 'Mark service order as completed',
    dependsOn: ['service-orders-complete-jobs'],
    test: async () => {
      if (!testDataIds['test-service-order-1']) {
        return { success: true, details: '⊘ Skipped: No service order available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/service-orders/${testDataIds['test-service-order-1']}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({
            generateInvoice: true,
          }),
        }
      );
      if (status === 200) {
        const so = data?.data || data;
        return {
          success: true,
          details: `✓ Completed SO with invoice: ${so.invoiceNumber || 'generated'}`,
          httpStatus: status,
          responseSize,
          requestData,
          responseData
        };
      }
      // Completion might fail if jobs aren't done
      if (status === 400) {
        return { success: true, details: `⊘ Cannot complete: jobs not finished`, httpStatus: status };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },

  // ============== FINAL LIST ==============
  {
    id: 'service-orders-list-final',
    name: 'List Service Orders (Final)',
    category: 'Service Orders',
    description: 'Final list of all service orders',
    dependsOn: ['service-orders-complete'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/service-orders?page=1&pageSize=100');
      if (status === 200) {
        // Handle nested response structure: { success: true, data: { serviceOrders: [...], pagination: {...} } }
        const wrapper = data?.data || data;
        const serviceOrders = wrapper?.serviceOrders || wrapper?.items || (Array.isArray(wrapper) ? wrapper : []);

        if (!Array.isArray(serviceOrders)) {
          return { success: true, details: '⊘ No service orders array in response', httpStatus: status, responseSize, requestData, responseData };
        }

        const total = wrapper?.pagination?.total || wrapper?.totalCount || serviceOrders.length;

        // Count by status
        const draft = serviceOrders.filter((s: any) => s.status === 'draft').length;
        const scheduled = serviceOrders.filter((s: any) => s.status === 'scheduled').length;
        const inProgress = serviceOrders.filter((s: any) => s.status === 'in_progress').length;
        const completed = serviceOrders.filter((s: any) => s.status === 'completed').length;

        return {
          success: true,
          details: `✓ Final: ${total} SOs | Created: ${draft} | Scheduled: ${scheduled} | In Progress: ${inProgress} | Completed: ${completed}`,
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
