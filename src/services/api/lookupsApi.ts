// Real API service for Lookups - replaces mock implementation
import { getAuthHeaders, getMutationHeaders, getMutationHeadersNoContentType } from '@/utils/apiHeaders';
import { API_URL } from '@/config/api';
import {
  isOfflineNoCache503,
  parseOfflineNoCacheBody,
  throwIfNotOkAfterOfflineCheck,
} from '@/services/offline/offlineHttpRead';

// Re-export types from mock (keep same interface)
export interface LookupItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  isCompleted?: boolean;
  defaultDuration?: number;
  isAvailable?: boolean;
  isPaid?: boolean;
  maxDays?: number;
  category?: string;
  isDefault?: boolean;
  value?: string; // String identifier used in selects
}

export interface Currency {
  id: string;
  name: string;
  symbol: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLookupRequest {
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
  isCompleted?: boolean;
  defaultDuration?: number;
  isAvailable?: boolean;
  isPaid?: boolean;
  maxDays?: number;
  category?: string;
}

export interface UpdateLookupRequest {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
  isCompleted?: boolean;
  defaultDuration?: number;
  isAvailable?: boolean;
  isPaid?: boolean;
  maxDays?: number;
  category?: string;
  isDefault?: boolean;
}

export interface CreateCurrencyRequest {
  name: string;
  symbol: string;
  code: string;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCurrencyRequest {
  name?: string;
  symbol?: string;
  code?: string;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface LookupListResponse {
  items: LookupItem[];
  totalCount: number;
}

export interface CurrencyListResponse {
  currencies: Currency[];
  totalCount: number;
}

// Auth headers imported from shared utility

// Generic lookup API factory - uses path parameter for lookup type
function createLookupApi(lookupType: string) {
  return {
    async getAll(): Promise<LookupListResponse> {
      const response = await fetch(`${API_URL}/api/Lookups/${lookupType}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const offline = await parseOfflineNoCacheBody(response);
      if (isOfflineNoCache503(offline)) return { items: [], totalCount: 0 };

      // Handle 404 as empty data - backend returns 404 when no items exist for a lookup type
      if (response.status === 404) {
        return { items: [], totalCount: 0 };
      }

      await throwIfNotOkAfterOfflineCheck(response, offline, `Failed to fetch ${lookupType}`);

      const data = await response.json();
      // Handle both array and object responses
      const items = Array.isArray(data) ? data : (data.data?.items || data.items || []);
      return {
        items: items.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          description: item.description,
          color: item.color,
          isActive: item.isActive,
          sortOrder: item.sortOrder,
          isDefault: item.isDefault ?? false, // Default to false if not present
          category: item.category,
          value: item.value || item.name?.toLowerCase().replace(/\s+/g, '_'), // Use value field or generate from name
          isCompleted: item.isCompleted,
          defaultDuration: item.defaultDuration,
          isAvailable: item.isAvailable,
          isPaid: item.isPaid,
          maxDays: item.maxDays,
        })),
        totalCount: items.length,
      };
    },

    async getById(id: string): Promise<LookupItem> {
      const response = await fetch(`${API_URL}/api/Lookups/${lookupType}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const offline = await parseOfflineNoCacheBody(response);
      if (isOfflineNoCache503(offline)) {
        return {
          id,
          name: '',
          description: '',
          color: undefined,
          isActive: true,
          sortOrder: 0,
        };
      }

      await throwIfNotOkAfterOfflineCheck(response, offline, `Failed to fetch ${lookupType} item`);

      const data = await response.json();
      return data.data?.item || data.item || data;
    },

    async create(request: CreateLookupRequest): Promise<LookupItem> {
      const response = await fetch(`${API_URL}/api/Lookups/${lookupType}`, {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify(request),
      });

      // A 404 here means the backend doesn't have a route for this lookup type
      if (response.status === 404) {
        throw new Error(
          `Lookup endpoint "/api/Lookups/${lookupType}" was not found (404). The backend must add this lookup type before items can be created.`
        );
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create item' }));
        throw new Error(error.message || `Failed to create ${lookupType}`);
      }

      const data = await response.json();
      return data.data?.item || data.item || data;
    },

    async update(id: string, request: UpdateLookupRequest): Promise<LookupItem> {
      const response = await fetch(`${API_URL}/api/Lookups/${lookupType}/${id}`, {
        method: 'PUT',
        headers: getMutationHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update item' }));
        throw new Error(error.message || `Failed to update ${lookupType}`);
      }

      const data = await response.json();
      return data.data?.item || data.item || data;
    },

    async delete(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/api/Lookups/${lookupType}/${id}`, {
        method: 'DELETE',
        headers: getMutationHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete item' }));
        throw new Error(error.message || `Failed to delete ${lookupType}`);
      }
    },
  };
}

// Create API instances for all lookup types
export const articleCategoriesApi = createLookupApi('article-categories');
export const articleStatusesApi = createLookupApi('article-statuses');
export const serviceCategoriesApi = createLookupApi('service-categories');
export const locationsApi = createLookupApi('locations');
export const countriesApi = createLookupApi('countries');
export const prioritiesApi = createLookupApi('priorities');
export const eventTypesApi = createLookupApi('event-types');
export const taskStatusesApi = createLookupApi('task-statuses');
export const projectStatusesApi = createLookupApi('project-statuses');
export const projectTypesApi = createLookupApi('project-types');
export const offerStatusesApi = createLookupApi('offer-statuses');
export const saleStatusesApi = createLookupApi('sale-statuses');
export const serviceOrderStatusesApi = createLookupApi('service-order-statuses');
export const dispatchStatusesApi = createLookupApi('dispatch-statuses');
export const offerCategoriesApi = createLookupApi('offer-categories');
export const offerSourcesApi = createLookupApi('offer-sources');
export const technicianStatusesApi = createLookupApi('technician-statuses');
export const leaveTypesApi = createLookupApi('leave-types');
export const skillsApi = createLookupApi('skills');
export const installationTypesApi = createLookupApi('installation-types');
export const installationCategoriesApi = createLookupApi('installation-categories');
export const workTypesApi = createLookupApi('work-types');
export const expenseTypesApi = createLookupApi('expense-types');
export const formCategoriesApi = createLookupApi('form-categories');
export const documentTypesApi = createLookupApi('document-types');

// Dedicated Article Groups API - uses articles module endpoint, not generic Lookups
const articlesGroupsApi = {
  async getAll(): Promise<LookupListResponse> {
    try {
      const response = await fetch(`${API_URL}/api/articles/groups`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const offline = await parseOfflineNoCacheBody(response);
      if (isOfflineNoCache503(offline)) return { items: [], totalCount: 0 };

      await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch article groups');

      const data = await response.json();
      // Handle ArticleGroups response format
      const items = Array.isArray(data) ? data : (data.data?.items || data.items || data.data || []);
      
      return {
        items: items.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          description: item.description,
          isActive: item.isActive !== false,
          isDefault: item.isDefault ?? false,
        })),
        totalCount: items.length,
      };
    } catch (error) {
      console.error('Error fetching article groups:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<LookupItem> {
    const response = await fetch(`${API_URL}/api/articles/groups/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return {
        id,
        name: '',
        description: '',
        color: undefined,
        isActive: true,
        sortOrder: 0,
      };
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch article group');

    const data = await response.json();
    const item = data.data || data;
    return {
      id: String(item.id),
      name: item.name,
      description: item.description,
      isActive: item.isActive,
    };
  },

  async create(request: CreateLookupRequest): Promise<LookupItem> {
    const response = await fetch(`${API_URL}/api/articles/groups`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create article group' }));
      throw new Error(error.message || 'Failed to create article group');
    }

    const data = await response.json();
    const item = data.data || data;
    return {
      id: String(item.id),
      name: item.name,
      description: item.description,
      isActive: item.isActive,
    };
  },

  async update(id: string, request: UpdateLookupRequest): Promise<LookupItem> {
    const response = await fetch(`${API_URL}/api/articles/groups/${id}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update article group' }));
      throw new Error(error.message || 'Failed to update article group');
    }

    const data = await response.json();
    const item = data.data || data;
    return {
      id: String(item.id),
      name: item.name,
      description: item.description,
      isActive: item.isActive,
    };
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/articles/groups/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete article group' }));
      throw new Error(error.message || 'Failed to delete article group');
    }
  }
};

export const articleGroupsApi = articlesGroupsApi;

// Currencies API (separate endpoints)
export const currenciesApi = {
  async getAll(): Promise<CurrencyListResponse> {
    const response = await fetch(`${API_URL}/api/Lookups/currencies`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) return { currencies: [], totalCount: 0 };

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch currencies');

    const data = await response.json();
    return {
      currencies: data.data?.currencies || data.currencies || [],
      totalCount: data.data?.totalCount || data.totalCount || 0,
    };
  },

  async getById(id: string): Promise<Currency> {
    const response = await fetch(`${API_URL}/api/Lookups/currencies/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return {
        id,
        name: '',
        symbol: '',
        code: '',
        isDefault: false,
        isActive: true,
      };
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch currency');

    const data = await response.json();
    return data.data?.currency || data.currency || data;
  },

  async create(request: CreateCurrencyRequest): Promise<Currency> {
    const response = await fetch(`${API_URL}/api/Lookups/currencies`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create currency' }));
      throw new Error(error.message || 'Failed to create currency');
    }

    const data = await response.json();
    return data.data?.currency || data.currency || data;
  },

  async update(id: string, request: UpdateCurrencyRequest): Promise<Currency> {
    const response = await fetch(`${API_URL}/api/Lookups/currencies/${id}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update currency' }));
      throw new Error(error.message || 'Failed to update currency');
    }

    const data = await response.json();
    return data.data?.currency || data.currency || data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/Lookups/currencies/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete currency');
    }
  },

  async setDefault(id: string): Promise<Currency> {
    const response = await fetch(`${API_URL}/api/Lookups/currencies/${id}/set-default`, {
      method: 'PUT',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to set default currency');
    }

    const data = await response.json();
    return data.data?.currency || data.currency || data;
  },
};

// Bulk operations
export const bulkLookupsApi = {
  async bulkCreateLookups(category: string, items: CreateLookupRequest[]): Promise<LookupListResponse> {
    const response = await fetch(`${API_URL}/api/Lookups/${category}/bulk`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk create ${category}`);
    }

    const data = await response.json();
    return {
      items: data.data?.items || data.items || [],
      totalCount: data.data?.totalCount || data.totalCount || 0,
    };
  },

  async bulkUpdateLookups(category: string, items: { id: string; data: UpdateLookupRequest }[]): Promise<LookupListResponse> {
    const response = await fetch(`${API_URL}/api/Lookups/${category}/bulk`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk update ${category}`);
    }

    const data = await response.json();
    return {
      items: data.data?.items || data.items || [],
      totalCount: data.data?.totalCount || data.totalCount || 0,
    };
  },

  async bulkDeleteLookups(category: string, ids: string[]): Promise<void> {
    const response = await fetch(`${API_URL}/api/Lookups/${category}/bulk`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk delete ${category}`);
    }
  },
};

// Error handling helper
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data) {
    return typeof error.response.data === 'string' ? error.response.data : 'An error occurred';
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Export all as default
export default {
  articleCategories: articleCategoriesApi,
  articleStatuses: articleStatusesApi,
  serviceCategories: serviceCategoriesApi,
  locations: locationsApi,
  currencies: currenciesApi,
  countries: countriesApi,
  priorities: prioritiesApi,
  eventTypes: eventTypesApi,
  taskStatuses: taskStatusesApi,
  projectStatuses: projectStatusesApi,
  projectTypes: projectTypesApi,
  offerStatuses: offerStatusesApi,
  saleStatuses: saleStatusesApi,
  serviceOrderStatuses: serviceOrderStatusesApi,
  dispatchStatuses: dispatchStatusesApi,
  offerCategories: offerCategoriesApi,
  offerSources: offerSourcesApi,
  technicianStatuses: technicianStatusesApi,
  leaveTypes: leaveTypesApi,
  skills: skillsApi,
  installationTypes: installationTypesApi,
  installationCategories: installationCategoriesApi,
  workTypes: workTypesApi,
  expenseTypes: expenseTypesApi,
  formCategories: formCategoriesApi,
  documentTypes: documentTypesApi,
  bulk: bulkLookupsApi,
  handleError: handleApiError,
};
