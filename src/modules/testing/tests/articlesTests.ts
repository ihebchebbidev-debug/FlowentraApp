/**
 * Articles API Tests
 * CRUD operations for article/inventory management
 * Supports both MATERIAL and SERVICE types as per frontend
 * 
 * Frontend types (src/types/articles.ts):
 * - ArticleType: 'material' | 'service'
 * - Materials: have stock, minStock, costPrice, sellPrice, location
 * - Services: have basePrice, duration, skillsRequired, materialsNeeded
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const articlesTests: TestDefinition[] = [
  // ============================================================================
  // MATERIAL ARTICLES (type: 'material')
  // These represent physical inventory items with stock levels
  // ============================================================================
  {
    id: 'articles-create-material-1',
    name: 'Create Material #1 (Electrical)',
    category: 'Articles',
    description: 'Create material - Copper Wire | Stock inventory item',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      const id = randomId();
      const articleName = `CopperWire_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Articles', {
        method: 'POST',
        body: JSON.stringify({
          // Backend field mapping
          articleNumber: `MAT-ELEC-${id}`,
          name: articleName,
          description: 'High-quality copper wire for electrical installations - 2.5mm gauge',
          unit: 'meter',
          purchasePrice: 2.50,  // Maps to costPrice on frontend
          salesPrice: 4.99,     // Maps to sellPrice on frontend  
          stockQuantity: 500,   // Maps to stock on frontend
          minStockLevel: 50,    // Maps to minStock on frontend
          category: 'Electrical',
          type: 'material',     // Frontend ArticleType
          location: 'Warehouse A',
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-material-1'] = data.data?.id || data.id || data.article?.id;
        return { success: true, details: `✓ MATERIAL: "${articleName}" | Type: material | Stock: 500m | Price: $4.99/m (ID: ${testDataIds['test-material-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'articles-create-material-2',
    name: 'Create Material #2 (Plumbing)',
    category: 'Articles',
    description: 'Create material - PVC Pipe | Stock inventory item',
    dependsOn: ['articles-create-material-1'],
    test: async () => {
      const id = randomId();
      const articleName = `PVCPipe_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Articles', {
        method: 'POST',
        body: JSON.stringify({
          articleNumber: `MAT-PLMB-${id}`,
          name: articleName,
          description: 'Standard 50mm PVC pipe for drainage systems',
          unit: 'piece',
          purchasePrice: 8.00,
          salesPrice: 15.99,
          stockQuantity: 200,
          minStockLevel: 20,
          category: 'Plumbing',
          type: 'material',
          location: 'Warehouse B',
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-material-2'] = data.data?.id || data.id || data.article?.id;
        return { success: true, details: `✓ MATERIAL: "${articleName}" | Type: material | Stock: 200 pcs | Price: $15.99 (ID: ${testDataIds['test-material-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'articles-create-material-3',
    name: 'Create Material #3 (HVAC)',
    category: 'Articles',
    description: 'Create material - HVAC Filter | Stock inventory item',
    dependsOn: ['articles-create-material-2'],
    test: async () => {
      const id = randomId();
      const articleName = `HVACFilter_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Articles', {
        method: 'POST',
        body: JSON.stringify({
          articleNumber: `MAT-HVAC-${id}`,
          name: articleName,
          description: 'HEPA filter for HVAC systems - 20x25x4 inch',
          unit: 'piece',
          purchasePrice: 35.00,
          salesPrice: 69.99,
          stockQuantity: 100,
          minStockLevel: 10,
          category: 'HVAC',
          type: 'material',
          location: 'Warehouse A',
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-material-3'] = data.data?.id || data.id || data.article?.id;
        return { success: true, details: `✓ MATERIAL: "${articleName}" | Type: material | Stock: 100 pcs | Price: $69.99 (ID: ${testDataIds['test-material-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============================================================================
  // SERVICE ARTICLES (type: 'service')
  // These represent labor/service offerings with hourly rates
  // ============================================================================
  {
    id: 'articles-create-service-1',
    name: 'Create Service #1 (Installation)',
    category: 'Articles',
    description: 'Create service - Installation Labor | Hourly rate',
    dependsOn: ['articles-create-material-3'],
    test: async () => {
      const id = randomId();
      const articleName = `InstallService_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Articles', {
        method: 'POST',
        body: JSON.stringify({
          articleNumber: `SRV-INST-${id}`,
          name: articleName,
          description: 'Professional installation service - includes site preparation',
          unit: 'hour',
          purchasePrice: 0,       // Services typically have no purchase cost
          salesPrice: 85.00,     // Maps to basePrice on frontend
          duration: 120,         // Duration in minutes (2 hours)
          stockQuantity: 0,      // Services have no stock
          minStockLevel: 0,
          category: 'Installation',
          type: 'service',       // Frontend ArticleType
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-service-1'] = data.data?.id || data.id || data.article?.id;
        return { success: true, details: `✓ SERVICE: "${articleName}" | Type: service | Rate: $85/hr | Duration: 120min (ID: ${testDataIds['test-service-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'articles-create-service-2',
    name: 'Create Service #2 (Maintenance)',
    category: 'Articles',
    description: 'Create service - Maintenance | Hourly rate',
    dependsOn: ['articles-create-service-1'],
    test: async () => {
      const id = randomId();
      const articleName = `MaintenanceService_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Articles', {
        method: 'POST',
        body: JSON.stringify({
          articleNumber: `SRV-MAINT-${id}`,
          name: articleName,
          description: 'Scheduled maintenance service - preventive care',
          unit: 'hour',
          purchasePrice: 0,
          salesPrice: 65.00,
          duration: 90,          // Duration in minutes (1.5 hours)
          stockQuantity: 0,
          minStockLevel: 0,
          category: 'Maintenance',
          type: 'service',
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-service-2'] = data.data?.id || data.id || data.article?.id;
        return { success: true, details: `✓ SERVICE: "${articleName}" | Type: service | Rate: $65/hr | Duration: 90min (ID: ${testDataIds['test-service-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'articles-create-service-3',
    name: 'Create Service #3 (Emergency)',
    category: 'Articles',
    description: 'Create service - Emergency Repair | Premium rate',
    dependsOn: ['articles-create-service-2'],
    test: async () => {
      const id = randomId();
      const articleName = `EmergencyRepair_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Articles', {
        method: 'POST',
        body: JSON.stringify({
          articleNumber: `SRV-EMRG-${id}`,
          name: articleName,
          description: '24/7 emergency repair service - priority response',
          unit: 'hour',
          purchasePrice: 0,
          salesPrice: 150.00,
          duration: 60,          // Duration in minutes (1 hour emergency)
          stockQuantity: 0,
          minStockLevel: 0,
          category: 'Emergency',
          type: 'service',
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-service-3'] = data.data?.id || data.id || data.article?.id;
        return { success: true, details: `✓ SERVICE: "${articleName}" | Type: service | Rate: $150/hr | Duration: 60min (ID: ${testDataIds['test-service-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============================================================================
  // READ OPERATIONS
  // ============================================================================
  {
    id: 'articles-get-material-by-id',
    name: 'Get Material by ID',
    category: 'Articles',
    description: 'Retrieve specific material article',
    dependsOn: ['articles-create-service-3'],
    test: async () => {
      if (!testDataIds['test-material-1']) {
        return { success: false, error: 'No test material ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Articles/${testDataIds['test-material-1']}`);
      if (status === 200 && data) {
        const article = data.data || data;
        return { success: true, details: `✓ Retrieved MATERIAL: "${article.name}" | Type: ${article.type} | Stock: ${article.stockQuantity || article.stock || 'N/A'}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'articles-get-service-by-id',
    name: 'Get Service by ID',
    category: 'Articles',
    description: 'Retrieve specific service article',
    dependsOn: ['articles-get-material-by-id'],
    test: async () => {
      if (!testDataIds['test-service-1']) {
        return { success: false, error: 'No test service ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Articles/${testDataIds['test-service-1']}`);
      if (status === 200 && data) {
        const article = data.data || data;
        return { success: true, details: `✓ Retrieved SERVICE: "${article.name}" | Type: ${article.type} | Rate: $${article.salesPrice || article.basePrice} | Duration: ${article.duration || 'N/A'}min`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'articles-filter-by-type-material',
    name: 'Filter Articles by Type (Material)',
    category: 'Articles',
    description: 'Get only material type articles',
    dependsOn: ['articles-get-service-by-id'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Articles?type=material&pageSize=100');
      if (status === 200) {
        const articles = data?.data || data?.articles || (Array.isArray(data) ? data : []);
        const count = articles.length || data?.pagination?.total || 0;
        return { success: true, details: `✓ Found ${count} MATERIAL articles (type=material)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'articles-filter-by-type-service',
    name: 'Filter Articles by Type (Service)',
    category: 'Articles',
    description: 'Get only service type articles',
    dependsOn: ['articles-filter-by-type-material'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Articles?type=service&pageSize=100');
      if (status === 200) {
        const articles = data?.data || data?.articles || (Array.isArray(data) ? data : []);
        const count = articles.length || data?.pagination?.total || 0;
        return { success: true, details: `✓ Found ${count} SERVICE articles (type=service)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'articles-search',
    name: 'Search Articles',
    category: 'Articles',
    description: 'Search across all article types',
    dependsOn: ['articles-filter-by-type-service'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Articles?search=Service');
      if (status === 200) {
        const articles = data?.data || data?.articles || (Array.isArray(data) ? data : []);
        const count = articles.length || data?.pagination?.total || 0;
        return { success: true, details: `✓ Search "Service" returned ${count} results`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============================================================================
  // UPDATE OPERATIONS
  // ============================================================================
  {
    id: 'articles-update-material',
    name: 'Update Material Stock & Price',
    category: 'Articles',
    description: 'Update material inventory and pricing',
    dependsOn: ['articles-search'],
    test: async () => {
      if (!testDataIds['test-material-1']) {
        return { success: false, error: 'No test material ID available' };
      }
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Articles/${testDataIds['test-material-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: `UpdatedCopperWire_${Date.now()}`,
          salesPrice: 5.49,
          stockQuantity: 750,
          description: 'Updated: Premium copper wire - now with better pricing',
        }),
      });
      if (status === 200) {
        return { success: true, details: `✓ Updated MATERIAL: stock=750, price=$5.49`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'articles-update-service',
    name: 'Update Service Rate',
    category: 'Articles',
    description: 'Update service pricing',
    dependsOn: ['articles-update-material'],
    test: async () => {
      if (!testDataIds['test-service-1']) {
        return { success: false, error: 'No test service ID available' };
      }
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Articles/${testDataIds['test-service-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: `UpdatedInstallService_${Date.now()}`,
          salesPrice: 95.00,
          duration: 150,         // Updated duration to 2.5 hours
          description: 'Updated: Premium installation service with warranty',
        }),
      });
      if (status === 200) {
        return { success: true, details: `✓ Updated SERVICE: rate=$95/hr, duration=150min`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============================================================================
  // DELETE OPERATIONS
  // ============================================================================
  {
    id: 'articles-delete-material',
    name: 'Delete One Material',
    category: 'Articles',
    description: 'Delete material #1 (keep #2, #3)',
    dependsOn: ['articles-update-service'],
    test: async () => {
      if (!testDataIds['test-material-1']) {
        return { success: false, error: 'No test material to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/Articles/${testDataIds['test-material-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-material-1'];
        delete testDataIds['test-material-1'];
        return { success: true, details: `✓ Deleted MATERIAL ID: ${deletedId}`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'articles-delete-service',
    name: 'Delete One Service',
    category: 'Articles',
    description: 'Delete service #1 (keep #2, #3)',
    dependsOn: ['articles-delete-material'],
    test: async () => {
      if (!testDataIds['test-service-1']) {
        return { success: false, error: 'No test service to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/Articles/${testDataIds['test-service-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-service-1'];
        delete testDataIds['test-service-1'];
        return { success: true, details: `✓ Deleted SERVICE ID: ${deletedId}`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============================================================================
  // FINAL LIST (ALWAYS LAST BEFORE CLEANUP)
  // ============================================================================
  {
    id: 'articles-list-all',
    name: 'List All Articles (Final)',
    category: 'Articles',
    description: 'Fetch all articles - shows final state with materials & services',
    dependsOn: ['articles-delete-service'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Articles?pageSize=100');
      if (status === 200) {
        const articles = data?.data || data?.articles || (Array.isArray(data) ? data : []);
        const count = articles.length || data?.pagination?.total || 0;
        const materials = articles.filter((a: any) => a.type === 'material').length;
        const services = articles.filter((a: any) => a.type === 'service').length;
        const names = articles.slice(0, 5).map((a: any) => `${a.name}(${a.type})`).join(', ');
        return { success: true, details: `✓ Total: ${count} articles | Materials: ${materials} | Services: ${services} | [${names}${count > 5 ? '...' : ''}]`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============================================================================
  // CLEANUP
  // ============================================================================
  {
    id: 'articles-cleanup',
    name: 'Cleanup All Test Articles',
    category: 'Articles',
    description: 'Delete remaining test materials & services',
    dependsOn: ['articles-list-all'],
    test: async () => {
      let cleaned = 0;
      let lastRequestData: any, lastResponseData: any;
      const keysToClean = ['test-material-2', 'test-material-3', 'test-service-2', 'test-service-3'];
      
      for (const key of keysToClean) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/Articles/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) cleaned++;
          delete testDataIds[key];
        }
      }
      return { success: true, details: `✓ Cleaned up ${cleaned} remaining articles (materials + services)`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
    },
  },
];
