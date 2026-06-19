// Real API service for the Deals (pipeline / opportunities) module.
// Uses the centralized apiFetch, which injects X-Tenant + X-Target-Tenant
// headers automatically — same tenant scoping as every other module.
import { apiFetch } from '@/services/api/apiClient';

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface DealItem {
  id?: number;
  dealId?: number;
  articleId?: number | null;
  type: 'article' | 'service';
  itemName: string;
  itemCode?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  lineTotal?: number;
  displayOrder?: number;
  installationId?: string | null;
  installationName?: string | null;
}

export interface DealContact {
  id: number;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}

export interface Deal {
  id: number;
  dealNumber?: string;
  title: string;
  description?: string;
  contactId: number;
  contactName?: string;
  contact?: DealContact;
  projectId?: number | null;
  stage: DealStage;
  probability: number;
  estimatedValue: number;
  currency: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  category?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  assignedTo?: string;
  assignedToName?: string;
  convertedToOfferId?: string;
  convertedToSaleId?: string;
  convertedToProjectId?: string;
  convertedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
  lastActivity?: string;
  items?: DealItem[];
}

export interface CreateDealRequest {
  title: string;
  description?: string;
  contactId: number;
  projectId?: number | null;
  stage?: DealStage;
  probability?: number;
  estimatedValue?: number;
  currency?: string;
  expectedCloseDate?: string;
  category?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  assignedTo?: string;
  assignedToName?: string;
  items?: Omit<DealItem, 'id' | 'dealId' | 'lineTotal' | 'displayOrder'>[];
}

export type UpdateDealRequest = Partial<Omit<CreateDealRequest, 'items'>> & {
  actualCloseDate?: string;
  /** When provided, the server replaces the deal's line items with this exact set
   *  in one transaction (an empty array clears them). Omit to leave items untouched. */
  items?: Omit<DealItem, 'id' | 'dealId' | 'lineTotal' | 'displayOrder'>[];
};

export interface DealStats {
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalValue: number;
  openValue: number;
  wonValue: number;
  averageValue: number;
  winRate: number;
}

export interface DealActivity {
  id: number;
  dealId: number;
  type: string;
  description: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

export interface DealSearchParams {
  page?: number;
  limit?: number;
  stage?: string;
  category?: string;
  source?: string;
  contactId?: number;
  projectId?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DealListResponse {
  deals: Deal[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ConvertDealRequest {
  convertToSale?: boolean;
  convertToProject?: boolean;
  convertToOffer?: boolean;
}

export interface ConvertDealResult {
  saleId?: number;
  projectId?: number;
  offerId?: number;
}

function unwrap<T>(result: { data: T | null; status: number; error?: string }, fallbackMsg: string): T {
  if (result.error || result.data === null) {
    throw new Error(result.error || fallbackMsg);
  }
  return result.data;
}

export const dealsApi = {
  async getAll(params?: DealSearchParams): Promise<DealListResponse> {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    if (params?.stage) q.append('stage', params.stage);
    if (params?.category) q.append('category', params.category);
    if (params?.source) q.append('source', params.source);
    if (params?.contactId) q.append('contact_id', params.contactId.toString());
    if (params?.projectId) q.append('project_id', params.projectId.toString());
    if (params?.search) q.append('search', params.search);
    if (params?.sortBy) q.append('sort_by', params.sortBy);
    if (params?.sortOrder) q.append('sort_order', params.sortOrder);

    const result = await apiFetch<any>(`/api/deals?${q.toString()}`);
    const data = unwrap(result, 'Failed to fetch deals');
    const inner = data?.data ?? data;
    return {
      deals: inner?.deals ?? inner?.items ?? (Array.isArray(inner) ? inner : []),
      pagination: inner?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  },

  async getById(id: number): Promise<Deal> {
    const result = await apiFetch<any>(`/api/deals/${id}`);
    const data = unwrap(result, 'Failed to fetch deal');
    return data.data ?? data;
  },

  async getStats(): Promise<DealStats> {
    const result = await apiFetch<any>(`/api/deals/stats`);
    const data = unwrap(result, 'Failed to fetch deal stats');
    return data.data ?? data;
  },

  async create(request: CreateDealRequest): Promise<Deal> {
    const result = await apiFetch<any>(`/api/deals`, { method: 'POST', body: JSON.stringify(request) });
    const data = unwrap(result, 'Failed to create deal');
    return data.data ?? data;
  },

  async update(id: number, request: UpdateDealRequest): Promise<Deal> {
    const result = await apiFetch<any>(`/api/deals/${id}`, { method: 'PATCH', body: JSON.stringify(request) });
    const data = unwrap(result, 'Failed to update deal');
    return data.data ?? data;
  },

  async delete(id: number): Promise<void> {
    const result = await apiFetch<any>(`/api/deals/${id}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async convert(id: number, request: ConvertDealRequest): Promise<ConvertDealResult> {
    const result = await apiFetch<any>(`/api/deals/${id}/convert`, { method: 'POST', body: JSON.stringify(request) });
    const data = unwrap(result, 'Failed to convert deal');
    return data.data ?? data;
  },

  // Items
  async addItem(dealId: number, item: Omit<DealItem, 'id' | 'dealId' | 'lineTotal' | 'displayOrder'>): Promise<DealItem> {
    const result = await apiFetch<any>(`/api/deals/${dealId}/items`, { method: 'POST', body: JSON.stringify(item) });
    const data = unwrap(result, 'Failed to add item');
    return data.data ?? data;
  },

  // Full replace of a single item — the server overwrites every field, so always
  // pass the complete item. To edit items as a set, prefer update(id, { items }).
  async updateItem(dealId: number, itemId: number, item: Omit<DealItem, 'id' | 'dealId' | 'lineTotal' | 'displayOrder'>): Promise<DealItem> {
    const result = await apiFetch<any>(`/api/deals/${dealId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(item) });
    const data = unwrap(result, 'Failed to update item');
    return data.data ?? data;
  },

  async deleteItem(dealId: number, itemId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/deals/${dealId}/items/${itemId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  // Activities
  async getActivities(dealId: number, type?: string, page = 1, limit = 50): Promise<{ activities: DealActivity[] }> {
    const q = new URLSearchParams();
    q.append('page', page.toString());
    q.append('limit', limit.toString());
    if (type) q.append('type', type);
    const result = await apiFetch<any>(`/api/deals/${dealId}/activities?${q.toString()}`);
    const data = unwrap(result, 'Failed to fetch activities');
    const inner = data.data ?? data;
    return { activities: inner?.activities ?? [] };
  },

  async addActivity(dealId: number, activity: { type: string; description: string; details?: string }): Promise<DealActivity> {
    const result = await apiFetch<any>(`/api/deals/${dealId}/activities`, { method: 'POST', body: JSON.stringify(activity) });
    const data = unwrap(result, 'Failed to add activity');
    return data.data ?? data;
  },

  async deleteActivity(dealId: number, activityId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/deals/${dealId}/activities/${activityId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },
};

export default dealsApi;
