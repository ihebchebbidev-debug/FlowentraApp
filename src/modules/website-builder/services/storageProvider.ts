/**
 * Storage Provider Abstraction
 * 
 * Defines a clean interface for site persistence that can be implemented
 * by different backends (localStorage, REST API, Supabase, etc.)
 * 
 * Usage:
 *   import { storageProvider, setStorageProvider } from './storageProvider';
 *   
 *   // Switch to API backend
 *   setStorageProvider(new ApiStorageProvider());
 *   
 *   // Use the current provider
 *   const sites = await storageProvider.listSites();
 */
import type { WebsiteSite, SitePage, SiteTheme, SiteLanguage, BuilderComponent } from '../types';
import { createLogger } from '@/utils/logger';

const log = createLogger('WB:Storage');

// ══════════════════════════════════════════════════════════════════
// Storage Provider Interface
// ══════════════════════════════════════════════════════════════════

export interface StorageResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface ListSitesOptions {
  userId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  filter?: {
    published?: boolean;
    search?: string;
  };
}

export interface CreateSiteInput {
  name: string;
  theme?: SiteTheme;
  pages?: SitePage[];
  userId?: string;
  defaultLanguage?: string;
  languages?: SiteLanguage[];
}

export interface UpdateSiteInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  favicon?: string;
  theme?: SiteTheme;
  pages?: SitePage[];
  published?: boolean;
  defaultLanguage?: string;
}

export interface IStorageProvider {
  // Site CRUD
  listSites(options?: ListSitesOptions): Promise<StorageResult<WebsiteSite[]>>;
  getSite(siteId: string): Promise<StorageResult<WebsiteSite>>;
  getSiteBySlug(slug: string): Promise<StorageResult<WebsiteSite>>;
  createSite(input: CreateSiteInput): Promise<StorageResult<WebsiteSite>>;
  updateSite(input: UpdateSiteInput): Promise<StorageResult<WebsiteSite>>;
  deleteSite(siteId: string): Promise<StorageResult<void>>;
  duplicateSite(siteId: string, newName?: string): Promise<StorageResult<WebsiteSite>>;
  
  // Page operations
  addPage(siteId: string, page: Omit<SitePage, 'id'>): Promise<StorageResult<SitePage>>;
  updatePage(siteId: string, pageId: string, updates: Partial<SitePage>): Promise<StorageResult<SitePage>>;
  deletePage(siteId: string, pageId: string): Promise<StorageResult<void>>;
  reorderPages(siteId: string, pageIds: string[]): Promise<StorageResult<void>>;
  
  // Component operations
  updatePageComponents(
    siteId: string, 
    pageId: string, 
    components: BuilderComponent[],
    language?: string
  ): Promise<StorageResult<void>>;
  
  // Publishing
  publishSite(siteId: string): Promise<StorageResult<{ url: string; publishedAt: string }>>;
  unpublishSite(siteId: string): Promise<StorageResult<void>>;
  
  // Sharing
  getShareUrl(siteId: string): Promise<StorageResult<{ url: string; embedCode: string }>>;
}

// ══════════════════════════════════════════════════════════════════
// LocalStorage Implementation
// ══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'website_builder_sites';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function loadFromStorage(): WebsiteSite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(sites: WebsiteSite[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

export class LocalStorageProvider implements IStorageProvider {
  async listSites(options?: ListSitesOptions): Promise<StorageResult<WebsiteSite[]>> {
    try {
      let sites = loadFromStorage();
      
      // Apply filters
      if (options?.filter?.published !== undefined) {
        sites = sites.filter(s => s.published === options.filter!.published);
      }
      if (options?.filter?.search) {
        const search = options.filter.search.toLowerCase();
        sites = sites.filter(s => 
          s.name.toLowerCase().includes(search) ||
          s.description?.toLowerCase().includes(search)
        );
      }
      
      // Sort
      const sortBy = options?.sortBy || 'updatedAt';
      const sortOrder = options?.sortOrder || 'desc';
      sites.sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'desc' ? -cmp : cmp;
      });
      
      // Pagination
      if (options?.offset !== undefined) {
        sites = sites.slice(options.offset);
      }
      if (options?.limit !== undefined) {
        sites = sites.slice(0, options.limit);
      }
      
      return { data: sites, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to load sites', success: false };
    }
  }

  async getSite(siteId: string): Promise<StorageResult<WebsiteSite>> {
    try {
      const sites = loadFromStorage();
      const site = sites.find(s => s.id === siteId);
      if (!site) {
        return { data: null, error: 'Site not found', success: false };
      }
      return { data: site, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to load site', success: false };
    }
  }

  async getSiteBySlug(slug: string): Promise<StorageResult<WebsiteSite>> {
    try {
      const sites = loadFromStorage();
      const site = sites.find(s => s.slug === slug);
      if (!site) {
        return { data: null, error: 'Site not found', success: false };
      }
      return { data: site, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to load site', success: false };
    }
  }

  async createSite(input: CreateSiteInput): Promise<StorageResult<WebsiteSite>> {
    try {
      const { DEFAULT_THEME } = await import('../types');
      
      const homePage: SitePage = {
        id: generateId(),
        title: 'Home',
        slug: '',
        components: [],
        seo: { title: input.name },
        isHomePage: true,
        order: 0,
      };

      const site: WebsiteSite = {
        id: generateId(),
        name: input.name,
        slug: slugify(input.name),
        theme: input.theme ? { ...input.theme } : { ...DEFAULT_THEME },
        pages: input.pages || [homePage],
        published: false,
        defaultLanguage: input.defaultLanguage || 'en',
        languages: input.languages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const sites = loadFromStorage();
      sites.push(site);
      saveToStorage(sites);
      
      return { data: site, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to create site', success: false };
    }
  }

  async updateSite(input: UpdateSiteInput): Promise<StorageResult<WebsiteSite>> {
    try {
      const sites = loadFromStorage();
      const idx = sites.findIndex(s => s.id === input.id);
      if (idx === -1) {
        return { data: null, error: 'Site not found', success: false };
      }

      const { id, ...updates } = input;
      sites[idx] = { 
        ...sites[idx], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      saveToStorage(sites);
      
      return { data: sites[idx], error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to update site', success: false };
    }
  }

  async deleteSite(siteId: string): Promise<StorageResult<void>> {
    try {
      const sites = loadFromStorage().filter(s => s.id !== siteId);
      saveToStorage(sites);
      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to delete site', success: false };
    }
  }

  async duplicateSite(siteId: string, newName?: string): Promise<StorageResult<WebsiteSite>> {
    try {
      const result = await this.getSite(siteId);
      if (!result.success || !result.data) {
        return { data: null, error: 'Original site not found', success: false };
      }

      const original = result.data;
      const duplicated: WebsiteSite = {
        ...JSON.parse(JSON.stringify(original)),
        id: generateId(),
        name: newName || `${original.name} (copy)`,
        slug: slugify(newName || `${original.name}-copy`),
        published: false,
        publishedAt: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: original.pages.map(page => ({
          ...JSON.parse(JSON.stringify(page)),
          id: generateId(),
        })),
      };

      const sites = loadFromStorage();
      sites.push(duplicated);
      saveToStorage(sites);
      
      return { data: duplicated, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to duplicate site', success: false };
    }
  }

  async addPage(siteId: string, page: Omit<SitePage, 'id'>): Promise<StorageResult<SitePage>> {
    try {
      const result = await this.getSite(siteId);
      if (!result.success || !result.data) {
        return { data: null, error: 'Site not found', success: false };
      }

      const newPage: SitePage = {
        ...page,
        id: generateId(),
      };

      const site = result.data;
      site.pages.push(newPage);
      await this.updateSite({ id: siteId, pages: site.pages });
      
      return { data: newPage, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to add page', success: false };
    }
  }

  async updatePage(siteId: string, pageId: string, updates: Partial<SitePage>): Promise<StorageResult<SitePage>> {
    try {
      const result = await this.getSite(siteId);
      if (!result.success || !result.data) {
        return { data: null, error: 'Site not found', success: false };
      }

      const site = result.data;
      const pageIdx = site.pages.findIndex(p => p.id === pageId);
      if (pageIdx === -1) {
        return { data: null, error: 'Page not found', success: false };
      }

      site.pages[pageIdx] = { ...site.pages[pageIdx], ...updates };
      await this.updateSite({ id: siteId, pages: site.pages });
      
      return { data: site.pages[pageIdx], error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to update page', success: false };
    }
  }

  async deletePage(siteId: string, pageId: string): Promise<StorageResult<void>> {
    try {
      const result = await this.getSite(siteId);
      if (!result.success || !result.data) {
        return { data: null, error: 'Site not found', success: false };
      }

      const site = result.data;
      site.pages = site.pages.filter(p => p.id !== pageId);
      await this.updateSite({ id: siteId, pages: site.pages });
      
      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to delete page', success: false };
    }
  }

  async reorderPages(siteId: string, pageIds: string[]): Promise<StorageResult<void>> {
    try {
      const result = await this.getSite(siteId);
      if (!result.success || !result.data) {
        return { data: null, error: 'Site not found', success: false };
      }

      const site = result.data;
      const reordered: SitePage[] = [];
      pageIds.forEach((id, index) => {
        const page = site.pages.find(p => p.id === id);
        if (page) {
          reordered.push({ ...page, order: index });
        }
      });
      
      await this.updateSite({ id: siteId, pages: reordered });
      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to reorder pages', success: false };
    }
  }

  async updatePageComponents(
    siteId: string, 
    pageId: string, 
    components: BuilderComponent[],
    language?: string
  ): Promise<StorageResult<void>> {
    try {
      const result = await this.getSite(siteId);
      if (!result.success || !result.data) {
        return { data: null, error: 'Site not found', success: false };
      }

      const site = result.data;
      const pageIdx = site.pages.findIndex(p => p.id === pageId);
      if (pageIdx === -1) {
        return { data: null, error: 'Page not found', success: false };
      }

      if (language && site.pages[pageIdx].translations?.[language]) {
        site.pages[pageIdx].translations![language].components = components;
      } else {
        site.pages[pageIdx].components = components;
      }

      await this.updateSite({ id: siteId, pages: site.pages });
      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to update components', success: false };
    }
  }

  async publishSite(siteId: string): Promise<StorageResult<{ url: string; publishedAt: string }>> {
    try {
      const result = await this.getSite(siteId);
      if (!result.success || !result.data) {
        return { data: null, error: 'Site not found', success: false };
      }

      const publishedAt = new Date().toISOString();
      await this.updateSite({ id: siteId, published: true });
      
      // Generate public URL (this would be a real URL in production)
      const url = `/public/sites/${result.data.slug}`;
      
      return { data: { url, publishedAt }, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to publish site', success: false };
    }
  }

  async unpublishSite(siteId: string): Promise<StorageResult<void>> {
    try {
      await this.updateSite({ id: siteId, published: false });
      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to unpublish site', success: false };
    }
  }

  async getShareUrl(siteId: string): Promise<StorageResult<{ url: string; embedCode: string }>> {
    try {
      const result = await this.getSite(siteId);
      if (!result.success || !result.data) {
        return { data: null, error: 'Site not found', success: false };
      }

      const site = result.data;
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/public/sites/${site.slug}`;
      const embedCode = `<iframe src="${url}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
      
      return { data: { url, embedCode }, error: null, success: true };
    } catch (error) {
      return { data: null, error: 'Failed to generate share URL', success: false };
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// Provider Singleton
// ══════════════════════════════════════════════════════════════════

// Default to API provider — all data comes from backend
let currentProvider: IStorageProvider | null = null;
let providerInitPromise: Promise<void> | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!currentProvider) {
    // Lazy-init: create ApiStorageProvider via dynamic import
    // Use a fallback LocalStorageProvider synchronously while API provider loads
    currentProvider = new LocalStorageProvider();
    if (!providerInitPromise) {
      providerInitPromise = import('./apiStorageProvider').then(({ ApiStorageProvider }) => {
        currentProvider = new ApiStorageProvider();
      }).catch(() => {
        // Keep LocalStorageProvider as fallback
      });
    }
  }
  return currentProvider;
}

export function setStorageProvider(provider: IStorageProvider): void {
  currentProvider = provider;
}

// Export singleton for convenience
export const storageProvider = {
  get current() { return getStorageProvider(); },
};

// ══════════════════════════════════════════════════════════════════
// API Provider Initialization (call once at app boot)
// ══════════════════════════════════════════════════════════════════

let _apiInitialized = false;

/**
 * Initializes API storage + image providers.
 * Always uses backend — no localStorage fallback.
 */
export async function initApiProviders(): Promise<void> {
  if (_apiInitialized) return;
  _apiInitialized = true;

  try {
    const { ApiStorageProvider } = await import('./apiStorageProvider');
    const { ApiImageProvider } = await import('./apiImageProvider');
    const { setImageProvider } = await import('./imageService');

    const apiProvider = new ApiStorageProvider();
    setStorageProvider(apiProvider);
    setImageProvider(new ApiImageProvider());

    log.info('API providers initialized — using backend');
  } catch (err: any) {
    log.error('Failed to init API providers:', err);
    // Still use API provider even if init had issues — no localStorage fallback
    try {
      const { ApiStorageProvider } = await import('./apiStorageProvider');
      setStorageProvider(new ApiStorageProvider());
    } catch {}
  }
}
