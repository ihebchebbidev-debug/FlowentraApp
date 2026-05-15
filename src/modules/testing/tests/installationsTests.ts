/**
 * Installations API Tests
 * CRUD operations with multiple contacts and installations
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const installationsTests: TestDefinition[] = [
  {
    id: 'installations-create-contact-1',
    name: 'Create Contact #1 for Installation',
    category: 'Installations',
    description: 'Create first contact for installation testing',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      const id = randomId();
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName: `InstallOwner1_${id}`,
          lastName: 'TestContact',
          name: `InstallOwner1_${id} TestContact`,
          email: `install1_${id}@test.flowservice.com`,
          company: 'Alpha Installation Corp',
          phone: '+1-555-0101',
          status: 'active',
          type: 'customer',
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        const contact = data.data || data;
        testDataIds['install-contact-1'] = contact.id;
        return { 
          success: true, 
          details: `✓ Contact: "${contact.firstName} ${contact.lastName}" | Company: ${contact.company} (ID: ${contact.id})`, 
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
    id: 'installations-create-contact-2',
    name: 'Create Contact #2 for Installation',
    category: 'Installations',
    description: 'Create second contact for installation testing',
    dependsOn: ['installations-create-contact-1'],
    test: async () => {
      const id = randomId();
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName: `InstallOwner2_${id}`,
          lastName: 'TestContact',
          name: `InstallOwner2_${id} TestContact`,
          email: `install2_${id}@test.flowservice.com`,
          company: 'Beta Installation Inc',
          phone: '+1-555-0102',
          status: 'active',
          type: 'customer',
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        const contact = data.data || data;
        testDataIds['install-contact-2'] = contact.id;
        return { 
          success: true, 
          details: `✓ Contact: "${contact.firstName} ${contact.lastName}" | Company: ${contact.company} (ID: ${contact.id})`, 
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
    id: 'installations-create-contact-3',
    name: 'Create Contact #3 for Installation',
    category: 'Installations',
    description: 'Create third contact for installation testing',
    dependsOn: ['installations-create-contact-2'],
    test: async () => {
      const id = randomId();
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName: `InstallOwner3_${id}`,
          lastName: 'TestContact',
          name: `InstallOwner3_${id} TestContact`,
          email: `install3_${id}@test.flowservice.com`,
          company: 'Gamma Installation Ltd',
          phone: '+1-555-0103',
          status: 'active',
          type: 'customer',
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        const contact = data.data || data;
        testDataIds['install-contact-3'] = contact.id;
        return { 
          success: true, 
          details: `✓ Contact: "${contact.firstName} ${contact.lastName}" | Company: ${contact.company} (ID: ${contact.id})`, 
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
    id: 'installations-create-1',
    name: 'Create Installation #1 (HVAC System)',
    category: 'Installations',
    description: 'Create first installation linked to contact #1',
    dependsOn: ['installations-create-contact-3'],
    test: async () => {
      const id = randomId();
      const warrantyExpiry = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000); // 2 years
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Installations', {
        method: 'POST',
        body: JSON.stringify({
          contactId: testDataIds['install-contact-1'],
          name: `HVAC_System_${id}`,
          model: 'AC-3000',
          manufacturer: 'Carrier',
          category: 'HVAC',
          type: 'internal',
          siteAddress: '123 Alpha Street, New York, NY 10001, US',
          installationType: 'HVAC System',
          installationDate: new Date().toISOString(),
          status: 'active',
          warrantyExpiry: warrantyExpiry.toISOString(),
          notes: `HVAC_System_${id} - Central air conditioning system - 3 ton unit`,
          location: {
            address: '123 Alpha Street',
            city: 'New York',
            state: 'NY',
            country: 'US',
            zipCode: '10001'
          },
          warranty: {
            hasWarranty: true,
            warrantyFrom: new Date().toISOString().split('T')[0],
            warrantyTo: warrantyExpiry.toISOString().split('T')[0]
          }
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        const installation = data.data || data;
        testDataIds['test-installation-1'] = installation.id;
        return { 
          success: true, 
          details: `✓ Installation: "${installation.installationType || 'HVAC System'}" | Site: ${installation.siteAddress?.substring(0, 30)}... (ID: ${installation.id})`, 
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
    id: 'installations-create-2',
    name: 'Create Installation #2 (Solar Panels)',
    category: 'Installations',
    description: 'Create second installation linked to contact #2',
    dependsOn: ['installations-create-1'],
    test: async () => {
      const id = randomId();
      const warrantyExpiry = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000); // 10 years
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Installations', {
        method: 'POST',
        body: JSON.stringify({
          contactId: testDataIds['install-contact-2'],
          name: `Solar_Panels_${id}`,
          model: 'SolarMax 400W',
          manufacturer: 'SunPower',
          category: 'Energy',
          type: 'internal',
          siteAddress: '456 Beta Avenue, Los Angeles, CA 90001, US',
          installationType: 'Solar Panels',
          installationDate: new Date().toISOString(),
          status: 'active',
          warrantyExpiry: warrantyExpiry.toISOString(),
          notes: `Solar_Panels_${id} - Rooftop solar panel array - 20 panels`,
          location: {
            address: '456 Beta Avenue',
            city: 'Los Angeles',
            state: 'CA',
            country: 'US',
            zipCode: '90001'
          },
          warranty: {
            hasWarranty: true,
            warrantyFrom: new Date().toISOString().split('T')[0],
            warrantyTo: warrantyExpiry.toISOString().split('T')[0]
          }
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        const installation = data.data || data;
        testDataIds['test-installation-2'] = installation.id;
        return { 
          success: true, 
          details: `✓ Installation: "${installation.installationType || 'Solar Panels'}" | Site: ${installation.siteAddress?.substring(0, 30)}... (ID: ${installation.id})`, 
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
    id: 'installations-create-3',
    name: 'Create Installation #3 (Security System)',
    category: 'Installations',
    description: 'Create third installation linked to contact #3',
    dependsOn: ['installations-create-2'],
    test: async () => {
      const id = randomId();
      const warrantyExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Installations', {
        method: 'POST',
        body: JSON.stringify({
          contactId: testDataIds['install-contact-3'],
          name: `Security_System_${id}`,
          model: 'SecureCam Pro 8',
          manufacturer: 'ADT Security',
          category: 'Security',
          type: 'external',
          siteAddress: '789 Gamma Boulevard, Chicago, IL 60601, US',
          installationType: 'Security System',
          installationDate: new Date().toISOString(),
          status: 'active',
          warrantyExpiry: warrantyExpiry.toISOString(),
          notes: `Security_System_${id} - Complete home security system with 8 cameras`,
          location: {
            address: '789 Gamma Boulevard',
            city: 'Chicago',
            state: 'IL',
            country: 'US',
            zipCode: '60601'
          },
          warranty: {
            hasWarranty: true,
            warrantyFrom: new Date().toISOString().split('T')[0],
            warrantyTo: warrantyExpiry.toISOString().split('T')[0]
          }
        }),
      });
      
      if ((status === 200 || status === 201) && data) {
        const installation = data.data || data;
        testDataIds['test-installation-3'] = installation.id;
        return { 
          success: true, 
          details: `✓ Installation: "${installation.installationType || 'Security System'}" | Site: ${installation.siteAddress?.substring(0, 30)}... (ID: ${installation.id})`, 
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
    id: 'installations-list',
    name: 'List All Installations',
    category: 'Installations',
    description: 'Fetch all installations including newly created ones',
    dependsOn: ['installations-create-3'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Installations');
      if (status === 200) {
        const installations = data?.installations || data?.data || (Array.isArray(data) ? data : []);
        const count = installations.length || data?.totalCount || data?.pagination?.totalCount || 0;
        const types = installations.slice(0, 5).map((i: any) => i.installationType || `ID:${i.id}`).join(', ');
        return { 
          success: true, 
          details: `✓ Found ${count} installations: [${types}${count > 5 ? '...' : ''}]`, 
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
    id: 'installations-get-by-id',
    name: 'Get Installation by ID',
    category: 'Installations',
    description: 'Retrieve a specific installation by ID',
    dependsOn: ['installations-list'],
    test: async () => {
      const installId = testDataIds['test-installation-1'];
      if (!installId) {
        return { success: false, error: 'No installation ID available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Installations/${installId}`);
      if (status === 200 && data) {
        const installation = data.data || data;
        return { 
          success: true, 
          details: `✓ Retrieved: "${installation.installationType || 'N/A'}" | Status: ${installation.status || 'N/A'} | Site: ${installation.siteAddress?.substring(0, 25)}...`, 
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
    id: 'installations-search',
    name: 'Search Installations',
    category: 'Installations',
    description: 'Search for installations',
    dependsOn: ['installations-get-by-id'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Installations?searchTerm=System');
      if (status === 200) {
        const installations = data?.installations || data?.data || (Array.isArray(data) ? data : []);
        const count = installations.length || 0;
        return { 
          success: true, 
          details: `✓ Search "System" returned ${count} results`, 
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
    id: 'installations-update',
    name: 'Update Installation',
    category: 'Installations',
    description: 'Update an installation',
    dependsOn: ['installations-search'],
    test: async () => {
      const installId = testDataIds['test-installation-1'];
      if (!installId) {
        return { success: false, error: 'No installation ID available' };
      }
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Installations/${installId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated HVAC System',
          installationType: 'Updated HVAC System',
          status: 'maintenance',
          notes: `Updated via API test at ${new Date().toISOString()} - maintenance completed`,
          location: {
            address: '123 Alpha Street Updated',
            city: 'New York',
            state: 'NY',
            country: 'US',
            zipCode: '10002'
          }
        }),
      });
      
      if (status === 200) {
        return { 
          success: true, 
          details: `✓ Updated installation: "Updated HVAC System" | Status: maintenance`, 
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
    id: 'installations-delete-one',
    name: 'Delete Installation #1',
    category: 'Installations',
    description: 'Delete one installation (keep #2, #3)',
    dependsOn: ['installations-update'],
    test: async () => {
      const installId = testDataIds['test-installation-1'];
      if (!installId) {
        return { success: true, details: '✓ No installation to delete' };
      }
      
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Installations/${installId}`, {
        method: 'DELETE',
      });
      
      if (status === 200 || status === 204) {
        delete testDataIds['test-installation-1'];
        return { 
          success: true, 
          details: `✓ Deleted installation ID: ${installId} (kept installations #2, #3)`, 
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
    id: 'installations-final-list',
    name: 'Final List - Verify Remaining',
    category: 'Installations',
    description: 'List all installations after deletion to verify',
    dependsOn: ['installations-delete-one'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Installations');
      if (status === 200) {
        const installations = data?.installations || data?.data || (Array.isArray(data) ? data : []);
        const count = installations.length || data?.totalCount || data?.pagination?.totalCount || 0;
        const types = installations.slice(0, 5).map((i: any) => i.installationType || `ID:${i.id}`).join(', ');
        return { 
          success: true, 
          details: `✓ Remaining ${count} installations: [${types}${count > 5 ? '...' : ''}]`, 
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
    id: 'installations-cleanup',
    name: 'Cleanup Installations & Contacts',
    category: 'Installations',
    description: 'Clean up remaining test installations and contacts',
    dependsOn: ['installations-final-list'],
    test: async () => {
      let cleaned = 0;
      const errors: string[] = [];
      let lastRequestData: any, lastResponseData: any;
      
      // Delete remaining installations
      for (const key of ['test-installation-2', 'test-installation-3']) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/Installations/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) {
            cleaned++;
            delete testDataIds[key];
          } else {
            errors.push(`Install ${key}: ${status}`);
          }
        }
      }
      
      // Delete contacts
      for (const key of ['install-contact-1', 'install-contact-2', 'install-contact-3']) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/Contacts/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) {
            cleaned++;
            delete testDataIds[key];
          } else {
            errors.push(`Contact ${key}: ${status}`);
          }
        }
      }
      
      if (errors.length > 0) {
        return { success: true, details: `✓ Cleaned ${cleaned} items (some errors: ${errors.join(', ')})`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
      }
      return { success: true, details: `✓ Cleaned up ${cleaned} items (installations + contacts)`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
    },
  },
];
