// Real Lookups Service - integrated with backend API
import { 
  articleCategoriesApi,
  serviceCategoriesApi,
  prioritiesApi,
  eventTypesApi,
  taskStatusesApi,
  projectStatusesApi,
  technicianStatusesApi,
  leaveTypesApi,
  currenciesApi,
  type LookupItem,
  type Currency,
  type LookupListResponse,
  type CurrencyListResponse,
  type CreateLookupRequest,
  type UpdateLookupRequest,
  type CreateCurrencyRequest,
  type UpdateCurrencyRequest,
} from '@/services/api/lookupsApi';

// Re-export types
export type { LookupItem, Currency };

// Cache for lookups to reduce API calls
const cache: Record<string, { data: LookupItem[]; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): LookupItem[] | null {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: LookupItem[]) {
  cache[key] = { data, timestamp: Date.now() };
}

function clearCache(key: string) {
  delete cache[key];
}

export const LookupsService = {
  // Task Statuses
  async getTaskStatusesAsync(): Promise<LookupItem[]> {
    const cached = getCached('task_statuses');
    if (cached) return cached;
    
    try {
      const response = await taskStatusesApi.getAll();
      const items = response.items || [];
      setCache('task_statuses', items);
      return items;
    } catch (error) {
      console.error('Failed to fetch task statuses:', error);
      return getCached('task_statuses') || [];
    }
  },
  getTaskStatuses(): LookupItem[] { 
    return getCached('task_statuses') || []; 
  },
  setTaskStatuses(list: LookupItem[]) { 
    setCache('task_statuses', list); 
  },

  // Event Types
  async getEventTypesAsync(): Promise<LookupItem[]> {
    const cached = getCached('event_types');
    if (cached) return cached;
    
    try {
      const response = await eventTypesApi.getAll();
      const items = response.items || [];
      setCache('event_types', items);
      return items;
    } catch (error) {
      console.error('Failed to fetch event types:', error);
      return getCached('event_types') || [];
    }
  },
  getEventTypes(): LookupItem[] { 
    return getCached('event_types') || []; 
  },
  setEventTypes(list: LookupItem[]) { 
    setCache('event_types', list); 
  },

  // Service Categories
  async getServiceCategoriesAsync(): Promise<LookupItem[]> {
    const cached = getCached('service_categories');
    if (cached) return cached;
    
    try {
      const response = await serviceCategoriesApi.getAll();
      const items = response.items || [];
      setCache('service_categories', items);
      return items;
    } catch (error) {
      console.error('Failed to fetch service categories:', error);
      return getCached('service_categories') || [];
    }
  },
  getServiceCategories(): LookupItem[] { 
    return getCached('service_categories') || []; 
  },
  setServiceCategories(list: LookupItem[]) { 
    setCache('service_categories', list); 
  },

  // Technician Statuses
  async getTechnicianStatusesAsync(): Promise<LookupItem[]> {
    const cached = getCached('technician_statuses');
    if (cached) return cached;
    
    try {
      const response = await technicianStatusesApi.getAll();
      const items = response.items || [];
      setCache('technician_statuses', items);
      return items;
    } catch (error) {
      console.error('Failed to fetch technician statuses:', error);
      return getCached('technician_statuses') || [];
    }
  },
  getTechnicianStatuses(): LookupItem[] { 
    return getCached('technician_statuses') || []; 
  },
  setTechnicianStatuses(list: LookupItem[]) { 
    setCache('technician_statuses', list); 
  },

  // Leave Types
  async getLeaveTypesAsync(): Promise<LookupItem[]> {
    const cached = getCached('leave_types');
    if (cached) return cached;
    
    try {
      const response = await leaveTypesApi.getAll();
      const items = response.items || [];
      setCache('leave_types', items);
      return items;
    } catch (error) {
      console.error('Failed to fetch leave types:', error);
      return getCached('leave_types') || [];
    }
  },
  getLeaveTypes(): LookupItem[] { 
    return getCached('leave_types') || []; 
  },
  setLeaveTypes(list: LookupItem[]) { 
    setCache('leave_types', list); 
  },

  // Priorities
  async getPrioritiesAsync(): Promise<LookupItem[]> {
    const cached = getCached('priorities');
    if (cached) return cached;
    
    try {
      const response = await prioritiesApi.getAll();
      const items = response.items || [];
      setCache('priorities', items);
      return items;
    } catch (error) {
      console.error('Failed to fetch priorities:', error);
      return getCached('priorities') || [];
    }
  },
  getPriorities(): LookupItem[] { 
    return getCached('priorities') || []; 
  },
  setPriorities(list: LookupItem[]) { 
    setCache('priorities', list); 
  },

  // Project Statuses
  async getProjectStatusesAsync(): Promise<LookupItem[]> {
    const cached = getCached('project_statuses');
    if (cached) return cached;
    
    try {
      const response = await projectStatusesApi.getAll();
      const items = response.items || [];
      setCache('project_statuses', items);
      return items;
    } catch (error) {
      console.error('Failed to fetch project statuses:', error);
      return getCached('project_statuses') || [];
    }
  },
  getProjectStatuses(): LookupItem[] { 
    return getCached('project_statuses') || []; 
  },
  setProjectStatuses(list: LookupItem[]) { 
    setCache('project_statuses', list); 
  },

  // Article Categories
  async getArticleCategoriesAsync(): Promise<LookupItem[]> {
    const cached = getCached('article_categories');
    if (cached) return cached;
    
    try {
      const response = await articleCategoriesApi.getAll();
      const items = response.items || [];
      setCache('article_categories', items);
      return items;
    } catch (error) {
      console.error('Failed to fetch article categories:', error);
      return getCached('article_categories') || [];
    }
  },
  getArticleCategories(): LookupItem[] { 
    return getCached('article_categories') || []; 
  },
  setArticleCategories(list: LookupItem[]) { 
    setCache('article_categories', list); 
  },

  // Currencies
  async getCurrenciesAsync(): Promise<LookupItem[]> {
    const cached = getCached('currencies');
    if (cached) return cached;
    
    try {
      const response = await currenciesApi.getAll();
      // Map Currency to LookupItem format
      const items: LookupItem[] = (response.currencies || []).map(c => ({
        id: c.id,
        name: `${c.name} (${c.symbol})`,
        description: c.code,
        isActive: c.isActive,
        isDefault: c.isDefault,
        sortOrder: c.sortOrder,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
      setCache('currencies', items);
      return items;
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
      return getCached('currencies') || [];
    }
  },
  getCurrencies(): LookupItem[] { 
    return getCached('currencies') || []; 
  },
  setCurrencies(list: LookupItem[]) { 
    setCache('currencies', list); 
  },
  async setDefaultCurrencyAsync(id: string): Promise<LookupItem[]> {
    try {
      await currenciesApi.setDefault(id);
      clearCache('currencies');
      return this.getCurrenciesAsync();
    } catch (error) {
      console.error('Failed to set default currency:', error);
      return this.getCurrencies();
    }
  },
  setDefaultCurrency(id: string): LookupItem[] {
    // Trigger async update
    this.setDefaultCurrencyAsync(id);
    // Return current cached state optimistically updated
    const current = getCached('currencies') || [];
    return current.map(c => ({ ...c, isDefault: c.id === id }));
  },

  // Clear all caches (useful after bulk operations)
  clearAllCaches() {
    Object.keys(cache).forEach(key => delete cache[key]);
  },
};
