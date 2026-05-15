/**
 * Offers API Tests
 * CRUD operations for offer management including items and workflow conversions
 * Tests the Offer → Sale conversion workflow
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const offersTests: TestDefinition[] = [
  // ============== CLEANUP OLD TEST DATA ==============
  {
    id: 'offers-cleanup',
    name: 'Cleanup Old Test Offers',
    category: 'Offers',
    description: 'Delete old test offers to prevent duplicate OfferNumber conflicts',
    dependsOn: ['installations-cleanup'],
    test: async () => {
      // Fetch all offers
      const { data, status } = await apiCall<any>('/api/offers?page=1&limit=200');
      if (status !== 200) {
        return { success: true, details: '⊘ Could not fetch offers for cleanup' };
      }

      // Handle paginated response - items might be in data.items, data.data, data.offers, or data itself
      const offers = data?.items || data?.offers || data?.data || (Array.isArray(data) ? data : []);

      if (!Array.isArray(offers)) {
        return { success: true, details: '⊘ No offers array found in response' };
      }

      // Find test offers (matching test patterns)
      const testOffers = offers.filter((o: any) =>
        o.title?.toLowerCase().includes('test offer') ||
        o.title?.toLowerCase().includes('apitest') ||
        o.description?.toLowerCase().includes('api testing') ||
        o.description?.toLowerCase().includes('test offer')
      );

      let deletedCount = 0;
      for (const offer of testOffers) {
        const deleteResult = await apiCall<any>(`/api/offers/${offer.id}`, { method: 'DELETE' });
        if (deleteResult.status === 200 || deleteResult.status === 204) {
          deletedCount++;
        }
      }

      return {
        success: true,
        details: `✓ Cleaned up ${deletedCount} old test offers (found ${testOffers.length})`
      };
    },
  },

  // ============== CREATE OPERATIONS ==============
  {
    id: 'offers-create-1',
    name: 'Create Offer #1 (Materials Only)',
    category: 'Offers',
    description: 'Create first offer with material items only',
    dependsOn: ['offers-cleanup'],
    test: async () => {
      const id = randomId();
      const title = `Test Offer Materials ${id}`;

      // Create a contact first for offers if none exists
      let contactId = testDataIds['test-person-2'] || testDataIds['test-company-2'];

      if (!contactId) {
        // Create a contact for offers tests
        const contactResult = await apiCall<any>('/api/contacts', {
          method: 'POST',
          body: JSON.stringify({
            firstName: `OfferContact_${id}`,
            lastName: 'TestContact',
            email: `offercontact_${id}@test.flowservice.com`,
            type: 'individual',
            status: 'active',
          }),
        });
        if ((contactResult.status === 200 || contactResult.status === 201) && contactResult.data) {
          contactId = contactResult.data.data?.id || contactResult.data.id;
          testDataIds['offers-test-contact'] = contactId;
        }
      }

      if (!contactId) {
        return { success: false, error: 'Could not create or find a contact for offers test' };
      }

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: 'Test offer with material items only for API testing',
          contactId,
          status: 'draft',
          category: 'potential',
          source: 'direct_customer',
          currency: 'TND',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          taxes: 19,
          discount: 0,
          items: [
            {
              type: 'article',
              // articleId omitted - FK constraint prevents fake IDs
              itemName: 'Test Material Item',
              itemCode: 'MAT-001',
              quantity: 5,
              unitPrice: 100,
              discount: 0,
              discountType: 'percentage',
            },
            {
              type: 'article',
              itemName: 'Test Material Item 2',
              itemCode: 'MAT-002',
              quantity: 3,
              unitPrice: 150,
              discount: 10,
              discountType: 'percentage',
            },
          ],
        }),
      });

      if ((status === 200 || status === 201) && data) {
        const offerId = data.data?.id || data.id || data.offer?.id;
        testDataIds['test-offer-materials'] = offerId;
        return {
          success: true,
          details: `✓ Offer: "${title}" | Type: Materials Only | Status: draft (ID: ${offerId})`,
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
    id: 'offers-create-2',
    name: 'Create Offer #2 (Services Only)',
    category: 'Offers',
    description: 'Create second offer with service items only',
    dependsOn: ['offers-create-1'],
    test: async () => {
      const id = randomId();
      const title = `Test Offer Services ${id}`;

      const contactId = testDataIds['test-person-2'] || testDataIds['test-company-2'] || testDataIds['offers-test-contact'];
      if (!contactId) {
        return { success: false, error: 'No contact available for offer creation' };
      }
      const installationId = String(testDataIds['test-installation-2'] || testDataIds['test-installation-1'] || '1');

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: 'Test offer with service items - will create ServiceOrder when converted',
          contactId,
          status: 'draft',
          category: 'big_project',
          source: 'referral',
          currency: 'TND',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          taxes: 19,
          discount: 5,
          items: [
            {
              type: 'service',
              // articleId omitted - FK constraint prevents fake IDs
              itemName: 'HVAC Maintenance Service',
              itemCode: 'SVC-001',
              quantity: 1,
              unitPrice: 500,
              discount: 0,
              discountType: 'percentage',
              installationId,
              installationName: 'Main HVAC Unit',
            },
            {
              type: 'service',
              itemName: 'Equipment Inspection',
              itemCode: 'SVC-002',
              quantity: 2,
              unitPrice: 200,
              discount: 0,
              discountType: 'fixed',
              installationId,
              installationName: 'Main HVAC Unit',
            },
          ],
        }),
      });

      if ((status === 200 || status === 201) && data) {
        const offerId = data.data?.id || data.id || data.offer?.id;
        testDataIds['test-offer-services'] = offerId;
        return {
          success: true,
          details: `✓ Offer: "${title}" | Type: Services Only | Status: draft (ID: ${offerId})`,
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
    id: 'offers-create-3',
    name: 'Create Offer #3 (Mixed Items)',
    category: 'Offers',
    description: 'Create third offer with both materials and services',
    dependsOn: ['offers-create-2'],
    test: async () => {
      const id = randomId();
      const title = `Test Offer Mixed ${id}`;

      const contactId = testDataIds['test-person-3'] || testDataIds['test-company-3'] || testDataIds['offers-test-contact'];
      if (!contactId) {
        return { success: false, error: 'No contact available for offer creation' };
      }
      const installationId = String(testDataIds['test-installation-3'] || testDataIds['test-installation-1'] || '1');

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: 'Test offer with mixed items (materials + services)',
          contactId,
          status: 'sent',
          category: 'likely_to_close',
          source: 'website',
          currency: 'EUR',
          validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          taxes: 20,
          discount: 10,
          items: [
            {
              type: 'article',
              itemName: 'Replacement Parts Kit',
              itemCode: 'MAT-010',
              quantity: 1,
              unitPrice: 350,
              discount: 0,
            },
            {
              type: 'service',
              itemName: 'Installation Service',
              itemCode: 'SVC-010',
              quantity: 1,
              unitPrice: 400,
              discount: 0,
              installationId,
              installationName: 'Customer Installation',
            },
          ],
        }),
      });

      if ((status === 200 || status === 201) && data) {
        const offerId = data.data?.id || data.id || data.offer?.id;
        testDataIds['test-offer-mixed'] = offerId;
        return {
          success: true,
          details: `✓ Offer: "${title}" | Type: Mixed | Status: sent (ID: ${offerId})`,
          httpStatus: status,
          responseSize,
          requestData,
          responseData
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  // ============== ADDITIONAL OFFERS FOR VOLUME TESTING ==============
  {
    id: 'offers-create-4',
    name: 'Create Offer #4 (High Value Enterprise)',
    category: 'Offers',
    description: 'Create high-value enterprise offer',
    dependsOn: ['offers-create-3'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-company-1'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers', {
        method: 'POST',
        body: JSON.stringify({
          title: `Enterprise Package ${id}`,
          description: 'High-value enterprise annual maintenance contract',
          contactId,
          status: 'sent',
          category: 'big_project',
          source: 'direct_customer',
          currency: 'EUR',
          validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          taxes: 20,
          discount: 15,
          items: [
            { type: 'service', itemName: 'Annual Enterprise Support', itemCode: 'ENT-001', quantity: 1, unitPrice: 25000, discount: 10 },
            { type: 'service', itemName: '24/7 Priority Response', itemCode: 'ENT-002', quantity: 12, unitPrice: 2500, discount: 5 },
            { type: 'article', itemName: 'Enterprise Hardware Kit', itemCode: 'ENT-HW', quantity: 5, unitPrice: 3500, discount: 0 },
          ],
        }),
      });

      if ((status === 200 || status === 201) && data) {
        testDataIds['test-offer-enterprise'] = data.data?.id || data.id;
        return { success: true, details: `✓ Enterprise Offer created (€75,000+ value)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'offers-create-5',
    name: 'Create Offer #5 (Urgent Repair)',
    category: 'Offers',
    description: 'Create urgent repair offer',
    dependsOn: ['offers-create-4'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-person-1'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };
      const installationId = String(testDataIds['test-installation-1'] || '1');

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers', {
        method: 'POST',
        body: JSON.stringify({
          title: `Urgent Repair ${id}`,
          description: 'Emergency repair service for critical system failure',
          contactId,
          status: 'draft',
          category: 'potential',
          source: 'phone',
          currency: 'TND',
          validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          taxes: 19,
          discount: 0,
          items: [
            { type: 'service', itemName: 'Emergency Diagnostic', itemCode: 'URG-001', quantity: 1, unitPrice: 350, discount: 0, installationId },
            { type: 'service', itemName: 'Critical Repair Labor', itemCode: 'URG-002', quantity: 4, unitPrice: 150, discount: 0, installationId },
            { type: 'article', itemName: 'Emergency Parts', itemCode: 'URG-PARTS', quantity: 1, unitPrice: 800, discount: 0 },
          ],
        }),
      });

      if ((status === 200 || status === 201) && data) {
        testDataIds['test-offer-urgent'] = data.data?.id || data.id;
        return { success: true, details: `✓ Urgent Repair Offer created`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'offers-create-6',
    name: 'Create Offer #6 (Multi-Site)',
    category: 'Offers',
    description: 'Create multi-site installation offer',
    dependsOn: ['offers-create-5'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-company-2'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers', {
        method: 'POST',
        body: JSON.stringify({
          title: `Multi-Site Project ${id}`,
          description: 'Installation services across 5 locations',
          contactId,
          status: 'negotiation',
          category: 'big_project',
          source: 'referral',
          currency: 'USD',
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          taxes: 10,
          discount: 20,
          items: [
            { type: 'service', itemName: 'Site Survey (per site)', itemCode: 'MS-001', quantity: 5, unitPrice: 1500, discount: 0 },
            { type: 'service', itemName: 'Installation (per site)', itemCode: 'MS-002', quantity: 5, unitPrice: 8000, discount: 10 },
            { type: 'service', itemName: 'Training (per site)', itemCode: 'MS-003', quantity: 5, unitPrice: 2000, discount: 0 },
            { type: 'article', itemName: 'Equipment Package', itemCode: 'MS-EQ', quantity: 5, unitPrice: 12000, discount: 15 },
          ],
        }),
      });

      if ((status === 200 || status === 201) && data) {
        testDataIds['test-offer-multisite'] = data.data?.id || data.id;
        return { success: true, details: `✓ Multi-Site Offer created ($100K+ project)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'offers-create-7',
    name: 'Create Offer #7 (Subscription)',
    category: 'Offers',
    description: 'Create monthly subscription offer',
    dependsOn: ['offers-create-6'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-person-2'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers', {
        method: 'POST',
        body: JSON.stringify({
          title: `Maintenance Subscription ${id}`,
          description: 'Monthly preventive maintenance subscription',
          contactId,
          status: 'accepted',
          category: 'likely_to_close',
          source: 'website',
          currency: 'TND',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          taxes: 19,
          discount: 0,
          items: [
            { type: 'service', itemName: 'Monthly Inspection', itemCode: 'SUB-001', quantity: 12, unitPrice: 450, discount: 0 },
            { type: 'service', itemName: 'Quarterly Deep Clean', itemCode: 'SUB-002', quantity: 4, unitPrice: 800, discount: 0 },
            { type: 'article', itemName: 'Filter Replacements', itemCode: 'SUB-FILT', quantity: 12, unitPrice: 75, discount: 0 },
          ],
        }),
      });

      if ((status === 200 || status === 201) && data) {
        testDataIds['test-offer-subscription'] = data.data?.id || data.id;
        return { success: true, details: `✓ Subscription Offer created (12-month)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'offers-create-8',
    name: 'Create Offer #8 (Small Business)',
    category: 'Offers',
    description: 'Create small business starter offer',
    dependsOn: ['offers-create-7'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-person-3'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers', {
        method: 'POST',
        body: JSON.stringify({
          title: `Starter Package ${id}`,
          description: 'Affordable starter package for small businesses',
          contactId,
          status: 'draft',
          category: 'potential',
          source: 'cold_call',
          currency: 'TND',
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          taxes: 19,
          discount: 5,
          items: [
            { type: 'service', itemName: 'Basic Installation', itemCode: 'STR-001', quantity: 1, unitPrice: 500, discount: 0 },
            { type: 'article', itemName: 'Basic Equipment Set', itemCode: 'STR-EQ', quantity: 1, unitPrice: 1500, discount: 0 },
          ],
        }),
      });

      if ((status === 200 || status === 201) && data) {
        testDataIds['test-offer-starter'] = data.data?.id || data.id;
        return { success: true, details: `✓ Starter Package Offer created`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'offers-create-9',
    name: 'Create Offer #9 (Declined Example)',
    category: 'Offers',
    description: 'Create an offer that will be declined',
    dependsOn: ['offers-create-8'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-company-3'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers', {
        method: 'POST',
        body: JSON.stringify({
          title: `Premium Package ${id}`,
          description: 'Premium offer that was declined due to budget constraints',
          contactId,
          status: 'declined',
          category: 'big_project',
          source: 'direct_customer',
          currency: 'EUR',
          validUntil: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          taxes: 20,
          discount: 0,
          items: [
            { type: 'service', itemName: 'Premium Support', itemCode: 'PREM-001', quantity: 1, unitPrice: 15000, discount: 0 },
            { type: 'article', itemName: 'Premium Hardware', itemCode: 'PREM-HW', quantity: 3, unitPrice: 8000, discount: 0 },
          ],
        }),
      });

      if ((status === 200 || status === 201) && data) {
        testDataIds['test-offer-declined'] = data.data?.id || data.id;
        return { success: true, details: `✓ Declined Offer created`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'offers-create-10',
    name: 'Create Offer #10 (Expiring Soon)',
    category: 'Offers',
    description: 'Create an offer expiring soon',
    dependsOn: ['offers-create-9'],
    test: async () => {
      const id = randomId();
      const contactId = testDataIds['test-person-1'] || testDataIds['offers-test-contact'];
      if (!contactId) return { success: false, error: 'No contact available' };

      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers', {
        method: 'POST',
        body: JSON.stringify({
          title: `Limited Time Offer ${id}`,
          description: 'Special pricing - expires in 2 days!',
          contactId,
          status: 'sent',
          category: 'likely_to_close',
          source: 'promotion',
          currency: 'TND',
          validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          taxes: 19,
          discount: 25,
          items: [
            { type: 'service', itemName: 'Promotional Service', itemCode: 'PROMO-001', quantity: 1, unitPrice: 2000, discount: 25 },
            { type: 'article', itemName: 'Bonus Equipment', itemCode: 'PROMO-EQ', quantity: 2, unitPrice: 500, discount: 50 },
          ],
        }),
      });

      if ((status === 200 || status === 201) && data) {
        testDataIds['test-offer-expiring'] = data.data?.id || data.id;
        return { success: true, details: `✓ Expiring Soon Offer created (25% off)`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },

  // ============== READ OPERATIONS ==============
  {
    id: 'offers-get-by-id',
    name: 'Get Offer by ID',
    category: 'Offers',
    description: 'Retrieve a specific offer with items',
    dependsOn: ['offers-create-10'],
    test: async () => {
      if (!testDataIds['test-offer-materials']) {
        return { success: false, error: 'No test offer ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/offers/${testDataIds['test-offer-materials']}`);
      if (status === 200 && data) {
        const offer = data.data || data;
        const itemCount = offer.items?.length || 0;
        return {
          success: true,
          details: `✓ Retrieved Offer: "${offer.title}" | Items: ${itemCount} | Status: ${offer.status}`,
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
    id: 'offers-list-all',
    name: 'List All Offers',
    category: 'Offers',
    description: 'Fetch all offers with pagination',
    dependsOn: ['offers-get-by-id'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers?page=1&limit=50');
      if (status === 200) {
        // Handle wrapped response: { success: true, data: { offers: [...], pagination: {...} } }
        const responseData2 = data?.data || data;
        const offers = responseData2?.offers || responseData2?.items || (Array.isArray(responseData2) ? responseData2 : []);
        const total = responseData2?.pagination?.total || offers.length;
        return {
          success: true,
          details: `✓ Listed ${offers.length} offers (Total: ${total})`,
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
    id: 'offers-filter-by-status',
    name: 'Filter Offers by Status',
    category: 'Offers',
    description: 'Filter offers by draft status',
    dependsOn: ['offers-list-all'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers?status=draft');
      if (status === 200) {
        const responseData2 = data?.data || data;
        const offers = responseData2?.offers || responseData2?.items || (Array.isArray(responseData2) ? responseData2 : []);
        return {
          success: true,
          details: `✓ Found ${offers.length} draft offers`,
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
    id: 'offers-get-stats',
    name: 'Get Offer Statistics',
    category: 'Offers',
    description: 'Retrieve offer statistics',
    dependsOn: ['offers-filter-by-status'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers/stats');
      if (status === 200 && data) {
        const stats = data.data || data;
        return {
          success: true,
          details: `✓ Stats: Total=${stats.totalOffers || 0} | Active=${stats.activeOffers || 0} | Accepted=${stats.acceptedOffers || 0}`,
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
    id: 'offers-update',
    name: 'Update Offer',
    category: 'Offers',
    description: 'Update offer details',
    dependsOn: ['offers-get-stats'],
    test: async () => {
      if (!testDataIds['test-offer-materials']) {
        return { success: false, error: 'No test offer ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/offers/${testDataIds['test-offer-materials']}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: 'Updated Test Offer Materials',
            description: 'Updated description for testing',
            status: 'sent',
            discount: 5,
          }),
        }
      );
      if (status === 200) {
        return {
          success: true,
          details: `✓ Updated offer status to "sent" with 5% discount`,
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
    id: 'offers-update-status-accepted',
    name: 'Update Offer Status to Accepted',
    category: 'Offers',
    description: 'Change offer status to accepted',
    dependsOn: ['offers-update'],
    test: async () => {
      if (!testDataIds['test-offer-materials']) {
        return { success: false, error: 'No test offer ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/offers/${testDataIds['test-offer-materials']}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'accepted',
          }),
        }
      );
      if (status === 200) {
        return {
          success: true,
          details: `✓ Updated offer status to "accepted"`,
          httpStatus: status,
          responseSize,
          requestData,
          responseData
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },

  // ============== OFFER ITEMS OPERATIONS ==============
  {
    id: 'offers-add-item',
    name: 'Add Item to Offer',
    category: 'Offers',
    description: 'Add a new item to existing offer',
    dependsOn: ['offers-update-status-accepted'],
    test: async () => {
      if (!testDataIds['test-offer-services']) {
        return { success: false, error: 'No test offer ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/offers/${testDataIds['test-offer-services']}/items`,
        {
          method: 'POST',
          body: JSON.stringify({
            type: 'service',
            itemName: 'Additional Service Item',
            itemCode: 'SVC-ADD',
            description: 'Additional service for testing', // Required field
            quantity: 1,
            unitPrice: 300,
            discount: 0,
          }),
        }
      );
      if ((status === 200 || status === 201) && data) {
        const itemId = data.data?.id || data.id;
        testDataIds['test-offer-item'] = itemId;
        return {
          success: true,
          details: `✓ Added item to offer (ID: ${itemId})`,
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
    id: 'offers-update-item',
    name: 'Update Offer Item',
    category: 'Offers',
    description: 'Update an existing offer item',
    dependsOn: ['offers-add-item'],
    test: async () => {
      if (!testDataIds['test-offer-services'] || !testDataIds['test-offer-item']) {
        return { success: false, error: 'No test offer or item ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/offers/${testDataIds['test-offer-services']}/items/${testDataIds['test-offer-item']}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            type: 'service',
            itemName: 'Updated Service Item',
            itemCode: 'SVC-UPD',
            description: 'Updated service description for testing', // Required field
            quantity: 2,
            unitPrice: 350,
            discount: 5,
          }),
        }
      );
      if (status === 200) {
        return {
          success: true,
          details: `✓ Updated offer item: qty=2, price=350`,
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
    id: 'offers-delete-item',
    name: 'Delete Offer Item',
    category: 'Offers',
    description: 'Remove an item from offer',
    dependsOn: ['offers-update-item'],
    test: async () => {
      if (!testDataIds['test-offer-services'] || !testDataIds['test-offer-item']) {
        return { success: false, error: 'No test offer or item ID available' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(
        `/api/offers/${testDataIds['test-offer-services']}/items/${testDataIds['test-offer-item']}`,
        { method: 'DELETE' }
      );
      if (status === 200 || status === 204) {
        delete testDataIds['test-offer-item'];
        return {
          success: true,
          details: `✓ Deleted offer item`,
          httpStatus: status,
          requestData,
          responseData
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },

  // ============== WORKFLOW OPERATIONS ==============
  {
    id: 'offers-renew',
    name: 'Renew Offer',
    category: 'Offers',
    description: 'Create a new offer based on existing one',
    dependsOn: ['offers-delete-item'],
    test: async () => {
      if (!testDataIds['test-offer-mixed']) {
        return { success: false, error: 'No test offer ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/offers/${testDataIds['test-offer-mixed']}/renew`,
        { method: 'POST' }
      );
      if ((status === 200 || status === 201) && data) {
        const renewedId = data.data?.id || data.id;
        testDataIds['test-offer-renewed'] = renewedId;
        return {
          success: true,
          details: `✓ Renewed offer created (ID: ${renewedId})`,
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
    id: 'offers-convert-to-sale',
    name: 'Convert Offer to Sale',
    category: 'Offers',
    description: 'Convert an accepted offer to a sale',
    dependsOn: ['offers-renew'],
    test: async () => {
      if (!testDataIds['test-offer-materials']) {
        return { success: false, error: 'No test offer ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(
        `/api/offers/${testDataIds['test-offer-materials']}/convert`,
        {
          method: 'POST',
          body: JSON.stringify({
            convertToSale: true,
            convertToServiceOrder: false,
          }),
        }
      );
      if ((status === 200 || status === 201) && data) {
        const result = data.data || data;
        const saleId = result.saleId || result.SaleId;
        if (saleId) {
          testDataIds['test-sale-from-offer'] = saleId;
        }
        return {
          success: true,
          details: `✓ Converted offer to sale (Sale ID: ${saleId || 'pending'})`,
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
    id: 'offers-delete-renewed',
    name: 'Delete Renewed Offer',
    category: 'Offers',
    description: 'Delete the renewed offer',
    dependsOn: ['offers-convert-to-sale'],
    test: async () => {
      if (!testDataIds['test-offer-renewed']) {
        return { success: false, error: 'No renewed offer to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(
        `/api/offers/${testDataIds['test-offer-renewed']}`,
        { method: 'DELETE' }
      );
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-offer-renewed'];
        delete testDataIds['test-offer-renewed'];
        return {
          success: true,
          details: `✓ Deleted renewed offer (ID: ${deletedId})`,
          httpStatus: status,
          requestData,
          responseData
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'offers-list-final',
    name: 'List Offers (Final)',
    category: 'Offers',
    description: 'Final list of all offers after operations',
    dependsOn: ['offers-delete-renewed'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/offers?page=1&limit=100');
      if (status === 200) {
        // Handle wrapped response: { success: true, data: { offers: [...] } }
        const offers = data?.data?.offers || data?.offers || (Array.isArray(data?.data) ? data.data : []) || (Array.isArray(data) ? data : []);
        const total = data?.data?.pagination?.total || data?.pagination?.total || offers.length;

        // Count by status (ensure offers is an array)
        const offersArray = Array.isArray(offers) ? offers : [];
        const draft = offersArray.filter((o: any) => o.status === 'draft').length;
        const sent = offersArray.filter((o: any) => o.status === 'sent').length;
        const accepted = offersArray.filter((o: any) => o.status === 'accepted').length;

        return {
          success: true,
          details: `✓ Final: ${total} offers | Created: ${draft} | Sent: ${sent} | Accepted: ${accepted}`,
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
    id: 'offers-cleanup',
    name: 'Cleanup Offers Test Data',
    category: 'Offers',
    description: 'Cleanup any remaining test offers and the test contact',
    dependsOn: ['sales-cleanup'],
    test: async () => {
      let cleanedCount = 0;
      const errors: string[] = [];

      // Delete remaining test offers
      const offerIds = [
        testDataIds['test-offer-materials'],
        testDataIds['test-offer-services'],
        testDataIds['test-offer-mixed'],
      ].filter(Boolean);

      for (const offerId of offerIds) {
        try {
          const { status } = await apiCall<any>(`/api/offers/${offerId}`, { method: 'DELETE' });
          if (status === 200 || status === 204) cleanedCount++;
        } catch (e) {
          errors.push(`offer ${offerId}`);
        }
      }

      // Clean up test contact if created for offers
      if (testDataIds['offers-test-contact']) {
        try {
          const { status } = await apiCall<any>(`/api/contacts/${testDataIds['offers-test-contact']}`, { method: 'DELETE' });
          if (status === 200 || status === 204) {
            cleanedCount++;
            delete testDataIds['offers-test-contact'];
          }
        } catch (e) {
          errors.push('offers test contact');
        }
      }

      // Clear offer IDs
      delete testDataIds['test-offer-materials'];
      delete testDataIds['test-offer-services'];
      delete testDataIds['test-offer-mixed'];

      return {
        success: true,
        details: `✓ Cleaned up ${cleanedCount} items${errors.length > 0 ? ` (errors: ${errors.join(', ')})` : ''}`
      };
    },
  },
];
