// Real API service for Articles - Materials & Services management
import type {
  Article,
  CreateArticleRequest,
  UpdateArticleRequest,
  ArticleSearchParams,
  ArticleListResponse,
  ArticleCategory,
  CreateCategoryRequest,
  Location,
  CreateLocationRequest,
  InventoryTransaction,
  CreateTransactionRequest,
  BatchUpdateStockRequest,
  BatchOperationResult,
} from '@/types/articles';
import { getAuthHeaders, getMutationHeaders, getMutationHeadersNoContentType } from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';
import {
  isOfflineNoCache503,
  parseOfflineNoCacheBody,
  throwIfNotOkAfterOfflineCheck,
  type OfflineNoCacheBody,
} from '@/services/offline/offlineHttpRead';
import {
  bulkImportErrorFromThrown,
  parseBulkImportHttpResponse,
} from '@/shared/import/parseBulkImportResponse';

function emptyArticleListResponse(page = 1, limit = 20): ArticleListResponse {
  return {
    data: [],
    pagination: { total: 0, page, limit, pages: 0 },
  };
}

async function parseArticleListResponse(response: Response, fallbackPage: number, fallbackLimit: number): Promise<ArticleListResponse> {
  // Handle 503 in one read — body must not be consumed twice
  if (response.status === 503) {
    const errJson = (await response.json().catch(() => null)) as OfflineNoCacheBody | null;
    if (isOfflineNoCache503(errJson)) {
      return emptyArticleListResponse(fallbackPage, fallbackLimit);
    }
    throw new Error(errJson?.message || 'Failed to fetch articles');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch articles' }));
    throw new Error((error as { message?: string }).message || 'Failed to fetch articles');
  }
  return (await response.json()) as ArticleListResponse;
}

// =====================================================
// Article CRUD Operations
// =====================================================

export const articlesApi = {
  async getAll(params?: ArticleSearchParams): Promise<ArticleListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.type) queryParams.append('type', params.type);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const response = await fetch(`${API_URL}/api/articles?${queryParams.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return parseArticleListResponse(response, page, limit);
  },

  async getById(id: string): Promise<Article> {
    const response = await fetch(`${API_URL}/api/articles/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Article not found (${response.status})`);
    const result = await response.json();
    return result.data ?? result;
  },

  async create(request: CreateArticleRequest): Promise<Article> {
    // Generate article number if not provided (required NOT NULL field)
    const generateArticleNumber = () => {
      const prefix = request.type === 'service' ? 'SVC' : 'MAT';
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${prefix}-${timestamp}-${random}`;
    };

    // Transform request to match backend CreateArticleDto exactly
    // CategoryId and LocationId now reference LookupItems table after ALTER TABLE
    const backendRequest: Record<string, any> = {
      name: request.name,
      articleNumber: request.sku || generateArticleNumber(), // Required NOT NULL
      description: request.description || '',
      type: request.type || 'material',
      unit: (request as any).unit || 'piece', // Respect provided unit or fallback to default
      isActive: true,
      // Required numeric fields with defaults
      purchasePrice: 0,
      salesPrice: 0,
      stockQuantity: 0,
    };

    // CategoryId - send as integer from lookups
    const categoryId = (request as any).categoryId;
    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      backendRequest.categoryId = Number(categoryId);
    }

    // Material fields - use exact backend column names
    if (request.stock !== undefined && request.stock !== null) {
      backendRequest.stockQuantity = Number(request.stock);
    }
    if (request.minStock !== undefined && request.minStock !== null) {
      backendRequest.minStockLevel = Number(request.minStock);
    }
    if (request.costPrice !== undefined && request.costPrice !== null) {
      backendRequest.purchasePrice = Number(request.costPrice);
    }
    if (request.sellPrice !== undefined && request.sellPrice !== null) {
      backendRequest.salesPrice = Number(request.sellPrice);
    }
    if (request.supplier && typeof request.supplier === 'string') {
      backendRequest.supplier = request.supplier;
    }
    
    // LocationId - send as integer from lookups
    const locationId = (request as any).locationId;
    if (locationId !== undefined && locationId !== null && locationId !== '') {
      backendRequest.locationId = Number(locationId);
    }

    // GroupId - send as integer from lookups
    const groupId = (request as any).groupId;
    if (groupId !== undefined && groupId !== null && groupId !== '') {
      backendRequest.groupId = Number(groupId);
    }

    // Service fields - map basePrice to salesPrice for backend compatibility
    if (request.type === 'service') {
      if (request.basePrice !== undefined && request.basePrice !== null) {
        backendRequest.salesPrice = Number(request.basePrice);
      }
      if (request.duration !== undefined && request.duration !== null) {
        backendRequest.duration = Number(request.duration);
      }
    }

    // Required skills — send as a string[] (backend CreateArticleDto.SkillsRequired
    // is string[] and is stored as a JSON array, which the dispatcher reads back).
    if (Array.isArray(request.skillsRequired) && request.skillsRequired.length > 0) {
      backendRequest.skillsRequired = request.skillsRequired;
    }

    // TVA rate - send for both material and service
    const tvaRate = (request as any).tvaRate;
    if (tvaRate !== undefined && tvaRate !== null && tvaRate !== '') {
      backendRequest.tvaRate = Number(tvaRate);
    }

    // Unit - ensure backend receives the unit if provided
    const reqUnit = (request as any).unit;
    if (reqUnit !== undefined && reqUnit !== null && reqUnit !== '') {
      backendRequest.unit = reqUnit;
    }

    console.log('Creating article with payload:', backendRequest);

    const response = await fetch(`${API_URL}/api/articles`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(backendRequest),
    });

    // Get response text first for better error logging
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText || 'Unknown error' };
    }

    if (!response.ok) {
      console.error('Article creation failed:', {
        status: response.status,
        statusText: response.statusText,
        response: responseData,
        sentPayload: backendRequest
      });
      
      // Build detailed error message
      let errorMessage = `Failed to create article (${response.status})`;
      if (responseData.message) {
        errorMessage = responseData.message;
      }
      if (responseData.errors && typeof responseData.errors === 'object') {
        const errorMessages = Object.entries(responseData.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        if (errorMessages) {
          errorMessage = errorMessages;
        }
      }
      if (responseData.title) {
        errorMessage = `${responseData.title}: ${errorMessage}`;
      }
      
      throw new Error(errorMessage);
    }

    console.log('Article created successfully:', responseData);
    return responseData.data || responseData;
  },

  async update(id: string, request: UpdateArticleRequest): Promise<Article> {
    // Transform request to match backend UpdateArticleRequestDto
    const backendRequest: Record<string, any> = {};
    
    // Basic fields
    if (request.name) backendRequest.name = request.name;
    if (request.description !== undefined) backendRequest.description = request.description;
    
    // CategoryId - map from request
    const categoryId = (request as any).categoryId;
    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      backendRequest.categoryId = Number(categoryId);
    }
    
    // Type field - always include if provided
    const requestType = (request as any).type;
    if (requestType) {
      backendRequest.type = requestType;
    }
    
    // Map status to isActive for backend
    if (request.status) {
      backendRequest.isActive = request.status !== 'discontinued' && request.status !== 'inactive';
    }
    
    // Optional fields
    if (request.sku) backendRequest.sku = request.sku;
    if (request.supplier) backendRequest.supplier = request.supplier;
    
    // Notes and Tags - send if backend supports them
    if (request.notes !== undefined) backendRequest.notes = request.notes;
    if (request.tags) backendRequest.tags = Array.isArray(request.tags) ? request.tags.join(',') : request.tags;

    // Material fields - use exact backend column names
    if (request.stock !== undefined && request.stock !== null) backendRequest.stockQuantity = Number(request.stock);
    if (request.minStock !== undefined && request.minStock !== null) backendRequest.minStockLevel = Number(request.minStock);
    if (request.costPrice !== undefined && request.costPrice !== null) backendRequest.purchasePrice = Number(request.costPrice);
    if (request.sellPrice !== undefined && request.sellPrice !== null) backendRequest.salesPrice = Number(request.sellPrice);
    
    // LocationId - map from request
    const locationId = (request as any).locationId || request.location;
    if (locationId !== undefined && locationId !== null && locationId !== '') {
      backendRequest.locationId = Number(locationId);
    }
    if (request.subLocation) backendRequest.subLocation = request.subLocation;

    // GroupId - map from request
    const groupId = (request as any).groupId;
    if (groupId !== undefined && groupId !== null && groupId !== '') {
      backendRequest.groupId = Number(groupId);
    }

    // Service fields - map basePrice to salesPrice for backend compatibility
    if (requestType === 'service') {
      if (request.basePrice !== undefined && request.basePrice !== null) {
        backendRequest.salesPrice = Number(request.basePrice);
      }
      if (request.duration !== undefined && request.duration !== null) {
        backendRequest.duration = Number(request.duration);
      }
    }

    // TVA rate - send for both material and service
    const tvaRate = (request as any).tvaRate;
    if (tvaRate !== undefined && tvaRate !== null && tvaRate !== '') {
      backendRequest.tvaRate = Number(tvaRate);
    }

    // Unit - include when updating if provided
    const reqUnit = (request as any).unit || (request as any).unit;
    if (reqUnit !== undefined && reqUnit !== null && reqUnit !== '') {
      backendRequest.unit = reqUnit;
    }
    
    // Required skills — backend UpdateArticleDto.SkillsRequired is string[] (stored as
    // a JSON array). Send the array as-is; an empty array clears the skills.
    if (request.skillsRequired !== undefined) {
      backendRequest.skillsRequired = Array.isArray(request.skillsRequired)
        ? request.skillsRequired
        : [request.skillsRequired].filter(Boolean);
    }
    if (request.materialsNeeded) backendRequest.materialsNeeded = Array.isArray(request.materialsNeeded) ? request.materialsNeeded.join(',') : request.materialsNeeded;
    if (request.preferredUsers) backendRequest.preferredUsers = Array.isArray(request.preferredUsers) ? request.preferredUsers.join(',') : request.preferredUsers;

    console.log('Updating article with payload:', backendRequest);

    const response = await fetch(`${API_URL}/api/articles/${id}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(backendRequest),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update article' }));
      console.error('Article update failed:', error);
      let errorMessage = error.message || 'Failed to update article';
      if (error.errors && typeof error.errors === 'object') {
        const errorMessages = Object.values(error.errors).flat();
        errorMessage = errorMessages.join(', ') || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Article updated successfully:', result);
    return result.data || result;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/articles/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete article' }));
      throw new Error(error.message || 'Failed to delete article');
    }
  },

  async getGroups(): Promise<Location[]> {
    return groupsApi.getAll();
  },

  async createGroup(request: CreateLocationRequest): Promise<Location> {
    return groupsApi.create(request);
  },
};

// =====================================================
// Category Operations
// =====================================================

export const categoriesApi = {
  async getAll(): Promise<ArticleCategory[]> {
    const response = await fetch(`${API_URL}/api/articles/categories`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch categories');
    return await response.json();
  },

  async create(request: CreateCategoryRequest): Promise<ArticleCategory> {
    const response = await fetch(`${API_URL}/api/articles/categories`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create category' }));
      throw new Error(error.message || 'Failed to create category');
    }

    return await response.json();
  },
};

// =====================================================
// Location Operations
// =====================================================

export const locationsApi = {
  async getAll(): Promise<Location[]> {
    const response = await fetch(`${API_URL}/api/articles/locations`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }

    if (!response.ok) {
      throw new Error('Failed to fetch locations');
    }

    return await response.json();
  },

  async create(request: CreateLocationRequest): Promise<Location> {
    const response = await fetch(`${API_URL}/api/articles/locations`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create location' }));
      throw new Error(error.message || 'Failed to create location');
    }

    return await response.json();
  },
};

// =====================================================
// Group Operations (using Lookups)
// =====================================================

export const groupsApi = {
  async getAll(): Promise<any[]> {
    const response = await fetch(`${API_URL}/api/articles/groups`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch groups');
    const data = await response.json();
    console.log('groupsApi.getAll() response:', data);
    // Backend returns { items: [...], totalCount: ... }
    return data.items || [];
  },

  async create(request: CreateLocationRequest): Promise<any> {
    const response = await fetch(`${API_URL}/api/articles/groups`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create group' }));
      throw new Error(error.message || 'Failed to create group');
    }

    return await response.json();
  },
};

// =====================================================
// Inventory Transaction Operations
// =====================================================

export const transactionsApi = {
  /** GET list (used by hydration + inventory views). Same path as POST create. */
  async getAll(): Promise<InventoryTransaction[]> {
    const response = await fetch(`${API_URL}/api/articles/transactions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch transactions');
    const data = await response.json();
    if (Array.isArray(data)) return data;
    return data.items ?? data.data ?? [];
  },

  async create(request: CreateTransactionRequest): Promise<InventoryTransaction> {
    const response = await fetch(`${API_URL}/api/articles/transactions`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create transaction' }));
      throw new Error(error.message || 'Failed to create transaction');
    }

    const result = await response.json();
    return result.data || result;
  },

  async getByArticle(articleId: string): Promise<InventoryTransaction[]> {
    const response = await fetch(`${API_URL}/api/articles/${articleId}/transactions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch transactions');
    return await response.json();
  },
};

// =====================================================
// Batch Operations
// =====================================================

export const batchApi = {
  async updateStock(request: BatchUpdateStockRequest): Promise<BatchOperationResult> {
    const response = await fetch(`${API_URL}/api/articles/batch`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to batch update stock' }));
      throw new Error(error.message || 'Failed to batch update stock');
    }

    const result = await response.json();
    return result.data || result;
  },
};

// Export all as default
export default {
  articles: articlesApi,
  categories: categoriesApi,
  locations: locationsApi,
  transactions: transactionsApi,
  batch: batchApi,
};

// =====================================================
// Bulk Import Operations
// =====================================================

export interface ArticleBulkImportRequest {
   articles: Array<{
     name: string;
     sku?: string;
     description?: string;
      type: 'material' | 'service';
      unit?: string;
     category?: string;
     stock?: number;
     minStock?: number;
     costPrice?: number;
     sellPrice?: number;
     basePrice?: number;
     duration?: number;
     supplier?: string;
     location?: string;
   }>;
   skipDuplicates?: boolean;
   updateExisting?: boolean;
 }
 
 export interface ArticleBulkImportResult {
   totalProcessed: number;
   successCount: number;
   failedCount: number;
   skippedCount: number;
   errors: string[];
   importedItems?: any[];
 }
 
 export const articlesBulkImportApi = {
   /**
    * High-performance bulk import using backend batch processing.
    * Supports up to 10,000+ records with automatic batching.
    */
   async bulkImport(request: ArticleBulkImportRequest): Promise<ArticleBulkImportResult> {
     try {
       // Map to CreateArticleRequestDto (bulk import endpoint) — ints only for stock/duration.
       const backendArticles = request.articles.map(mapArticleRowForBulkImport);
 
       const response = await fetch(`${API_URL}/api/articles/import`, {
         method: 'POST',
         headers: getMutationHeaders(),
         body: JSON.stringify({
           articles: backendArticles,
           skipDuplicates: request.skipDuplicates ?? true,
           updateExisting: request.updateExisting ?? false,
         }),
       });

       return await parseBulkImportHttpResponse(
         response,
         request.articles.length,
         (data) => ({
           totalProcessed: Number(data.totalProcessed) || request.articles.length,
           successCount: Number(data.successCount) || 0,
           failedCount: Number(data.failedCount) || 0,
           skippedCount: Number(data.skippedCount) || 0,
           errors: Array.isArray(data.errors) ? data.errors.map(String) : [],
           importedItems: (data.importedArticles ?? data.importedItems ?? []) as unknown[],
         }),
       );
     } catch (error) {
       throw bulkImportErrorFromThrown(error);
     }
   }
 };

/** Coerce Excel decimals to integers for backend int? fields (stock, duration). */
function toImportInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n);
}

/** Build payload for POST /api/articles/import (CreateArticleRequestDto). */
function mapArticleRowForBulkImport(
  article: ArticleBulkImportRequest['articles'][number],
): Record<string, unknown> {
  const type = article.type === 'service' ? 'service' : 'material';
  const row: Record<string, unknown> = {
    name: String(article.name ?? '').trim(),
    description: article.description ?? '',
    type,
    unit: article.unit ?? 'piece',
    status: 'active',
    isActive: true,
  };

  const sku = article.sku?.trim();
  if (sku) {
    row.sku = sku;
    row.articleNumber = sku;
  }
  if (article.category?.trim()) row.category = article.category.trim();
  if (article.supplier?.trim()) row.supplier = article.supplier.trim();
  if (article.location?.trim()) row.location = article.location.trim();

  if (type === 'service') {
    const basePrice = Number(article.basePrice ?? article.sellPrice ?? 0) || 0;
    row.basePrice = basePrice;
    row.sellPrice = basePrice;
    row.salesPrice = basePrice;
    row.stock = 0;
    const duration = toImportInt(article.duration);
    if (duration !== undefined) row.duration = duration;
  } else {
    row.stock = toImportInt(article.stock) ?? 0;
    const minStock = toImportInt(article.minStock);
    if (minStock !== undefined) row.minStock = minStock;
    row.costPrice = Number(article.costPrice ?? 0) || 0;
    row.sellPrice = Number(article.sellPrice ?? 0) || 0;
    row.purchasePrice = row.costPrice;
    row.salesPrice = row.sellPrice;
  }

  return row;
}
