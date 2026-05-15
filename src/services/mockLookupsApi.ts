// Mock service for all lookup data - replaces API calls with local JSON data
import taskStatusesData from '@/data/mock/taskStatuses.json';
import eventTypesData from '@/data/mock/eventTypes.json';
import serviceCategoriesData from '@/data/mock/serviceCategories.json';
import currenciesData from '@/data/mock/currencies.json';
import prioritiesData from '@/data/mock/priorities.json';
import skillsData from '@/data/mock/skills.json';
import rolesData from '@/data/mock/roles.json';
import usersData from '@/data/mock/users.json';

// Keep same types as original API
export interface LookupItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  level?: number;
  isCompleted?: boolean;
  defaultDuration?: number;
  isAvailable?: boolean;
  isPaid?: boolean;
  maxDays?: number;
  category?: string;
  isDefault?: boolean;
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
  level?: number;
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
  level?: number;
  isCompleted?: boolean;
  defaultDuration?: number;
  isAvailable?: boolean;
  isPaid?: boolean;
  maxDays?: number;
  category?: string;
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

// Helper function to simulate API delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Convert mock data to API format
const mapToLookupItems = (data: any[]): LookupItem[] => {
  return data.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    color: item.color,
    isActive: item.isActive ?? true,
    sortOrder: item.position ?? item.sortOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    level: item.level,
    isCompleted: item.isCompleted,
    defaultDuration: item.defaultDuration,
    isAvailable: item.isAvailable,
    isPaid: item.isPaid,
    maxDays: item.maxDays,
    category: item.category,
    isDefault: item.isDefault,
  }));
};

const mapToCurrencies = (data: any[]): Currency[] => {
  return data.map(item => ({
    id: item.id,
    name: item.name,
    symbol: item.symbol,
    code: item.code,
    isDefault: item.isDefault ?? false,
    isActive: item.isActive ?? true,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
};

// Mock API implementations
export const articleCategoriesApi = {
  async getAll(): Promise<LookupListResponse> {
    await delay();
    const items = mapToLookupItems(taskStatusesData); // Using task statuses as placeholder
    return { items, totalCount: items.length };
  },
  async getById(id: string): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(taskStatusesData);
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    return item;
  },
  async create(data: CreateLookupRequest): Promise<LookupItem> {
    await delay();
    return { id: Date.now().toString(), name: data.name || 'New Item', ...data, isActive: data.isActive ?? true };
  },
  async update(id: string, data: UpdateLookupRequest): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(taskStatusesData);
    const existing = items.find(i => i.id === id);
    if (!existing) throw new Error('Item not found');
    return { ...existing, ...data };
  },
  async delete(id: string): Promise<void> {
    await delay();
  },
};

export const serviceCategoriesApi = {
  async getAll(): Promise<LookupListResponse> {
    await delay();
    const items = mapToLookupItems(serviceCategoriesData);
    return { items, totalCount: items.length };
  },
  async getById(id: string): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(serviceCategoriesData);
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    return item;
  },
  async create(data: CreateLookupRequest): Promise<LookupItem> {
    await delay();
    return { id: Date.now().toString(), ...data, isActive: data.isActive ?? true };
  },
  async update(id: string, data: UpdateLookupRequest): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(serviceCategoriesData);
    const existing = items.find(i => i.id === id);
    if (!existing) throw new Error('Item not found');
    return { ...existing, ...data };
  },
  async delete(id: string): Promise<void> {
    await delay();
  },
};

export const currenciesApi = {
  async getAll(): Promise<CurrencyListResponse> {
    await delay();
    const currencies = mapToCurrencies(currenciesData);
    return { currencies, totalCount: currencies.length };
  },
  async getById(id: string): Promise<Currency> {
    await delay();
    const currencies = mapToCurrencies(currenciesData);
    const currency = currencies.find(c => c.id === id);
    if (!currency) throw new Error('Currency not found');
    return currency;
  },
  async create(data: CreateCurrencyRequest): Promise<Currency> {
    await delay();
    return { id: Date.now().toString(), ...data, isActive: data.isActive ?? true, isDefault: data.isDefault ?? false };
  },
  async update(id: string, data: UpdateCurrencyRequest): Promise<Currency> {
    await delay();
    const currencies = mapToCurrencies(currenciesData);
    const existing = currencies.find(c => c.id === id);
    if (!existing) throw new Error('Currency not found');
    return { ...existing, ...data };
  },
  async delete(id: string): Promise<void> {
    await delay();
  },
  async setDefault(id: string): Promise<Currency> {
    await delay();
    const currencies = mapToCurrencies(currenciesData);
    const currency = currencies.find(c => c.id === id);
    if (!currency) throw new Error('Currency not found');
    return { ...currency, isDefault: true };
  },
};

export const prioritiesApi = {
  async getAll(): Promise<LookupListResponse> {
    await delay();
    const items = mapToLookupItems(prioritiesData);
    return { items, totalCount: items.length };
  },
  async getById(id: string): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(prioritiesData);
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    return item;
  },
  async create(data: CreateLookupRequest): Promise<LookupItem> {
    await delay();
    return { id: Date.now().toString(), ...data, isActive: data.isActive ?? true };
  },
  async update(id: string, data: UpdateLookupRequest): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(prioritiesData);
    const existing = items.find(i => i.id === id);
    if (!existing) throw new Error('Item not found');
    return { ...existing, ...data };
  },
  async delete(id: string): Promise<void> {
    await delay();
  },
};

export const eventTypesApi = {
  async getAll(): Promise<LookupListResponse> {
    await delay();
    const items = mapToLookupItems(eventTypesData);
    return { items, totalCount: items.length };
  },
  async getById(id: string): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(eventTypesData);
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    return item;
  },
  async create(data: CreateLookupRequest): Promise<LookupItem> {
    await delay();
    return { id: Date.now().toString(), ...data, isActive: data.isActive ?? true };
  },
  async update(id: string, data: UpdateLookupRequest): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(eventTypesData);
    const existing = items.find(i => i.id === id);
    if (!existing) throw new Error('Item not found');
    return { ...existing, ...data };
  },
  async delete(id: string): Promise<void> {
    await delay();
  },
};

export const taskStatusesApi = {
  async getAll(): Promise<LookupListResponse> {
    await delay();
    const items = mapToLookupItems(taskStatusesData);
    return { items, totalCount: items.length };
  },
  async getById(id: string): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(taskStatusesData);
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    return item;
  },
  async create(data: CreateLookupRequest): Promise<LookupItem> {
    await delay();
    return { id: Date.now().toString(), ...data, isActive: data.isActive ?? true };
  },
  async update(id: string, data: UpdateLookupRequest): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(taskStatusesData);
    const existing = items.find(i => i.id === id);
    if (!existing) throw new Error('Item not found');
    return { ...existing, ...data };
  },
  async delete(id: string): Promise<void> {
    await delay();
  },
};

export const skillsApi = {
  async getAll(): Promise<LookupListResponse> {
    await delay();
    const items = mapToLookupItems(skillsData);
    return { items, totalCount: items.length };
  },
  async getById(id: string): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(skillsData);
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    return item;
  },
  async create(data: CreateLookupRequest): Promise<LookupItem> {
    await delay();
    return { id: Date.now().toString(), ...data, isActive: data.isActive ?? true };
  },
  async update(id: string, data: UpdateLookupRequest): Promise<LookupItem> {
    await delay();
    const items = mapToLookupItems(skillsData);
    const existing = items.find(i => i.id === id);
    if (!existing) throw new Error('Item not found');
    return { ...existing, ...data };
  },
  async delete(id: string): Promise<void> {
    await delay();
  },
};

// Create aliases for other lookup types using existing data
export const articleStatusesApi = articleCategoriesApi;
export const countriesApi = serviceCategoriesApi;
export const projectStatusesApi = taskStatusesApi;
export const projectTypesApi = serviceCategoriesApi;
export const offerStatusesApi = taskStatusesApi;
export const technicianStatusesApi = taskStatusesApi;
export const leaveTypesApi = prioritiesApi;

// Bulk operations
export const bulkLookupsApi = {
  async bulkCreateLookups(category: string, items: CreateLookupRequest[]): Promise<LookupListResponse> {
    await delay();
    const createdItems = items.map(item => ({
      id: Date.now().toString() + Math.random(),
      name: item.name || 'New Item',
      ...item,
      isActive: item.isActive ?? true
    }));
    return { items: createdItems, totalCount: createdItems.length };
  },
  async bulkUpdateLookups(category: string, items: { id: string; data: UpdateLookupRequest }[]): Promise<LookupListResponse> {
    await delay();
    const updatedItems = items.map(({ id, data }) => ({
      id,
      name: data.name || 'Updated Item',
      ...data,
      isActive: data.isActive ?? true
    }));
    return { items: updatedItems, totalCount: updatedItems.length };
  },
  async bulkDeleteLookups(category: string, ids: string[]): Promise<void> {
    await delay();
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

export default {
  articleCategories: articleCategoriesApi,
  articleStatuses: articleStatusesApi,
  serviceCategories: serviceCategoriesApi,
  currencies: currenciesApi,
  countries: countriesApi,
  priorities: prioritiesApi,
  eventTypes: eventTypesApi,
  taskStatuses: taskStatusesApi,
  projectStatuses: projectStatusesApi,
  projectTypes: projectTypesApi,
  offerStatuses: offerStatusesApi,
  technicianStatuses: technicianStatusesApi,
  leaveTypes: leaveTypesApi,
  skills: skillsApi,
  bulk: bulkLookupsApi,
  handleError: handleApiError,
};
