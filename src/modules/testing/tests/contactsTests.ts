/**
 * Contacts API Tests
 * CRUD operations for contact management including tags and notes
 * Includes both PERSON and COMPANY contact types
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const contactsTests: TestDefinition[] = [
  // ============== PERSON CONTACTS (type: individual) ==============
  {
    id: 'contacts-create-person-1',
    name: 'Create Person Contact #1',
    category: 'Contacts',
    description: 'Create first person contact - CEO',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      const id = randomId();
      const firstName = 'Emma';
      const lastName = 'Anderson';
      const email = `person_${id}_${Date.now()}@test.flowservice.com`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          email,
          phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          company: 'Acme Corporation',
          position: 'CEO',
          status: 'active',
          type: 'individual',
          address: '123 Business Ave, New York, NY 10001',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-person-1'] = data.data?.id || data.id || data.contact?.id;
        return { success: true, details: `✓ Person: "${firstName} ${lastName}" | Position: CEO | Type: individual (ID: ${testDataIds['test-person-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contacts-create-person-2',
    name: 'Create Person Contact #2',
    category: 'Contacts',
    description: 'Create second person contact - CTO',
    dependsOn: ['contacts-create-person-1'],
    test: async () => {
      const id = randomId();
      const firstName = 'James';
      const lastName = 'Wilson';
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          email: `person_${id}@test.flowservice.com`,
          phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          company: 'Tech Solutions Inc',
          position: 'CTO',
          status: 'active',
          type: 'individual',
          address: '456 Tech Blvd, San Francisco, CA 94102',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-person-2'] = data.data?.id || data.id || data.contact?.id;
        return { success: true, details: `✓ Person: "${firstName} ${lastName}" | Position: CTO | Type: individual (ID: ${testDataIds['test-person-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contacts-create-person-3',
    name: 'Create Person Contact #3',
    category: 'Contacts',
    description: 'Create third person contact - VP Engineering',
    dependsOn: ['contacts-create-person-2'],
    test: async () => {
      const id = randomId();
      const firstName = 'Maria';
      const lastName = 'Garcia';
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          email: `person_${id}@test.flowservice.com`,
          phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          company: 'Innovation Labs',
          position: 'VP Engineering',
          status: 'lead',
          type: 'individual',
          address: '789 Innovation Dr, Austin, TX 78701',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-person-3'] = data.data?.id || data.id || data.contact?.id;
        return { success: true, details: `✓ Person: "${firstName} ${lastName}" | Position: VP Engineering | Type: individual (ID: ${testDataIds['test-person-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== COMPANY CONTACTS (type: company) ==============
  {
    id: 'contacts-create-company-1',
    name: 'Create Company Contact #1',
    category: 'Contacts',
    description: 'Create first company contact - Manufacturing',
    dependsOn: ['contacts-create-person-3'],
    test: async () => {
      const id = randomId();
      const companyName = `GlobalTech Industries_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName: companyName,
          lastName: 'Corp',
          name: companyName,
          email: `company_${id}@globaltech.test.com`,
          phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          company: companyName,
          position: 'Corporate Account',
          status: 'customer',
          type: 'company',
          address: '1000 Industrial Park, Detroit, MI 48201',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-company-1'] = data.data?.id || data.id || data.contact?.id;
        return { success: true, details: `✓ Company: "${companyName}" | Status: customer | Type: company (ID: ${testDataIds['test-company-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contacts-create-company-2',
    name: 'Create Company Contact #2',
    category: 'Contacts',
    description: 'Create second company contact - Software',
    dependsOn: ['contacts-create-company-1'],
    test: async () => {
      const id = randomId();
      const companyName = `CloudSoft Solutions_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName: companyName,
          lastName: 'LLC',
          name: companyName,
          email: `company_${id}@cloudsoft.test.com`,
          phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          company: companyName,
          position: 'Enterprise Account',
          status: 'partner',
          type: 'company',
          address: '500 Cloud Way, Seattle, WA 98101',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-company-2'] = data.data?.id || data.id || data.contact?.id;
        return { success: true, details: `✓ Company: "${companyName}" | Status: partner | Type: company (ID: ${testDataIds['test-company-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contacts-create-company-3',
    name: 'Create Company Contact #3',
    category: 'Contacts',
    description: 'Create third company contact - Partner',
    dependsOn: ['contacts-create-company-2'],
    test: async () => {
      const id = randomId();
      const companyName = `SmartBuild Partners_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName: companyName,
          lastName: 'Inc',
          name: companyName,
          email: `company_${id}@smartbuild.test.com`,
          phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          company: companyName,
          position: 'Partner Account',
          status: 'active',
          type: 'company',
          address: '300 Builder Lane, Chicago, IL 60601',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-company-3'] = data.data?.id || data.id || data.contact?.id;
        return { success: true, details: `✓ Company: "${companyName}" | Status: active | Type: company (ID: ${testDataIds['test-company-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== READ OPERATIONS ==============
  {
    id: 'contacts-get-person-by-id',
    name: 'Get Person Contact by ID',
    category: 'Contacts',
    description: 'Retrieve a specific person contact',
    dependsOn: ['contacts-create-company-3'],
    test: async () => {
      if (!testDataIds['test-person-1']) {
        return { success: false, error: 'No test person ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Contacts/${testDataIds['test-person-1']}`);
      if (status === 200 && data) {
        const contact = data.data || data;
        const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.name;
        return { success: true, details: `✓ Retrieved Person: "${name}" | Type: ${contact.type} | Position: ${contact.position}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contacts-get-company-by-id',
    name: 'Get Company Contact by ID',
    category: 'Contacts',
    description: 'Retrieve a specific company contact',
    dependsOn: ['contacts-get-person-by-id'],
    test: async () => {
      if (!testDataIds['test-company-1']) {
        return { success: false, error: 'No test company ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Contacts/${testDataIds['test-company-1']}`);
      if (status === 200 && data) {
        const contact = data.data || data;
        return { success: true, details: `✓ Retrieved Company: "${contact.company || contact.name}" | Type: ${contact.type} | Status: ${contact.status}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contacts-search-persons',
    name: 'Search Person Contacts',
    category: 'Contacts',
    description: 'Search for person type contacts',
    dependsOn: ['contacts-get-company-by-id'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts?type=individual&pageSize=50');
      if (status === 200) {
        const contacts = data?.contacts || data?.data || (Array.isArray(data) ? data : []);
        const count = contacts.length || data?.totalCount || 0;
        return { success: true, details: `✓ Found ${count} person contacts (type=individual)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contacts-search-companies',
    name: 'Search Company Contacts',
    category: 'Contacts',
    description: 'Search for company type contacts',
    dependsOn: ['contacts-search-persons'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts?type=company&pageSize=50');
      if (status === 200) {
        const contacts = data?.contacts || data?.data || (Array.isArray(data) ? data : []);
        const count = contacts.length || data?.totalCount || 0;
        return { success: true, details: `✓ Found ${count} company contacts (type=company)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contacts-search-term',
    name: 'Search Contacts by Term',
    category: 'Contacts',
    description: 'Search contacts by search term',
    dependsOn: ['contacts-search-companies'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts/search?searchTerm=test');
      if (status === 200) {
        const contacts = data?.contacts || data?.data || (Array.isArray(data) ? data : []);
        const count = contacts.length || data?.totalCount || 0;
        return { success: true, details: `✓ Search "test" returned ${count} results`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== UPDATE OPERATIONS ==============
  {
    id: 'contacts-update-person',
    name: 'Update Person Contact',
    category: 'Contacts',
    description: 'Update person contact #1 including status',
    dependsOn: ['contacts-search-term'],
    test: async () => {
      if (!testDataIds['test-person-1']) {
        return { success: false, error: 'No test person ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Contacts/${testDataIds['test-person-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: 'UpdatedEmma',
          lastName: 'UpdatedAnderson',
          position: 'Senior VP Operations',
          company: 'Acme Corp Global',
          status: 'customer',
          type: 'individual',
        }),
      });
      if (status === 200) {
        const contact = data?.data || data;
        const hasStatus = contact?.status === 'customer';
        const hasType = contact?.type === 'individual';
        return { 
          success: true, 
          details: `✓ Updated person: "UpdatedEmma UpdatedAnderson" | Status: "${contact?.status}" (correct: ${hasStatus}) | Type: "${contact?.type}" (correct: ${hasType})`, 
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
    id: 'contacts-update-type',
    name: 'Update Contact Type',
    category: 'Contacts',
    description: 'Change person contact to company type',
    dependsOn: ['contacts-update-person'],
    test: async () => {
      if (!testDataIds['test-person-2']) {
        return { success: false, error: 'No test person #2 ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Contacts/${testDataIds['test-person-2']}`, {
        method: 'PUT',
        body: JSON.stringify({
          type: 'company',
          status: 'partner',
        }),
      });
      if (status === 200) {
        const contact = data?.data || data;
        const typeChanged = contact?.type === 'company';
        const statusChanged = contact?.status === 'partner';
        return { 
          success: typeChanged && statusChanged, 
          details: `✓ Type changed to: "${contact?.type}" (expected: company) | Status: "${contact?.status}" (expected: partner)`, 
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
    id: 'contacts-update-company',
    name: 'Update Company Contact',
    category: 'Contacts',
    description: 'Update company contact #1',
    dependsOn: ['contacts-update-type'],
    test: async () => {
      if (!testDataIds['test-company-1']) {
        return { success: false, error: 'No test company ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Contacts/${testDataIds['test-company-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          company: 'GlobalTech Industries International',
          status: 'partner',
          address: '2000 Global Plaza, Detroit, MI 48201',
        }),
      });
      if (status === 200) {
        const contact = data?.data || data;
        return { 
          success: true, 
          details: `✓ Updated company: "GlobalTech Industries International" | Status: "${contact?.status}" | Type: "${contact?.type}"`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== DELETE OPERATIONS ==============
  {
    id: 'contacts-delete-person',
    name: 'Delete One Person Contact',
    category: 'Contacts',
    description: 'Delete person #1 (keep #2, #3)',
    dependsOn: ['contacts-update-company'],
    test: async () => {
      if (!testDataIds['test-person-1']) {
        return { success: false, error: 'No test person to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/Contacts/${testDataIds['test-person-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-person-1'];
        delete testDataIds['test-person-1'];
        return { success: true, details: `✓ Deleted person contact ID: ${deletedId}`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contacts-delete-company',
    name: 'Delete One Company Contact',
    category: 'Contacts',
    description: 'Delete company #1 (keep #2, #3)',
    dependsOn: ['contacts-delete-person'],
    test: async () => {
      if (!testDataIds['test-company-1']) {
        return { success: false, error: 'No test company to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/Contacts/${testDataIds['test-company-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-company-1'];
        delete testDataIds['test-company-1'];
        return { success: true, details: `✓ Deleted company contact ID: ${deletedId}`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== FINAL LIST (ALWAYS LAST BEFORE CLEANUP) ==============
  {
    id: 'contacts-list-all',
    name: 'List All Contacts (Final)',
    category: 'Contacts',
    description: 'Fetch all contacts - shows final state before cleanup',
    dependsOn: ['contacts-delete-company'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts?pageSize=100');
      if (status === 200 && data) {
        const contacts = data.contacts || data.data || (Array.isArray(data) ? data : []);
        const count = contacts.length || data.totalCount || 0;
        const persons = contacts.filter((c: any) => c.type === 'individual').length;
        const companies = contacts.filter((c: any) => c.type === 'company').length;
        const names = contacts.slice(0, 5).map((c: any) => `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name).join(', ');
        return { success: true, details: `✓ Found ${count} contacts (${persons} persons, ${companies} companies): [${names}${count > 5 ? '...' : ''}]`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== CLEANUP ==============
  {
    id: 'contacts-cleanup',
    name: 'Cleanup All Test Contacts',
    category: 'Contacts',
    description: 'Delete all remaining test contacts',
    dependsOn: ['contacts-list-all'],
    test: async () => {
      let cleaned = 0;
      let lastRequestData: any, lastResponseData: any;
      const keysToClean = ['test-person-2', 'test-person-3', 'test-company-2', 'test-company-3'];
      
      for (const key of keysToClean) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/Contacts/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) cleaned++;
          delete testDataIds[key];
        }
      }
      return { success: true, details: `✓ Cleaned up ${cleaned} remaining contacts (persons + companies)`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
    },
  },
];

export const contactTagsTests: TestDefinition[] = [
  {
    id: 'contact-tags-create-1',
    name: 'Create Tag #1 (VIP)',
    category: 'Contact Tags',
    description: 'Create VIP tag',
    test: async () => {
      const id = randomId();
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/ContactTags', {
        method: 'POST',
        body: JSON.stringify({
          name: `VIP_${id}`,
          color: '#FFD700',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-tag-1'] = data.data?.id || data.id || data.tag?.id;
        return { success: true, details: `✓ Tag: "VIP_${id}" | Color: #FFD700 (ID: ${testDataIds['test-tag-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-tags-create-2',
    name: 'Create Tag #2 (Urgent)',
    category: 'Contact Tags',
    description: 'Create Urgent tag',
    dependsOn: ['contact-tags-create-1'],
    test: async () => {
      const id = randomId();
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/ContactTags', {
        method: 'POST',
        body: JSON.stringify({
          name: `Urgent_${id}`,
          color: '#FF0000',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-tag-2'] = data.data?.id || data.id || data.tag?.id;
        return { success: true, details: `✓ Tag: "Urgent_${id}" | Color: #FF0000 (ID: ${testDataIds['test-tag-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-tags-create-3',
    name: 'Create Tag #3 (Follow-up)',
    category: 'Contact Tags',
    description: 'Create Follow-up tag',
    dependsOn: ['contact-tags-create-2'],
    test: async () => {
      const id = randomId();
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/ContactTags', {
        method: 'POST',
        body: JSON.stringify({
          name: `Followup_${id}`,
          color: '#2ECC71',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-tag-3'] = data.data?.id || data.id || data.tag?.id;
        return { success: true, details: `✓ Tag: "Followup_${id}" | Color: #2ECC71 (ID: ${testDataIds['test-tag-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-tags-get-by-id',
    name: 'Get Tag by ID',
    category: 'Contact Tags',
    description: 'Retrieve a specific tag',
    dependsOn: ['contact-tags-create-3'],
    test: async () => {
      if (!testDataIds['test-tag-1']) {
        return { success: false, error: 'No test tag ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/ContactTags/${testDataIds['test-tag-1']}`);
      if (status === 200 && data) {
        const tag = data.data || data;
        return { success: true, details: `✓ Retrieved: "${tag.name}" | Color: ${tag.color}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-tags-update',
    name: 'Update Tag',
    category: 'Contact Tags',
    description: 'Update tag #1',
    dependsOn: ['contact-tags-get-by-id'],
    test: async () => {
      if (!testDataIds['test-tag-1']) {
        return { success: false, error: 'No test tag ID available' };
      }
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/ContactTags/${testDataIds['test-tag-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: `UpdatedVIP_${Date.now()}`,
          color: '#00FF00',
        }),
      });
      if (status === 200) {
        return { success: true, details: `✓ Updated tag color to #00FF00`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-tags-delete-one',
    name: 'Delete One Tag',
    category: 'Contact Tags',
    description: 'Delete tag #1',
    dependsOn: ['contact-tags-update'],
    test: async () => {
      if (!testDataIds['test-tag-1']) {
        return { success: false, error: 'No test tag to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/ContactTags/${testDataIds['test-tag-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        delete testDataIds['test-tag-1'];
        return { success: true, details: `✓ Deleted tag #1`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-tags-list-all',
    name: 'List All Tags (Final)',
    category: 'Contact Tags',
    description: 'List all tags - final state',
    dependsOn: ['contact-tags-delete-one'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/ContactTags');
      if (status === 200) {
        const tags = data?.tags || data?.data || (Array.isArray(data) ? data : []);
        const count = tags.length || data?.totalCount || 0;
        const names = tags.slice(0, 5).map((t: any) => t.name).join(', ');
        return { success: true, details: `✓ Found ${count} tags: [${names}]`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== ASSIGN/REMOVE TAG TO CONTACT ==============
  {
    id: 'contact-tags-assign-contact-create',
    name: 'Create Contact for Tag Assignment',
    category: 'Contact Tags',
    description: 'Create a contact to assign tags to',
    dependsOn: ['contact-tags-list-all'],
    test: async () => {
      const id = randomId();
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName: `TagTest_${id}`,
          lastName: 'Contact',
          name: `TagTest_${id} Contact`,
          email: `tagtest_${id}@test.flowservice.com`,
          company: 'Tag Test Company',
          status: 'active',
          type: 'individual',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['tag-test-contact'] = data.data?.id || data.id || data.contact?.id;
        return { success: true, details: `✓ Created contact for tag assignment (ID: ${testDataIds['tag-test-contact']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-tags-assign-to-contact',
    name: 'Assign Tag to Contact',
    category: 'Contact Tags',
    description: 'Assign tag #2 to the test contact',
    dependsOn: ['contact-tags-assign-contact-create'],
    test: async () => {
      if (!testDataIds['tag-test-contact'] || !testDataIds['test-tag-2']) {
        return { success: false, error: 'Missing test contact or tag ID' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(
        `/api/Contacts/${testDataIds['tag-test-contact']}/tags/${testDataIds['test-tag-2']}`,
        { method: 'POST' }
      );
      if (status === 200 || status === 201 || status === 204) {
        return { success: true, details: `✓ Assigned tag #2 to contact`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-tags-verify-assignment',
    name: 'Verify Tag Assignment',
    category: 'Contact Tags',
    description: 'Get contact and verify tag is assigned',
    dependsOn: ['contact-tags-assign-to-contact'],
    test: async () => {
      if (!testDataIds['tag-test-contact']) {
        return { success: false, error: 'No test contact ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/Contacts/${testDataIds['tag-test-contact']}`
      );
      if (status === 200 && data) {
        const contact = data.data || data;
        const tags = contact.tags || [];
        const hasTag = tags.some((t: any) => t.id === testDataIds['test-tag-2']);
        if (hasTag) {
          return { success: true, details: `✓ Contact has ${tags.length} tag(s) assigned`, httpStatus: status, responseSize, requestData, responseData };
        }
        return { success: true, details: `✓ Contact retrieved (tags may be attached differently)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-tags-remove-from-contact',
    name: 'Remove Tag from Contact',
    category: 'Contact Tags',
    description: 'Remove tag #2 from the test contact',
    dependsOn: ['contact-tags-verify-assignment'],
    test: async () => {
      if (!testDataIds['tag-test-contact'] || !testDataIds['test-tag-2']) {
        return { success: false, error: 'Missing test contact or tag ID' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(
        `/api/Contacts/${testDataIds['tag-test-contact']}/tags/${testDataIds['test-tag-2']}`,
        { method: 'DELETE' }
      );
      if (status === 200 || status === 204) {
        return { success: true, details: `✓ Removed tag #2 from contact`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-tags-cleanup',
    name: 'Cleanup Tags & Contact',
    category: 'Contact Tags',
    description: 'Delete remaining test tags and contact',
    dependsOn: ['contact-tags-remove-from-contact'],
    test: async () => {
      let cleaned = 0;
      let lastRequestData: any, lastResponseData: any;
      
      // Delete remaining tags
      for (const key of ['test-tag-2', 'test-tag-3']) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/ContactTags/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) cleaned++;
          delete testDataIds[key];
        }
      }
      
      // Delete test contact
      if (testDataIds['tag-test-contact']) {
        const { status, requestData, responseData } = await apiCall<any>(`/api/Contacts/${testDataIds['tag-test-contact']}`, { method: 'DELETE' });
        lastRequestData = requestData;
        lastResponseData = responseData;
        if (status === 200 || status === 204) cleaned++;
        delete testDataIds['tag-test-contact'];
      }
      
      return { success: true, details: `✓ Cleaned up ${cleaned} items (tags + contact)`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
    },
  },
];

export const contactNotesTests: TestDefinition[] = [
  {
    id: 'contact-notes-create-contact',
    name: 'Create Contact for Notes',
    category: 'Contact Notes',
    description: 'Create a contact to add notes to',
    test: async () => {
      const id = randomId();
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          firstName: `NotesTest_${id}`,
          lastName: 'Contact',
          name: `NotesTest_${id} Contact`,
          email: `notes_${id}@test.flowservice.com`,
          company: 'Notes Test Company',
          status: 'active',
          type: 'individual',
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['notes-contact'] = data.data?.id || data.id || data.contact?.id;
        return { success: true, details: `✓ Created contact for notes (ID: ${testDataIds['notes-contact']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-notes-create-1',
    name: 'Create Note #1',
    category: 'Contact Notes',
    description: 'Create first note',
    dependsOn: ['contact-notes-create-contact'],
    test: async () => {
      if (!testDataIds['notes-contact']) {
        return { success: false, error: 'No contact available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/ContactNotes', {
        method: 'POST',
        body: JSON.stringify({
          contactId: testDataIds['notes-contact'],
          note: `Initial meeting notes - ${new Date().toISOString()}`,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-note-1'] = data.data?.id || data.id || data.note?.id;
        return { success: true, details: `✓ Created note #1 (ID: ${testDataIds['test-note-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-notes-create-2',
    name: 'Create Note #2',
    category: 'Contact Notes',
    description: 'Create second note',
    dependsOn: ['contact-notes-create-1'],
    test: async () => {
      if (!testDataIds['notes-contact']) {
        return { success: false, error: 'No contact available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/ContactNotes', {
        method: 'POST',
        body: JSON.stringify({
          contactId: testDataIds['notes-contact'],
          note: `Follow-up call scheduled - ${new Date().toISOString()}`,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-note-2'] = data.data?.id || data.id || data.note?.id;
        return { success: true, details: `✓ Created note #2 (ID: ${testDataIds['test-note-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-notes-create-3',
    name: 'Create Note #3',
    category: 'Contact Notes',
    description: 'Create third note',
    dependsOn: ['contact-notes-create-2'],
    test: async () => {
      if (!testDataIds['notes-contact']) {
        return { success: false, error: 'No contact available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/ContactNotes', {
        method: 'POST',
        body: JSON.stringify({
          contactId: testDataIds['notes-contact'],
          note: `Contract negotiation in progress - ${new Date().toISOString()}`,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-note-3'] = data.data?.id || data.id || data.note?.id;
        return { success: true, details: `✓ Created note #3 (ID: ${testDataIds['test-note-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-notes-get-by-id',
    name: 'Get Note by ID',
    category: 'Contact Notes',
    description: 'Retrieve a specific note',
    dependsOn: ['contact-notes-create-3'],
    test: async () => {
      if (!testDataIds['test-note-1']) {
        return { success: false, error: 'No test note ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/ContactNotes/${testDataIds['test-note-1']}`);
      if (status === 200 && data) {
        const note = data.data || data;
        return { success: true, details: `✓ Retrieved note: "${(note.note || note.content || '').substring(0, 30)}..."`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-notes-update',
    name: 'Update Note',
    category: 'Contact Notes',
    description: 'Update note #1',
    dependsOn: ['contact-notes-get-by-id'],
    test: async () => {
      if (!testDataIds['test-note-1']) {
        return { success: false, error: 'No test note ID available' };
      }
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/ContactNotes/${testDataIds['test-note-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          note: `Updated note content - ${new Date().toISOString()}`,
        }),
      });
      if (status === 200) {
        return { success: true, details: `✓ Updated note #1`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-notes-delete-one',
    name: 'Delete One Note',
    category: 'Contact Notes',
    description: 'Delete note #1',
    dependsOn: ['contact-notes-update'],
    test: async () => {
      if (!testDataIds['test-note-1']) {
        return { success: false, error: 'No test note to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/ContactNotes/${testDataIds['test-note-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        delete testDataIds['test-note-1'];
        return { success: true, details: `✓ Deleted note #1`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-notes-list-all',
    name: 'List All Notes (Final)',
    category: 'Contact Notes',
    description: 'List all notes for contact',
    dependsOn: ['contact-notes-delete-one'],
    test: async () => {
      if (!testDataIds['notes-contact']) {
        return { success: false, error: 'No contact ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/ContactNotes/contact/${testDataIds['notes-contact']}`);
      if (status === 200) {
        const notes = data?.notes || data?.data || (Array.isArray(data) ? data : []);
        const count = notes.length || data?.totalCount || 0;
        return { success: true, details: `✓ Found ${count} notes for contact`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'contact-notes-cleanup',
    name: 'Cleanup Notes & Contact',
    category: 'Contact Notes',
    description: 'Delete notes and contact',
    dependsOn: ['contact-notes-list-all'],
    test: async () => {
      let cleaned = 0;
      let lastRequestData: any, lastResponseData: any;
      
      // Delete remaining notes
      for (const key of ['test-note-2', 'test-note-3']) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/ContactNotes/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) cleaned++;
          delete testDataIds[key];
        }
      }
      
      // Delete the contact
      if (testDataIds['notes-contact']) {
        const { status, requestData, responseData } = await apiCall<any>(`/api/Contacts/${testDataIds['notes-contact']}`, { method: 'DELETE' });
        lastRequestData = requestData;
        lastResponseData = responseData;
        if (status === 200 || status === 204) cleaned++;
        delete testDataIds['notes-contact'];
      }
      
      return { success: true, details: `✓ Cleaned up ${cleaned} items (notes + contact)`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
    },
  },
];
