// Articles Service - Backend API Integration
import { articlesApi } from '@/services/api/articlesApi';
import type { Article, ArticleSearchParams, CreateArticleRequest } from '@/types/articles';

export type InventoryArticle = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  sellPrice: number;
  status: "available" | "low_stock" | "out_of_stock" | string;
  lastUsed?: string;
  lastUsedBy?: string;
  location?: string;
  supplier?: string;
  description?: string;
  type?: 'material' | 'service';
};

// Map backend Article to InventoryArticle format
const mapToInventoryArticle = (article: Article): InventoryArticle => ({
  id: String(article.id),
  name: article.name,
  sku: article.sku || '',
  category: article.category || '',
  stock: article.stock || 0,
  minStock: article.minStock || 0,
  price: article.costPrice || 0,
  sellPrice: article.sellPrice || article.basePrice || 0,
  status: (article.stock || 0) <= 0 ? 'out_of_stock' : 
          (article.stock || 0) <= (article.minStock || 0) ? 'low_stock' : 'available',
  location: article.location,
  supplier: article.supplier,
  description: article.description,
  type: article.type,
  lastUsed: article.lastUsed,
  lastUsedBy: article.lastUsedBy,
});

// Cache for articles — only ever holds the *unfiltered* list so that
// getById() can never miss an article just because a filtered search ran.
let articlesCache: InventoryArticle[] | null = null;
let cacheTimestamp = 0;
let inFlightRefresh: Promise<InventoryArticle[]> | null = null;
const CACHE_TTL = 30000; // 30 seconds

export const ArticlesService = {
  async listAsync(params?: ArticleSearchParams): Promise<InventoryArticle[]> {
    try {
      const response = await articlesApi.getAll(params);
      const articles = (response.data || []).map(mapToInventoryArticle);
      const isUnfiltered = !params || Object.values(params).every(v => v === undefined || v === '' || v === null);
      if (isUnfiltered) {
        articlesCache = articles;
        cacheTimestamp = Date.now();
      }
      return articles;
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      // Never mask a failed refresh as fresh data: keep the old timestamp so
      // the next call retries instead of serving stale data for the full TTL.
      return articlesCache || [];
    }
  },

  list(): InventoryArticle[] {
    // Return cached data synchronously, trigger a single background refresh.
    if (!inFlightRefresh && (!articlesCache || Date.now() - cacheTimestamp > CACHE_TTL)) {
      inFlightRefresh = this.listAsync().finally(() => {
        inFlightRefresh = null;
      });
    }
    return articlesCache || [];
  },


  async getByIdAsync(id: string): Promise<InventoryArticle | undefined> {
    try {
      const article = await articlesApi.getById(id);
      return mapToInventoryArticle(article);
    } catch (error) {
      console.error('Failed to fetch article:', error);
      return undefined;
    }
  },

  getById(id: string): InventoryArticle | undefined {
    // Return from cache if available
    if (articlesCache) {
      return articlesCache.find(a => String(a.id) === String(id));
    }
    return undefined;
  },

  async upsertAsync(item: InventoryArticle): Promise<InventoryArticle | null> {
    try {
      const request: CreateArticleRequest = {
        type: item.type || 'material',
        name: item.name,
        sku: item.sku,
        category: item.category,
        description: item.description,
        status: item.status === 'out_of_stock' ? 'out_of_stock' : 
                item.status === 'low_stock' ? 'low_stock' : 'available',
        stock: item.stock,
        minStock: item.minStock,
        costPrice: item.price,
        sellPrice: item.sellPrice,
        location: item.location,
        supplier: item.supplier,
      };

      let result: Article;
      if (item.id && !item.id.startsWith('new-')) {
        result = await articlesApi.update(item.id, request);
      } else {
        result = await articlesApi.create(request);
      }
      
      // Invalidate cache
      articlesCache = null;
      cacheTimestamp = 0;
      
      return mapToInventoryArticle(result);
    } catch (error) {
      console.error('Failed to save article:', error);
      return null;
    }
  },

  upsert(item: InventoryArticle) {
    // Returns the promise so callers can await/handle failures instead of
    // silently losing the write.
    return this.upsertAsync(item);
  },

  async removeAsync(id: string): Promise<boolean> {
    try {
      await articlesApi.delete(id);
      // Invalidate cache
      articlesCache = null;
      cacheTimestamp = 0;
      return true;
    } catch (error) {
      console.error('Failed to delete article:', error);
      return false;
    }
  },

  remove(id: string) {
    // Returns the promise so callers can await/handle failures.
    return this.removeAsync(id);
  },

  // Clear cache manually if needed
  clearCache() {
    articlesCache = null;
    cacheTimestamp = 0;
  },
};
