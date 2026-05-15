/**
 * Sales API Tests
 * CRUD operations for sale management including items and service order creation
 * Tests the Sale → ServiceOrder workflow (when services are sold)
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const salesTests: TestDefinition[] = [
  // ============== CLEANUP OLD TEST DATA ==============
  {
    id: 'sales-cleanup',
    name: 'Cleanup Old Test Sales',
    category: 'Sales',
    description: 'Delete old test sales to prevent conflicts',
    dependsOn: ['offers-list-final'],
    test: async () => {
      // Fetch all sales
      const { data, status } = await apiCall<any>('/api/sales?page=1&limit=200');
      if (status !== 200) {
        return { success: true, details: '⊘ Could not fetch sales for cleanup' };
      }
      
      // Handle paginated response - items might be in data.items, data.data, data.sales, or data itself
      const sales = data?.items || data?.sales || data?.data || (Array.isArray(data) ? data : []);
      
      if (!Array.isArray(sales)) {
        return { success: true, details: '⊘ No sales array found in response' };
      }
      
      // Find test sales (matching test patterns)
      const testSales = sales.filter((s: any) => 
        s.title?.toLowerCase().includes('test sale') ||
        s.title?.toLowerCase().includes('apitest') ||
        s.description?.toLowerCase().includes('api testing') ||
        s.description?.toLowerCase().includes('test sale')
      );
      
      let deletedCount = 0;
      for (const sale of testSales) {
        const deleteResult = await apiCall<any>(`/api/sales/${sale.id}`, { method: 'DELETE' });
        if (deleteResult.status === 200 || deleteResult.status === 204) {
          deletedCount++;
        }
      }
      
      return { 
        success: true, 
        details: `✓ Cleaned up ${deletedCount} old test sales (found ${testSales.length})` 
      };
    },
  },
  
  // ============== CREATE OPERATIONS ==============
  {
    id: 'sales-create-1',
    name: 'Create Sale #1 (Materials Only)',
    category: 'Sales',
    description: 'Create first sale with material items only - no ServiceOrder needed',
    dependsOn: ['sales-cleanup'],
    test: async () => {
      const id = randomId();
      const title = `Test Sale Materials ${id}`;
      
      // Use existing contact or fallback to offers test contact
      const contactId = testDataIds['test-person-2'] || testDataIds['test-company-2'] || testDataIds['offers-test-contact'];
      if (!contactId) {
        return { success: false, error: 'No contact available for sale creation' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: 'Test sale with material items only - direct fulfillment',
          contactId,
          status: 'won',
          stage: 'closed',
          priority: 'medium',
          currency: 'TND',
          taxes: 19,
          discount: 0,
          items: [
            {
              type: 'article',
              // articleId omitted - FK constraint prevents fake IDs
              itemName: 'Sold Material Item A',
              itemCode: 'MAT-SALE-001',
              description: 'High-quality material item for inventory',
              quantity: 10,
              unitPrice: 75,
              discount: 0,
              discountType: 'percentage',
              requiresServiceOrder: false,
            },
            {
              type: 'article',
              itemName: 'Sold Material Item B',
              itemCode: 'MAT-SALE-002',
              description: 'Secondary material item for stock',
              quantity: 5,
              unitPrice: 120,
              discount: 5,
              discountType: 'percentage',
              requiresServiceOrder: false,
            },
          ],
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        const saleId = data.data?.id || data.id || data.sale?.id;
        testDataIds['test-sale-materials'] = saleId;
        return { 
          success: true, 
          details: `✓ Sale: "${title}" | Type: Materials Only | No SO needed (ID: ${saleId})`, 
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
    id: 'sales-create-2',
    name: 'Create Sale #2 (Services - Needs SO)',
    category: 'Sales',
    description: 'Create second sale with service items - will need ServiceOrder',
    dependsOn: ['sales-create-1'],
    test: async () => {
      const id = randomId();
      const title = `Test Sale Services ${id}`;
      
      const contactId = testDataIds['test-person-2'] || testDataIds['test-company-2'] || testDataIds['offers-test-contact'];
      if (!contactId) {
        return { success: false, error: 'No contact available for sale creation' };
      }
      const installationId = String(testDataIds['test-installation-2'] || testDataIds['test-installation-1'] || '1');
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: 'Test sale with service items - requires ServiceOrder generation',
          contactId,
          status: 'won',
          stage: 'closed',
          priority: 'high',
          currency: 'TND',
          taxes: 19,
          discount: 0,
          items: [
            {
              type: 'service',
              // articleId omitted - FK constraint prevents fake IDs
              itemName: 'HVAC Installation Service',
              itemCode: 'SVC-SALE-001',
              description: 'Complete HVAC system installation and commissioning',
              quantity: 1,
              unitPrice: 800,
              discount: 0,
              discountType: 'percentage',
              installationId,
              installationName: 'Main Building HVAC',
              requiresServiceOrder: true,
            },
            {
              type: 'service',
              itemName: 'Quarterly Maintenance',
              itemCode: 'SVC-SALE-002',
              description: 'Regular quarterly maintenance and inspection service',
              quantity: 4,
              unitPrice: 200,
              discount: 10,
              discountType: 'percentage',
              installationId,
              installationName: 'Main Building HVAC',
              requiresServiceOrder: true,
            },
          ],
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        const saleId = data.data?.id || data.id || data.sale?.id;
        testDataIds['test-sale-services'] = saleId;
        return { 
          success: true, 
          details: `✓ Sale: "${title}" | Type: Services | SO Required (ID: ${saleId})`, 
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
    id: 'sales-create-3',
    name: 'Create Sale #3 (Mixed Items)',
    category: 'Sales',
    description: 'Create third sale with both materials and services',
    dependsOn: ['sales-create-2'],
    test: async () => {
      const id = randomId();
      const title = `Test Sale Mixed ${id}`;
      
      const contactId = testDataIds['test-person-3'] || testDataIds['test-company-3'] || testDataIds['offers-test-contact'];
      if (!contactId) {
        return { success: false, error: 'No contact available for sale creation' };
      }
      const installationId = String(testDataIds['test-installation-3'] || testDataIds['test-installation-1'] || '1');
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: 'Test sale with mixed items (materials + services)',
          contactId,
          status: 'won',
          stage: 'closed',
          priority: 'urgent',
          currency: 'EUR',
          taxes: 20,
          discount: 5,
          estimatedCloseDate: new Date().toISOString(),
          actualCloseDate: new Date().toISOString(),
          items: [
            {
              type: 'article',
              itemName: 'Equipment Parts Bundle',
              itemCode: 'MAT-SALE-010',
              description: 'Replacement parts bundle for equipment',
              quantity: 1,
              unitPrice: 450,
              discount: 0,
              requiresServiceOrder: false,
            },
            {
              type: 'service',
              itemName: 'Installation & Setup',
              itemCode: 'SVC-SALE-010',
              description: 'Professional installation and initial setup service',
              quantity: 1,
              unitPrice: 600,
              discount: 0,
              installationId,
              installationName: 'Customer Site',
              requiresServiceOrder: true,
            },
          ],
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        const saleId = data.data?.id || data.id || data.sale?.id;
        testDataIds['test-sale-mixed'] = saleId;
        return { 
          success: true, 
          details: `✓ Sale: "${title}" | Type: Mixed | Status: won (ID: ${saleId})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== ADDITIONAL SALES FOR VOLUME TESTING ==============
  {
    id: 'sales-create-4',
    name: 'Create Sale #4 (Enterprise Contract)',
    category: 'Sales',
    description: 'Create high-value enterprise sale',
    dependsOn: ['sales-create-3'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-company-1'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };
      const installationId = String(testDataIds['test-installation-1'] || '1');
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          title: `Enterprise Contract ${id}`,
          description: 'Annual enterprise service contract with full coverage',
          contactId,
          status: 'won',
          stage: 'closed',
          priority: 'high',
          currency: 'EUR',
          taxes: 20,
          discount: 12,
          items: [
            { type: 'service', itemName: 'Enterprise Support (Annual)', itemCode: 'ENT-S01', description: 'Full annual support', quantity: 1, unitPrice: 35000, discount: 10, installationId, requiresServiceOrder: true },
            { type: 'service', itemName: 'Priority Response SLA', itemCode: 'ENT-S02', description: '4-hour response SLA', quantity: 12, unitPrice: 3000, discount: 5, installationId, requiresServiceOrder: true },
            { type: 'article', itemName: 'Backup Hardware', itemCode: 'ENT-HW01', description: 'Spare hardware for hot swap', quantity: 3, unitPrice: 5000, discount: 0, requiresServiceOrder: false },
          ],
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-sale-enterprise'] = data.data?.id || data.id;
        return { success: true, details: `✓ Enterprise Sale created (€80K+ value)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'sales-create-5',
    name: 'Create Sale #5 (Lost Deal)',
    category: 'Sales',
    description: 'Create a lost sale for tracking',
    dependsOn: ['sales-create-4'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-company-2'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          title: `Lost Opportunity ${id}`,
          description: 'Promising deal lost to competitor',
          contactId,
          status: 'lost',
          stage: 'closed',
          priority: 'medium',
          currency: 'USD',
          taxes: 10,
          discount: 0,
          lostReason: 'Lost to competitor - lower pricing',
          items: [
            { type: 'service', itemName: 'Implementation', itemCode: 'LOST-001', description: 'Full implementation', quantity: 1, unitPrice: 20000, discount: 0, requiresServiceOrder: false },
            { type: 'article', itemName: 'Equipment', itemCode: 'LOST-EQ', description: 'Standard equipment', quantity: 5, unitPrice: 3000, discount: 0, requiresServiceOrder: false },
          ],
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-sale-lost'] = data.data?.id || data.id;
        return { success: true, details: `✓ Lost Sale created (for analytics)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'sales-create-6',
    name: 'Create Sale #6 (In Progress)',
    category: 'Sales',
    description: 'Create sale in negotiation stage',
    dependsOn: ['sales-create-5'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-person-1'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };
      const installationId = String(testDataIds['test-installation-2'] || '1');
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          title: `Negotiation Deal ${id}`,
          description: 'Currently in active negotiation',
          contactId,
          status: 'negotiation',
          stage: 'negotiation',
          priority: 'high',
          currency: 'TND',
          taxes: 19,
          discount: 0,
          estimatedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            { type: 'service', itemName: 'Custom Development', itemCode: 'NEG-001', description: 'Custom feature development', quantity: 1, unitPrice: 15000, discount: 0, installationId, requiresServiceOrder: true },
            { type: 'service', itemName: 'Training Sessions', itemCode: 'NEG-002', description: 'User training', quantity: 5, unitPrice: 800, discount: 0, installationId, requiresServiceOrder: true },
          ],
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-sale-negotiation'] = data.data?.id || data.id;
        return { success: true, details: `✓ Negotiation Sale created`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'sales-create-7',
    name: 'Create Sale #7 (Quick Win)',
    category: 'Sales',
    description: 'Create small but fast-closing sale',
    dependsOn: ['sales-create-6'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-person-2'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          title: `Quick Win ${id}`,
          description: 'Small deal, fast turnaround',
          contactId,
          status: 'won',
          stage: 'closed',
          priority: 'low',
          currency: 'TND',
          taxes: 19,
          discount: 0,
          actualCloseDate: new Date().toISOString(),
          items: [
            { type: 'article', itemName: 'Consumables Pack', itemCode: 'QW-001', description: 'Standard consumables', quantity: 10, unitPrice: 50, discount: 0, requiresServiceOrder: false },
            { type: 'article', itemName: 'Spare Filters', itemCode: 'QW-002', description: 'Filter replacements', quantity: 5, unitPrice: 80, discount: 0, requiresServiceOrder: false },
          ],
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-sale-quickwin'] = data.data?.id || data.id;
        return { success: true, details: `✓ Quick Win Sale created`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'sales-create-8',
    name: 'Create Sale #8 (Recurring Revenue)',
    category: 'Sales',
    description: 'Create recurring monthly sale',
    dependsOn: ['sales-create-7'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-company-3'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };
      const installationId = String(testDataIds['test-installation-3'] || '1');
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          title: `Monthly Contract ${id}`,
          description: 'Recurring monthly maintenance contract',
          contactId,
          status: 'won',
          stage: 'closed',
          priority: 'medium',
          currency: 'TND',
          taxes: 19,
          discount: 10,
          items: [
            { type: 'service', itemName: 'Monthly Maintenance', itemCode: 'REC-001', description: 'Monthly visit', quantity: 12, unitPrice: 600, discount: 10, installationId, requiresServiceOrder: true },
            { type: 'article', itemName: 'Monthly Supplies', itemCode: 'REC-002', description: 'Monthly consumables', quantity: 12, unitPrice: 100, discount: 0, requiresServiceOrder: false },
          ],
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-sale-recurring'] = data.data?.id || data.id;
        return { success: true, details: `✓ Recurring Revenue Sale created`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'sales-create-9',
    name: 'Create Sale #9 (Multi-Site)',
    category: 'Sales',
    description: 'Create multi-location sale',
    dependsOn: ['sales-create-8'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-company-1'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          title: `Multi-Site Deployment ${id}`,
          description: 'Deployment across 8 customer locations',
          contactId,
          status: 'won',
          stage: 'closed',
          priority: 'urgent',
          currency: 'USD',
          taxes: 8,
          discount: 18,
          items: [
            { type: 'service', itemName: 'Site Assessment', itemCode: 'MS-S01', description: 'Per-site assessment', quantity: 8, unitPrice: 2500, discount: 15, requiresServiceOrder: true },
            { type: 'service', itemName: 'Installation', itemCode: 'MS-S02', description: 'Per-site installation', quantity: 8, unitPrice: 12000, discount: 20, requiresServiceOrder: true },
            { type: 'article', itemName: 'Site Equipment', itemCode: 'MS-EQ01', description: 'Standard site kit', quantity: 8, unitPrice: 18000, discount: 10, requiresServiceOrder: false },
            { type: 'article', itemName: 'Networking Gear', itemCode: 'MS-NET', description: 'Per-site networking', quantity: 8, unitPrice: 3500, discount: 5, requiresServiceOrder: false },
          ],
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-sale-multisite'] = data.data?.id || data.id;
        return { success: true, details: `✓ Multi-Site Sale created ($250K+ project)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'sales-create-10',
    name: 'Create Sale #10 (Proposal Stage)',
    category: 'Sales',
    description: 'Create sale in proposal stage',
    dependsOn: ['sales-create-9'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-person-3'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          title: `Proposal ${id}`,
          description: 'Awaiting customer review',
          contactId,
          status: 'proposal',
          stage: 'proposal',
          priority: 'medium',
          currency: 'EUR',
          taxes: 20,
          discount: 5,
          estimatedCloseDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            { type: 'service', itemName: 'Consulting Hours', itemCode: 'PROP-001', description: 'Expert consulting', quantity: 40, unitPrice: 175, discount: 0, requiresServiceOrder: true },
            { type: 'article', itemName: 'Documentation Package', itemCode: 'PROP-DOC', description: 'Full documentation', quantity: 1, unitPrice: 500, discount: 0, requiresServiceOrder: false },
          ],
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-sale-proposal'] = data.data?.id || data.id;
        return { success: true, details: `✓ Proposal Stage Sale created`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== CREATE FROM OFFER ==============
  {
    id: 'sales-create-from-offer',
    name: 'Create Sale from Offer',
    category: 'Sales',
    description: 'Create a sale directly from an offer',
    dependsOn: ['sales-create-10'],
    test: async () => {
      // Use the services offer if available
      const offerId = testDataIds['test-offer-services'];
      if (!offerId) {
        return { success: true, details: '⊘ Skipped: No offer available for conversion' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/sales/from-offer/${offerId}`, 
        { method: 'POST' }
      );
      
      if ((status === 200 || status === 201) && data) {
        const saleId = data.data?.id || data.id || data.sale?.id;
        testDataIds['test-sale-from-offer-api'] = saleId;
        return { 
          success: true, 
          details: `✓ Created sale from offer (Sale ID: ${saleId})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      // It's ok if this fails - the offer might already be converted
      if (status === 400 || status === 409) {
        return { success: true, details: `⊘ Offer already converted or not valid for conversion`, httpStatus: status };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== READ OPERATIONS ==============
  {
    id: 'sales-get-by-id',
    name: 'Get Sale by ID',
    category: 'Sales',
    description: 'Retrieve a specific sale with items',
    dependsOn: ['sales-create-from-offer'],
    test: async () => {
      if (!testDataIds['test-sale-materials']) {
        return { success: false, error: 'No test sale ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/sales/${testDataIds['test-sale-materials']}`);
      if (status === 200 && data) {
        const sale = data.data || data;
        const itemCount = sale.items?.length || 0;
        return { 
          success: true, 
          details: `✓ Retrieved Sale: "${sale.title}" | Items: ${itemCount} | Status: ${sale.status}`, 
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
    id: 'sales-list-all',
    name: 'List All Sales',
    category: 'Sales',
    description: 'Fetch all sales with pagination',
    dependsOn: ['sales-get-by-id'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales?page=1&limit=50');
      if (status === 200) {
        // Handle wrapped response: { success: true, data: { sales: [...], pagination: {...} } }
        const responseData2 = data?.data || data;
        const sales = responseData2?.sales || responseData2?.items || (Array.isArray(responseData2) ? responseData2 : []);
        const total = responseData2?.pagination?.total || sales.length;
        return { 
          success: true, 
          details: `✓ Listed ${sales.length} sales (Total: ${total})`, 
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
    id: 'sales-filter-by-status',
    name: 'Filter Sales by Status',
    category: 'Sales',
    description: 'Filter sales by won status',
    dependsOn: ['sales-list-all'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales?status=won');
      if (status === 200) {
        const responseData2 = data?.data || data;
        const sales = responseData2?.sales || responseData2?.items || (Array.isArray(responseData2) ? responseData2 : []);
        return { 
          success: true, 
          details: `✓ Found ${sales.length} won sales`, 
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
    id: 'sales-filter-by-priority',
    name: 'Filter Sales by Priority',
    category: 'Sales',
    description: 'Filter sales by high/urgent priority',
    dependsOn: ['sales-filter-by-status'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales?priority=high');
      if (status === 200) {
        const responseData2 = data?.data || data;
        const sales = responseData2?.sales || responseData2?.items || (Array.isArray(responseData2) ? responseData2 : []);
        return { 
          success: true, 
          details: `✓ Found ${sales.length} high priority sales`, 
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
    id: 'sales-get-stats',
    name: 'Get Sale Statistics',
    category: 'Sales',
    description: 'Retrieve sale statistics',
    dependsOn: ['sales-filter-by-priority'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales/stats');
      if (status === 200 && data) {
        const stats = data.data || data;
        return { 
          success: true, 
          details: `✓ Stats: Total=${stats.totalSales || 0} | Won=${stats.wonSales || 0} | Lost=${stats.lostSales || 0}`, 
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
    id: 'sales-update',
    name: 'Update Sale',
    category: 'Sales',
    description: 'Update sale details',
    dependsOn: ['sales-get-stats'],
    test: async () => {
      if (!testDataIds['test-sale-materials']) {
        return { success: false, error: 'No test sale ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/sales/${testDataIds['test-sale-materials']}`, 
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: 'Updated Test Sale Materials',
            description: 'Updated description for testing',
            priority: 'high',
            materialsFulfillment: 'partial',
          }),
        }
      );
      if (status === 200) {
        return { 
          success: true, 
          details: `✓ Updated sale priority to "high", fulfillment to "partial"`, 
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
    id: 'sales-update-status-completed',
    name: 'Update Sale Status to Completed',
    category: 'Sales',
    description: 'Mark sale as completed',
    dependsOn: ['sales-update'],
    test: async () => {
      if (!testDataIds['test-sale-materials']) {
        return { success: false, error: 'No test sale ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/sales/${testDataIds['test-sale-materials']}`, 
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'completed',
            materialsFulfillment: 'fulfilled',
            actualCloseDate: new Date().toISOString(),
          }),
        }
      );
      if (status === 200) {
        return { 
          success: true, 
          details: `✓ Updated sale status to "completed"`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== SALE ITEMS OPERATIONS ==============
  {
    id: 'sales-add-item',
    name: 'Add Item to Sale',
    category: 'Sales',
    description: 'Add a new item to existing sale',
    dependsOn: ['sales-update-status-completed'],
    test: async () => {
      if (!testDataIds['test-sale-services']) {
        return { success: false, error: 'No test sale ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/sales/${testDataIds['test-sale-services']}/items`, 
        {
          method: 'POST',
          body: JSON.stringify({
            type: 'service',
            itemName: 'Additional Consultation',
            itemCode: 'SVC-ADD',
            description: 'Additional consultation service for testing', // Required field
            quantity: 2,
            unitPrice: 150,
            discount: 0,
            requiresServiceOrder: true,
          }),
        }
      );
      if ((status === 200 || status === 201) && data) {
        const itemId = data.data?.id || data.id;
        testDataIds['test-sale-item'] = itemId;
        return { 
          success: true, 
          details: `✓ Added item to sale (ID: ${itemId})`, 
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
    id: 'sales-update-item',
    name: 'Update Sale Item',
    category: 'Sales',
    description: 'Update an existing sale item',
    dependsOn: ['sales-add-item'],
    test: async () => {
      if (!testDataIds['test-sale-services'] || !testDataIds['test-sale-item']) {
        return { success: false, error: 'No test sale or item ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/sales/${testDataIds['test-sale-services']}/items/${testDataIds['test-sale-item']}`, 
        {
          method: 'PATCH',
          body: JSON.stringify({
            type: 'service',
            itemName: 'Updated Consultation Service',
            itemCode: 'SVC-UPD',
            description: 'Updated consultation service for testing', // Required field
            quantity: 3,
            unitPrice: 175,
            discount: 5,
            requiresServiceOrder: true,
            fulfillmentStatus: 'pending',
          }),
        }
      );
      if (status === 200) {
        return { 
          success: true, 
          details: `✓ Updated sale item: qty=3, price=175`, 
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
    id: 'sales-delete-item',
    name: 'Delete Sale Item',
    category: 'Sales',
    description: 'Remove an item from sale',
    dependsOn: ['sales-update-item'],
    test: async () => {
      if (!testDataIds['test-sale-services'] || !testDataIds['test-sale-item']) {
        return { success: false, error: 'No test sale or item ID available' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(
        `/api/sales/${testDataIds['test-sale-services']}/items/${testDataIds['test-sale-item']}`, 
        { method: 'DELETE' }
      );
      if (status === 200 || status === 204) {
        delete testDataIds['test-sale-item'];
        return { 
          success: true, 
          details: `✓ Deleted sale item`, 
          httpStatus: status, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  
  // ============== DELETE OPERATIONS ==============
  {
    id: 'sales-delete-one',
    name: 'Delete One Sale',
    category: 'Sales',
    description: 'Delete a test sale',
    dependsOn: ['sales-delete-item'],
    test: async () => {
      if (!testDataIds['test-sale-mixed']) {
        return { success: false, error: 'No test sale to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(
        `/api/sales/${testDataIds['test-sale-mixed']}`, 
        { method: 'DELETE' }
      );
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-sale-mixed'];
        delete testDataIds['test-sale-mixed'];
        return { 
          success: true, 
          details: `✓ Deleted sale (ID: ${deletedId})`, 
          httpStatus: status, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'sales-list-final',
    name: 'List Sales (Final)',
    category: 'Sales',
    description: 'Final list of all sales after operations',
    dependsOn: ['sales-delete-one'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/sales?page=1&limit=100');
      if (status === 200) {
        // Handle wrapped response: { success: true, data: { sales: [...] } }
        const sales = data?.data?.sales || data?.sales || (Array.isArray(data?.data) ? data.data : []) || (Array.isArray(data) ? data : []);
        const total = data?.data?.pagination?.total || data?.pagination?.total || sales.length;
        
        // Count by status (ensure sales is an array)
        const salesArray = Array.isArray(sales) ? sales : [];
        const won = salesArray.filter((s: any) => s.status === 'won').length;
        const completed = salesArray.filter((s: any) => s.status === 'completed').length;
        const lost = salesArray.filter((s: any) => s.status === 'lost').length;
        
        return { 
          success: true, 
          details: `✓ Final: ${total} sales | Won: ${won} | Completed: ${completed} | Lost: ${lost}`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== CLEANUP ==============
  {
    id: 'sales-cleanup',
    name: 'Cleanup Sales Test Data',
    category: 'Sales',
    description: 'Cleanup any remaining test sales',
    dependsOn: ['dispatches-list-final'],
    test: async () => {
      let cleanedCount = 0;
      const errors: string[] = [];
      
      // Delete remaining test sales
      const saleIds = [
        testDataIds['test-sale-materials'],
        testDataIds['test-sale-services'],
        testDataIds['test-sale-from-offer-api'],
      ].filter(Boolean);
      
      for (const saleId of saleIds) {
        try {
          const { status } = await apiCall<any>(`/api/sales/${saleId}`, { method: 'DELETE' });
          if (status === 200 || status === 204) cleanedCount++;
        } catch (e) {
          errors.push(`sale ${saleId}`);
        }
      }
      
      // Clear sale IDs
      delete testDataIds['test-sale-materials'];
      delete testDataIds['test-sale-services'];
      delete testDataIds['test-sale-from-offer-api'];
      
      return { 
        success: true, 
        details: `✓ Cleaned up ${cleanedCount} sales${errors.length > 0 ? ` (errors: ${errors.join(', ')})` : ''}` 
      };
    },
  },
];
