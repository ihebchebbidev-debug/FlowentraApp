// Real API service for Sales management
// Migrated to use centralized apiFetch for automatic 401 retry, dedup, and logging
import { apiFetch } from '@/services/api/apiClient';

// Types
export interface SaleItem {
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
  requiresServiceOrder?: boolean;
  serviceOrderGenerated?: boolean;
  serviceOrderId?: string;
  fulfillmentStatus?: string;
}

export interface SaleContact {
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

export interface Sale {
  id: number;
  saleNumber: string;
  title: string;
  description?: string;
  contactId: number;
  contactName?: string;
  contact?: SaleContact;
  offerId?: number;
  offerNumber?: string;
  status: 'draft' | 'won' | 'lost' | 'negotiation';
  stage?: string;
  priority?: string;
  currency: string;
  taxes?: number;
  taxType?: 'percentage' | 'fixed';
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  totalAmount?: number;
  fiscalStamp?: number;
  estimatedCloseDate?: string;
  actualCloseDate?: string;
  lostReason?: string;
  items?: SaleItem[];
  createdDate?: string;
  modifiedDate?: string;
  createdBy?: string;
  createdByName?: string;
  assignedTo?: string;
  assignedToName?: string;
  convertedToServiceOrderId?: string;
  serviceOrdersStatus?: string;
  notes?: string;
}

export interface CreateSaleRequest {
  title: string;
  description?: string;
  contactId: number;
  offerId?: number;
  status?: string;
  stage?: string;
  priority?: string;
  currency?: string;
  taxes?: number;
  taxType?: 'percentage' | 'fixed';
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  estimatedCloseDate?: string;
  items?: Omit<SaleItem, 'id'>[];
}

export interface ServiceOrderConfig {
  priority?: string;
  notes?: string;
  startDate?: string;
  targetCompletionDate?: string;
  installationIds?: number[];
  itemInstallations?: Record<string, string>;
}

export interface UpdateSaleRequest {
  saleNumber?: string;
  title?: string;
  description?: string;
  contactId?: number;
  status?: string;
  stage?: string;
  priority?: string;
  amount?: number;
  taxes?: number;
  taxType?: 'percentage' | 'fixed';
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  fiscalStamp?: number;
  actualCloseDate?: string;
  lostReason?: string;
  serviceOrderConfig?: ServiceOrderConfig;
}

export interface SaleListResponse {
  success: boolean;
  data: {
    sales: Sale[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface SaleSearchParams {
  page?: number;
  limit?: number;
  status?: string;
  stage?: string;
  contactId?: number;
  search?: string;
}

function unwrap<T>(result: { data: T | null; status: number; error?: string }, fallbackMsg: string): T {
  if (result.error || result.data === null) {
    throw new Error(result.error || fallbackMsg);
  }
  return result.data;
}

export const salesApi = {
  async getAll(params?: SaleSearchParams): Promise<SaleListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.stage) queryParams.append('stage', params.stage);
    if (params?.contactId) queryParams.append('contact_id', params.contactId.toString());
    if (params?.search) queryParams.append('search', params.search);

    const result = await apiFetch<any>(`/api/sales?${queryParams.toString()}`);
    const data = unwrap(result, 'Failed to fetch sales');
    return {
      success: true,
      data: {
        sales: data?.data?.sales || data?.sales || data?.items || (Array.isArray(data) ? data : []),
        pagination: data?.data?.pagination || data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
    };
  },

  async getById(id: number): Promise<Sale> {
    const result = await apiFetch<any>(`/api/sales/${id}`);
    const data = unwrap(result, 'Failed to fetch sale');
    return data.data || data;
  },

  async create(request: CreateSaleRequest): Promise<Sale> {
    const result = await apiFetch<any>(`/api/sales`, { method: 'POST', body: JSON.stringify(request) });
    const data = unwrap(result, 'Failed to create sale');
    return data.data || data;
  },

  async update(id: number, request: UpdateSaleRequest): Promise<Sale> {
    const result = await apiFetch<any>(`/api/sales/${id}`, { method: 'PATCH', body: JSON.stringify(request) });
    const data = unwrap(result, 'Failed to update sale');
    return data.data || data;
  },

  async delete(id: number): Promise<void> {
    const result = await apiFetch<any>(`/api/sales/${id}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async addItem(saleId: number, item: Omit<SaleItem, 'id'>): Promise<SaleItem> {
    const result = await apiFetch<any>(`/api/sales/${saleId}/items`, { method: 'POST', body: JSON.stringify(item) });
    const data = unwrap(result, 'Failed to add item');
    return data.data || data;
  },

  async deleteItem(saleId: number, itemId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/sales/${saleId}/items/${itemId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async createServiceOrder(saleId: number, soData: {
    priority?: string;
    notes?: string;
    startDate?: string;
    targetCompletionDate?: string;
    installationIds?: number[];
    tags?: string[];
    jobConversionMode?: string;
  }): Promise<{ serviceOrderId: number }> {
    const result = await apiFetch<any>(`/api/service-orders/from-sale/${saleId}`, { method: 'POST', body: JSON.stringify(soData) });
    const data = unwrap(result, 'Failed to create service order');
    return { serviceOrderId: data.data?.id || data.id };
  },

  // Activities/Notes API
  async getActivities(saleId: number, type?: string, page: number = 1, limit: number = 50): Promise<{
    activities: SaleActivity[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (type) params.append('type', type);

    const result = await apiFetch<any>(`/api/sales/${saleId}/activities?${params.toString()}`);
    const data = unwrap(result, 'Failed to fetch activities');
    return data.data || { activities: [], pagination: { page, limit, total: 0 } };
  },

  async addActivity(saleId: number, activity: {
    type: string;
    description: string;
    details?: string;
  }): Promise<SaleActivity> {
    const result = await apiFetch<any>(`/api/sales/${saleId}/activities`, { method: 'POST', body: JSON.stringify(activity) });
    const data = unwrap(result, 'Failed to add activity');
    return data.data || data;
  },

  async deleteActivity(saleId: number, activityId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/sales/${saleId}/activities/${activityId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },
};

export interface SaleActivity {
  id: number;
  saleId: number;
  type: string;
  description: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  createdBy: string;
}

export default salesApi;
