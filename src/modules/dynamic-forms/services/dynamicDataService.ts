// Dynamic Data Service - Fetch options from entities for form fields
import { contactsApi } from '@/services/api/contactsApi';
import { articlesApi } from '@/services/api/articlesApi';
import { installationsApi } from '@/services/api/installationsApi';
import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/apiHeaders';
import { FieldOption } from '../types';
import {
  DynamicDataSource,
  DynamicDataEntityType,
  DataFilter,
} from '../types/dynamicDataTypes';

// Generic option type from dynamic data
export interface DynamicOption {
  value: string;
  label: string;
  raw?: any; // Original entity data
}

// Cache for fetched data to reduce API calls
const dataCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL_MS = 60000; // 1 minute cache

function getCacheKey(entityType: string, filters?: DataFilter[]): string {
  return `${entityType}:${JSON.stringify(filters || [])}`;
}

function getFromCache(key: string): any[] | null {
  const cached = dataCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  dataCache.delete(key);
  return null;
}

function setCache(key: string, data: any[]): void {
  dataCache.set(key, { data, timestamp: Date.now() });
}

// =====================================================
// Data Fetching Functions
// =====================================================

async function fetchContacts(): Promise<any[]> {
  const cacheKey = getCacheKey('contacts');
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const response = await contactsApi.getAll({ pageSize: 1000 });
    const contacts = response.contacts || [];
    setCache(cacheKey, contacts);
    return contacts;
  } catch (error) {
    console.error('Failed to fetch contacts for dynamic data:', error);
    return [];
  }
}

async function fetchArticles(type?: 'material' | 'service'): Promise<any[]> {
  const cacheKey = getCacheKey('articles', type ? [{ field: 'type', operator: 'equals', value: type }] : []);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const params = type ? { type } : undefined;
    const response = await articlesApi.getAll(params);
    const articles = response.data || [];
    setCache(cacheKey, articles);
    return articles;
  } catch (error) {
    console.error('Failed to fetch articles for dynamic data:', error);
    return [];
  }
}

async function fetchOffers(): Promise<any[]> {
  const cacheKey = getCacheKey('offers');
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const response = await fetch(`${API_URL}/api/offers?limit=1000`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    // Normalize field names for consistent access
    const offers = (data.data?.offers || data.offers || data.data || []).map((offer: any) => ({
      id: offer.id || offer.Id,
      offerNumber: offer.offerNumber || offer.OfferNumber || `OFF-${offer.id || offer.Id}`,
      title: offer.title || offer.Title || offer.name || offer.Name || '',
      status: offer.status || offer.Status || '',
      totalAmount: offer.totalAmount || offer.TotalAmount || offer.total || 0,
      createdAt: offer.createdAt || offer.CreatedAt || offer.created_at || '',
      customerName: offer.customerName || offer.CustomerName || offer.contact?.name || '',
    }));
    setCache(cacheKey, offers);
    return offers;
  } catch (error) {
    console.error('Failed to fetch offers for dynamic data:', error);
    return [];
  }
}

async function fetchSales(): Promise<any[]> {
  const cacheKey = getCacheKey('sales');
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const response = await fetch(`${API_URL}/api/sales?limit=1000`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    // Normalize field names for consistent access
    const sales = (data.data?.sales || data.sales || data.data || []).map((sale: any) => ({
      id: sale.id || sale.Id,
      saleNumber: sale.saleNumber || sale.SaleNumber || `SALE-${sale.id || sale.Id}`,
      title: sale.title || sale.Title || sale.name || sale.Name || '',
      status: sale.status || sale.Status || '',
      totalAmount: sale.totalAmount || sale.TotalAmount || sale.total || 0,
      createdAt: sale.createdAt || sale.CreatedAt || sale.created_at || '',
      customerName: sale.customerName || sale.CustomerName || '',
    }));
    setCache(cacheKey, sales);
    return sales;
  } catch (error) {
    console.error('Failed to fetch sales for dynamic data:', error);
    return [];
  }
}

async function fetchInstallations(): Promise<any[]> {
  const cacheKey = getCacheKey('installations');
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const response = await installationsApi.getAll({});
    const installations = response.installations || [];
    setCache(cacheKey, installations);
    return installations;
  } catch (error) {
    console.error('Failed to fetch installations for dynamic data:', error);
    return [];
  }
}

async function fetchUsers(): Promise<any[]> {
  const cacheKey = getCacheKey('users');
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const response = await fetch(`${API_URL}/api/Users`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    // Normalize field names for consistent access
    const users = (Array.isArray(data) ? data : data.users || data.data || []).map((user: any) => ({
      id: user.id || user.Id,
      name: user.name || user.Name || user.fullName || user.FullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email || user.Email || '',
      role: user.role || user.Role || user.roleName || '',
    }));
    setCache(cacheKey, users);
    return users;
  } catch (error) {
    console.error('Failed to fetch users for dynamic data:', error);
    return [];
  }
}

async function fetchServiceOrders(): Promise<any[]> {
  const cacheKey = getCacheKey('service_orders');
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  try {
    const response = await fetch(`${API_URL}/api/service-orders?limit=1000`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      // Fallback to mock data if API not available
      const mockData = await import('@/data/mock/serviceOrders.json');
      const serviceOrders = (mockData.default || []).map((so: any) => normalizeServiceOrder(so));
      setCache(cacheKey, serviceOrders);
      return serviceOrders;
    }
    
    const data = await response.json();
    // Normalize field names for consistent access
    const serviceOrders = (data.data?.serviceOrders || data.serviceOrders || data.data || []).map((so: any) => normalizeServiceOrder(so));
    setCache(cacheKey, serviceOrders);
    return serviceOrders;
  } catch (error) {
    console.error('Failed to fetch service orders for dynamic data:', error);
    // Fallback to mock data on error
    try {
      const mockData = await import('@/data/mock/serviceOrders.json');
      const serviceOrders = (mockData.default || []).map((so: any) => normalizeServiceOrder(so));
      setCache(cacheKey, serviceOrders);
      return serviceOrders;
    } catch {
      return [];
    }
  }
}

function normalizeServiceOrder(so: any): any {
  return {
    id: so.id || so.Id,
    orderNumber: so.orderNumber || so.OrderNumber || `SO-${so.id || so.Id}`,
    title: so.title || so.Title || so.description || '',
    status: so.status || so.Status || '',
    priority: so.priority || so.Priority || 'medium',
    serviceType: so.serviceType || so.ServiceType || '',
    customerName: so.customer?.company || so.customer?.contactPerson || so.customerName || so.CustomerName || '',
    customerId: so.customer?.id || so.customerId || so.CustomerId || '',
    scheduledAt: so.scheduledAt || so.ScheduledAt || so.scheduled_at || '',
    createdAt: so.createdAt || so.CreatedAt || so.created_at || '',
    assignedTechnicians: so.assignedTechnicians || [],
  };
}

// Clear cache for specific entity or all
export function clearDynamicDataCache(entityType?: DynamicDataEntityType): void {
  if (entityType) {
    for (const key of dataCache.keys()) {
      if (key.startsWith(entityType)) {
        dataCache.delete(key);
      }
    }
  } else {
    dataCache.clear();
  }
}

// =====================================================
// Filter & Sort Helpers
// =====================================================

function applyFilter(data: any[], filter: DataFilter): any[] {
  return data.filter(item => {
    const fieldValue = getNestedValue(item, filter.field);
    
    switch (filter.operator) {
      case 'equals':
        return String(fieldValue).toLowerCase() === String(filter.value).toLowerCase();
      case 'not_equals':
        return String(fieldValue).toLowerCase() !== String(filter.value).toLowerCase();
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(filter.value);
      case 'less_than':
        return Number(fieldValue) < Number(filter.value);
      case 'is_empty':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      case 'is_not_empty':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      default:
        return true;
    }
  });
}

function applyFilters(data: any[], filters: DataFilter[]): any[] {
  return filters.reduce((filtered, filter) => applyFilter(filtered, filter), data);
}

function sortData(data: any[], sortField: string, sortOrder: 'asc' | 'desc' = 'asc'): any[] {
  return [...data].sort((a, b) => {
    const aVal = getNestedValue(a, sortField);
    const bVal = getNestedValue(b, sortField);
    
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function formatDisplayValue(item: any, displayField: string, displayTemplate?: string): string {
  if (displayTemplate) {
    // Replace {fieldName} with actual values
    return displayTemplate.replace(/\{([^}]+)\}/g, (_, field) => {
      const value = getNestedValue(item, field);
      return value !== null && value !== undefined ? String(value) : '';
    });
  }
  
  const value = getNestedValue(item, displayField);
  return value !== null && value !== undefined ? String(value) : '';
}

// =====================================================
// Main Service
// =====================================================

export const dynamicDataService = {
  /**
   * Fetch options from a dynamic data source
   */
  async fetchOptions(dataSource: DynamicDataSource): Promise<DynamicOption[]> {
    let data: any[] = [];
    
    // Fetch data based on entity type
    switch (dataSource.entity_type) {
      case 'contacts':
        data = await fetchContacts();
        break;
      case 'articles':
        data = await fetchArticles();
        break;
      case 'materials':
        data = await fetchArticles('material');
        break;
      case 'services':
        data = await fetchArticles('service');
        break;
      case 'offers':
        data = await fetchOffers();
        break;
      case 'sales':
        data = await fetchSales();
        break;
      case 'installations':
        data = await fetchInstallations();
        break;
      case 'users':
        data = await fetchUsers();
        break;
      case 'service_orders':
        data = await fetchServiceOrders();
        break;
      default:
        console.warn(`Unknown entity type: ${dataSource.entity_type}`);
        return [];
    }
    
    // Apply filters
    if (dataSource.filters && dataSource.filters.length > 0) {
      data = applyFilters(data, dataSource.filters);
    }
    
    // Sort data
    if (dataSource.sort_field) {
      data = sortData(data, dataSource.sort_field, dataSource.sort_order);
    }
    
    // Limit results
    if (dataSource.limit && dataSource.limit > 0) {
      data = data.slice(0, dataSource.limit);
    }
    
    // Transform to options
    return data.map(item => ({
      value: String(getNestedValue(item, dataSource.value_field) || ''),
      label: formatDisplayValue(item, dataSource.display_field, dataSource.display_template),
      raw: item,
    }));
  },

  /**
   * Convert dynamic options to FieldOption format for form rendering
   */
  async fetchFieldOptions(dataSource: DynamicDataSource): Promise<FieldOption[]> {
    const options = await this.fetchOptions(dataSource);
    
    // Use the display label as the stored value (not the ID)
    return options.map((opt, index) => ({
      id: `dynamic_${index}_${opt.value}`,
      value: opt.label,
      label_en: opt.label,
      label_fr: opt.label,
    }));
  },

  /**
   * Check if entity type has available data
   */
  async hasData(entityType: DynamicDataEntityType): Promise<boolean> {
    try {
      const options = await this.fetchOptions({
        entity_type: entityType,
        display_field: 'id',
        value_field: 'id',
        limit: 1,
      });
      return options.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Get preview of options for configuration UI
   */
  async getPreview(dataSource: DynamicDataSource, maxItems = 5): Promise<DynamicOption[]> {
    const options = await this.fetchOptions({
      ...dataSource,
      limit: maxItems,
    });
    return options;
  },
};
