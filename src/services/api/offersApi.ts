// Real API service for Offers management
// Migrated to use centralized apiFetch for automatic 401 retry, dedup, and logging
import { apiFetch } from '@/services/api/apiClient';

// Types
export interface OfferItem {
  id?: number;
  type: 'article' | 'service';
  itemName: string;
  itemCode?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  installationId?: string;
  installationName?: string;
}

export interface OfferContact {
  id: number;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  hasLocation?: number;
}

export interface Offer {
  id: number;
  offerNumber: string;
  sentCount?: number;
  title: string;
  description?: string;
  contactId: number;
  contactName?: string;
  contact?: OfferContact;
  status: 'draft' | 'sent' | 'negotiation' | 'accepted' | 'rejected' | 'expired';
  category?: string;
  source?: string;
  currency: string;
  validUntil?: string;
  taxes?: number;
  taxType?: 'percentage' | 'fixed';
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  totalAmount?: number;
  fiscalStamp?: number;
  items?: OfferItem[];
  tags?: string[];
  convertedToSaleId?: string;
  convertedToServiceOrderId?: string;
  convertedAt?: string;
  createdDate?: string;
  modifiedDate?: string;
}

export interface CreateOfferRequest {
  title: string;
  description?: string;
  contactId: number;
  status?: string;
  category?: string;
  source?: string;
  currency?: string;
  validUntil?: string;
  taxes?: number;
  taxType?: 'percentage' | 'fixed';
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  totalAmount?: number;
  fiscalStamp?: number;
  notes?: string;
  items?: Omit<OfferItem, 'id'>[];
}

export interface UpdateOfferRequest {
  offerNumber?: string;
  title?: string;
  description?: string;
  contactId?: number;
  status?: string;
  category?: string;
  source?: string;
  currency?: string;
  validUntil?: string;
  taxes?: number;
  taxType?: 'percentage' | 'fixed';
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  totalAmount?: number;
  fiscalStamp?: number;
}

export interface OfferListResponse {
  success: boolean;
  data: {
    offers: Offer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface OfferSearchParams {
  page?: number;
  limit?: number;
  status?: string;
  contactId?: number;
  search?: string;
}

// Helper to unwrap apiFetch result and throw on error
function unwrap<T>(result: { data: T | null; status: number; error?: string }, fallbackMsg: string): T {
  if (result.error || result.data === null) {
    throw new Error(result.error || fallbackMsg);
  }
  return result.data;
}

export const offersApi = {
  async getAll(params?: OfferSearchParams): Promise<OfferListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.contactId) queryParams.append('contact_id', params.contactId.toString());
    if (params?.search) queryParams.append('search', params.search);

    const result = await apiFetch<any>(`/api/offers?${queryParams.toString()}`);
    const data = unwrap(result, 'Failed to fetch offers');
    return {
      success: true,
      data: {
        offers: data?.data?.offers || data?.offers || data?.items || (Array.isArray(data) ? data : []),
        pagination: data?.data?.pagination || data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
    };
  },

  async getById(id: number): Promise<Offer> {
    const result = await apiFetch<any>(`/api/offers/${id}`);
    const data = unwrap(result, 'Failed to fetch offer');
    return data.data || data;
  },

  async send(id: number): Promise<Offer> {
    const result = await apiFetch<any>(`/api/offers/${id}/send`, { method: 'POST' });
    const data = unwrap(result, 'Failed to mark offer as sent');
    return data.data || data;
  },

  async create(request: CreateOfferRequest): Promise<Offer> {
    const result = await apiFetch<any>(`/api/offers`, { method: 'POST', body: JSON.stringify(request) });
    const data = unwrap(result, 'Failed to create offer');
    return data.data || data;
  },

  async update(id: number, request: UpdateOfferRequest): Promise<Offer> {
    const result = await apiFetch<any>(`/api/offers/${id}`, { method: 'PATCH', body: JSON.stringify(request) });
    const data = unwrap(result, 'Failed to update offer');
    return data.data || data;
  },

  async delete(id: number): Promise<void> {
    const result = await apiFetch<any>(`/api/offers/${id}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async addItem(offerId: number, item: Omit<OfferItem, 'id'>): Promise<OfferItem> {
    const result = await apiFetch<any>(`/api/offers/${offerId}/items`, { method: 'POST', body: JSON.stringify(item) });
    const data = unwrap(result, 'Failed to add item');
    return data.data || data;
  },

  async updateItem(offerId: number, itemId: number, item: Partial<Omit<OfferItem, 'id'>>): Promise<OfferItem> {
    const result = await apiFetch<any>(`/api/offers/${offerId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(item) });
    const data = unwrap(result, 'Failed to update item');
    return data.data || data;
  },

  async deleteItem(offerId: number, itemId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/offers/${offerId}/items/${itemId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async convertToSale(offerId: number): Promise<{ saleId: number; serviceOrderId?: number }> {
    const result = await apiFetch<any>(`/api/sales/from-offer/${offerId}`, { method: 'POST' });
    const data = unwrap(result, 'Failed to convert offer to sale');
    const saleId = data?.data?.id ?? data?.id;
    if (typeof saleId !== 'number') {
      throw new Error('Conversion succeeded but no saleId returned');
    }
    return { saleId };
  },

  async renew(offerId: number): Promise<Offer> {
    const result = await apiFetch<any>(`/api/offers/${offerId}/renew`, { method: 'POST' });
    const data = unwrap(result, 'Failed to renew offer');
    return data.data || data;
  },

  // Activities/Notes API
  async getActivities(offerId: number, type?: string, page: number = 1, limit: number = 50): Promise<{
    activities: OfferActivity[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (type) params.append('type', type);

    const result = await apiFetch<any>(`/api/offers/${offerId}/activities?${params.toString()}`);
    const data = unwrap(result, 'Failed to fetch activities');
    return data.data || { activities: [], pagination: { page, limit, total: 0 } };
  },

  async addActivity(offerId: number, activity: {
    type: string;
    description: string;
    details?: string;
  }): Promise<OfferActivity> {
    const result = await apiFetch<any>(`/api/offers/${offerId}/activities`, { method: 'POST', body: JSON.stringify(activity) });
    const data = unwrap(result, 'Failed to add activity');
    return data.data || data;
  },

  async deleteActivity(offerId: number, activityId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/offers/${offerId}/activities/${activityId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },
};

// Activity type
export interface OfferActivity {
  id: number;
  offerId: number;
  type: string;
  description: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  createdBy: string;
}

export default offersApi;

// =====================================================
// Bulk Import Operations
// =====================================================

export interface OfferBulkImportRequest {
  offers: Array<{
    title: string;
    description?: string;
    contactId: number;
    status?: string;
    category?: string;
    source?: string;
    currency?: string;
    validUntil?: string;
    taxes?: number;
    discount?: number;
    notes?: string;
  }>;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

export interface OfferBulkImportResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: string[];
  importedItems: any[];
}

export const offersBulkImportApi = {
  async bulkImport(request: OfferBulkImportRequest): Promise<OfferBulkImportResult> {
    try {
      const backendOffers = request.offers.map(offer => ({
        title: offer.title,
        description: offer.description,
        contactId: offer.contactId,
        status: offer.status || 'draft',
        category: offer.category,
        source: offer.source,
        currency: offer.currency || 'TND',
        validUntil: offer.validUntil,
        taxes: offer.taxes,
        discount: offer.discount,
        notes: offer.notes,
      }));

      const result = await apiFetch<any>(`/api/offers/import`, {
        method: 'POST',
        body: JSON.stringify({
          offers: backendOffers,
          skipDuplicates: request.skipDuplicates ?? true,
        }),
      });

      const data = unwrap(result, 'Bulk import failed');
      const inner = data.data || data;

      return {
        totalProcessed: inner.totalProcessed || request.offers.length,
        successCount: inner.successCount || 0,
        failedCount: inner.failedCount || 0,
        skippedCount: inner.skippedCount || 0,
        errors: inner.errors || [],
        importedItems: inner.importedOffers || inner.importedItems || [],
      };
    } catch (error) {
      console.error('Bulk import error:', error);
      return {
        totalProcessed: request.offers.length,
        successCount: 0,
        failedCount: request.offers.length,
        skippedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        importedItems: [],
      };
    }
  }
};
