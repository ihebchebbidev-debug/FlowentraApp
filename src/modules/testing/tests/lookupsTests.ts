/**
 * Lookups API Tests
 * Comprehensive CRUD tests for all lookup types
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

// Lookup types that support full CRUD operations
const lookupCrudTypes = [
  { type: 'priorities', name: 'Priority', sample: { name: 'TestPriority', description: 'Test priority item', color: '#FF5733', sortOrder: 100 } },
  { type: 'task-statuses', name: 'Task Status', sample: { name: 'TestStatus', description: 'Test task status', color: '#3498DB', sortOrder: 100 } },
  { type: 'project-statuses', name: 'Project Status', sample: { name: 'TestProjStatus', description: 'Test project status', color: '#2ECC71', sortOrder: 100 } },
  { type: 'event-types', name: 'Event Type', sample: { name: 'TestEvent', description: 'Test event type', color: '#9B59B6', sortOrder: 100 } },
  { type: 'article-categories', name: 'Article Category', sample: { name: 'TestCategory', description: 'Test article category', color: '#E74C3C', sortOrder: 100 } },
  { type: 'service-categories', name: 'Service Category', sample: { name: 'TestService', description: 'Test service category', color: '#1ABC9C', sortOrder: 100 } },
  { type: 'locations', name: 'Location', sample: { name: 'TestLocation', description: 'Test warehouse location', color: '#F39C12', sortOrder: 100 } },
];

// Generate comprehensive lookup tests
const generateLookupTests = (): TestDefinition[] => {
  const tests: TestDefinition[] = [];

  lookupCrudTypes.forEach(({ type, name, sample }, typeIndex) => {
    const typeKey = type.replace(/-/g, '_');
    
    // Create 3 items for each lookup type
    [1, 2, 3].forEach((num) => {
      tests.push({
        id: `lookups-${typeKey}-create-${num}`,
        name: `Create ${name} #${num}`,
        category: 'Lookups',
        description: `Create test ${name.toLowerCase()} item #${num}`,
        dependsOn: num > 1 
          ? [`lookups-${typeKey}-create-${num - 1}`] 
          : (typeIndex > 0 
            ? [`lookups-${lookupCrudTypes[typeIndex - 1].type.replace(/-/g, '_')}-cleanup`] 
            : ['setup-cleanup-old-data']),
        test: async () => {
          const id = randomId();
          const itemName = `${sample.name}_${num}_${id}`;
          
          const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Lookups/${type}`, {
            method: 'POST',
            body: JSON.stringify({
              name: itemName,
              description: `${sample.description} #${num} - Created at ${new Date().toISOString()}`,
              color: sample.color,
              isActive: true,
              sortOrder: sample.sortOrder + num,
            }),
          });
          if ((status === 200 || status === 201) && data) {
            testDataIds[`test-${typeKey}-${num}`] = data.data?.id || data.id || data.item?.id;
            return { success: true, details: `✓ ${name}: \"${itemName}\" | Color: ${sample.color} (ID: ${testDataIds[`test-${typeKey}-${num}`]})`, httpStatus: status, responseSize, requestData, responseData };
          }
          return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
        },
      });
    });

    // List all for this lookup type
    tests.push({
      id: `lookups-${typeKey}-list`,
      name: `List All ${name}s`,
      category: 'Lookups',
      description: `Fetch all ${name.toLowerCase()} items`,
      dependsOn: [`lookups-${typeKey}-create-3`],
      test: async () => {
        const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Lookups/${type}`);
        if (status === 200) {
          const items = data?.items || data?.data || (Array.isArray(data) ? data : []);
          const count = Array.isArray(items) ? items.length : data?.totalCount || 0;
          const names = items.length > 0 ? items.slice(0, 3).map((i: any) => i.name).join(', ') : 'none';
          return { success: true, details: `✓ Found ${count} ${name.toLowerCase()}s: [${names}${count > 3 ? '...' : ''}]`, httpStatus: status, responseSize, requestData, responseData };
        }
        return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
      },
    });

    // Update first item
    tests.push({
      id: `lookups-${typeKey}-update`,
      name: `Update ${name}`,
      category: 'Lookups',
      description: `Update test ${name.toLowerCase()} #1`,
      dependsOn: [`lookups-${typeKey}-list`],
      test: async () => {
        const itemId = testDataIds[`test-${typeKey}-1`];
        if (!itemId) {
          return { success: false, error: `No test ${name.toLowerCase()} ID available` };
        }
        const newName = `Updated${sample.name}_${Date.now()}`;
        const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Lookups/${type}/${itemId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: newName,
            description: `Updated ${name.toLowerCase()} via API test`,
            color: '#00FF00',
          }),
        });
        if (status === 200) {
          return { success: true, details: `✓ Updated ${name.toLowerCase()} to: \"${newName}\"`, httpStatus: status, responseSize, requestData, responseData };
        }
        return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
      },
    });

    // Delete first item (keep #2, #3)
    tests.push({
      id: `lookups-${typeKey}-delete`,
      name: `Delete One ${name}`,
      category: 'Lookups',
      description: `Delete ${name.toLowerCase()} #1 (keep #2, #3)`,
      dependsOn: [`lookups-${typeKey}-update`],
      test: async () => {
        const itemId = testDataIds[`test-${typeKey}-1`];
        if (!itemId) {
          return { success: false, error: `No test ${name.toLowerCase()} to delete` };
        }
        const { status, error, requestData, responseData } = await apiCall<any>(`/api/Lookups/${type}/${itemId}`, {
          method: 'DELETE',
        });
        if (status === 200 || status === 204) {
          const deletedId = testDataIds[`test-${typeKey}-1`];
          delete testDataIds[`test-${typeKey}-1`];
          return { success: true, details: `✓ Deleted ${name.toLowerCase()} ID: ${deletedId} (kept #2, #3)`, httpStatus: status, requestData, responseData };
        }
        return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
      },
    });

    // Get all to verify final state
    tests.push({
      id: `lookups-${typeKey}-verify`,
      name: `Verify ${name}s Final State`,
      category: 'Lookups',
      description: `Verify remaining ${name.toLowerCase()}s after delete`,
      dependsOn: [`lookups-${typeKey}-delete`],
      test: async () => {
        const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Lookups/${type}`);
        if (status === 200) {
          const items = data?.items || data?.data || (Array.isArray(data) ? data : []);
          const count = Array.isArray(items) ? items.length : data?.totalCount || 0;
          return { success: true, details: `✓ Verified: ${count} ${name.toLowerCase()}s remain after delete`, httpStatus: status, responseSize, requestData, responseData };
        }
        return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
      },
    });

    // Cleanup remaining items
    tests.push({
      id: `lookups-${typeKey}-cleanup`,
      name: `Cleanup ${name}s`,
      category: 'Lookups',
      description: `Delete remaining test ${name.toLowerCase()}s`,
      dependsOn: [`lookups-${typeKey}-verify`],
      test: async () => {
        let cleaned = 0;
        let lastRequestData: any, lastResponseData: any;
        for (const key of [`test-${typeKey}-2`, `test-${typeKey}-3`]) {
          if (testDataIds[key]) {
            const { status, requestData, responseData } = await apiCall<any>(`/api/Lookups/${type}/${testDataIds[key]}`, { method: 'DELETE' });
            lastRequestData = requestData;
            lastResponseData = responseData;
            if (status === 200 || status === 204) cleaned++;
            delete testDataIds[key];
          }
        }
        return { success: true, details: `✓ Cleaned up ${cleaned} remaining ${name.toLowerCase()}s`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
      },
    });
  });

  // Add currencies get test (currencies have different structure)
  tests.push({
    id: 'lookups-currencies-list',
    name: 'Get Currencies',
    category: 'Lookups',
    description: 'Fetch all currencies',
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Lookups/currencies');
      if (status === 200) {
        const currencies = data?.currencies || data?.items || (Array.isArray(data) ? data : []);
        const count = currencies.length || data?.totalCount || 0;
        const names = currencies.length > 0 ? currencies.slice(0, 3).map((c: any) => `${c.code} (${c.symbol})`).join(', ') : 'none';
        return { success: true, details: `✓ Found ${count} currencies: [${names}${count > 3 ? '...' : ''}]`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  });

  return tests;
};

export const lookupsTests: TestDefinition[] = generateLookupTests();
