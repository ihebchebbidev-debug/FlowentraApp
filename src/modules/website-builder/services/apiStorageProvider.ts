/**
 * API Storage Provider
 *
 * Implements IStorageProvider by calling the .NET WB REST API.
 * Maps between frontend types and backend DTOs.
 */
import type { WebsiteSite, SitePage, BuilderComponent, SiteTheme } from '../types';
import type {
  IStorageProvider,
  StorageResult,
  ListSitesOptions,
  CreateSiteInput,
  UpdateSiteInput,
} from './storageProvider';
import {
  wbApi,
  mapSiteDtoToFrontend,
  mapPageDtoToFrontend,
  toBackendId,
  type WBSiteDto,
  type WBSiteListDto,
  type WBPageDto,
} from './apiClient';
import { showApiError } from './apiErrorHandler';

function ok<T>(data: T): StorageResult<T> {
  return { data, error: null, success: true };
}

function fail<T>(error: string, context?: { operation: string; entityType?: 'site' | 'page' }): StorageResult<T> {
  if (context) {
    showApiError({ message: error }, context);
  }
  return { data: null, error, success: false };
}

export class ApiStorageProvider implements IStorageProvider {
  // ── Site CRUD ──

  async listSites(options?: ListSitesOptions): Promise<StorageResult<WebsiteSite[]>> {
    try {
      const params: Record<string, string> = {};
      if (options?.filter?.search) params.SearchTerm = options.filter.search;
      if (options?.filter?.published !== undefined) params.Published = String(options.filter.published);
      if (options?.sortBy) {
        const sortMap: Record<string, string> = { updatedAt: 'UpdatedAt', createdAt: 'CreatedAt', name: 'Name' };
        params.SortBy = sortMap[options.sortBy] || 'UpdatedAt';
      }
      if (options?.sortOrder) params.SortDirection = options.sortOrder;
      if (options?.limit) params.PageSize = String(options.limit);
      if (options?.offset !== undefined && options?.limit) {
        params.PageNumber = String(Math.floor(options.offset / options.limit) + 1);
      }

      const { data } = await wbApi.get<WBSiteListDto>('/api/WBSites', { params });
      return ok(data.sites.map(mapSiteDtoToFrontend));
    } catch (err: any) {
      return fail(err.message || 'Failed to load sites', { operation: 'load', entityType: 'site' });
    }
  }

  async getSite(siteId: string): Promise<StorageResult<WebsiteSite>> {
    try {
      const { data } = await wbApi.get<WBSiteDto>(`/api/WBSites/${toBackendId(siteId)}`);
      return ok(mapSiteDtoToFrontend(data));
    } catch (err: any) {
      return fail(err.message || 'Failed to load site', { operation: 'load', entityType: 'site' });
    }
  }

  async getSiteBySlug(slug: string): Promise<StorageResult<WebsiteSite>> {
    try {
      const { data } = await wbApi.get<WBSiteDto>(`/api/WBSites/slug/${slug}`);
      return ok(mapSiteDtoToFrontend(data));
    } catch (err: any) {
      return fail(err.message || 'Failed to load site', { operation: 'load', entityType: 'site' });
    }
  }

  async createSite(input: CreateSiteInput): Promise<StorageResult<WebsiteSite>> {
    try {
      const body: Record<string, any> = {
        name: input.name,
        defaultLanguage: input.defaultLanguage || 'en',
      };
      if (input.theme) body.themeJson = JSON.stringify(input.theme);
      if (input.pages && input.pages.length > 0) {
        body.pages = input.pages.map((p, i) => ({
          siteId: 0,
          title: p.title,
          slug: p.slug,
          componentsJson: JSON.stringify(p.components || []),
          seoJson: JSON.stringify(p.seo || { title: p.title }),
          isHomePage: p.isHomePage ?? i === 0,
          sortOrder: p.order ?? i,
        }));
      }

      const { data } = await wbApi.post<WBSiteDto>('/api/WBSites', body);
      const site = mapSiteDtoToFrontend(data);

      // Save languages via update (CreateWBSiteRequestDto doesn't have languagesJson)
      if (input.languages && input.languages.length > 0) {
        try {
          await wbApi.put(`/api/WBSites/${data.id}`, {
            languagesJson: JSON.stringify(input.languages),
          });
          site.languages = input.languages;
        } catch {
          // Non-critical — site was created, languages can be added later
        }
      }

      // Save page translations via update (CreateWBPageRequestDto doesn't have translationsJson)
      if (input.pages && data.pages) {
        for (let i = 0; i < input.pages.length; i++) {
          const inputPage = input.pages[i];
          if (inputPage.translations && data.pages[i]) {
            try {
              await wbApi.put(`/api/WBPages/${data.pages[i].id}`, {
                translationsJson: JSON.stringify(inputPage.translations),
              });
            } catch {
              // Non-critical
            }
          }
        }
      }

      return ok(site);
    } catch (err: any) {
      return fail(err.message || 'Failed to create site', { operation: 'create', entityType: 'site' });
    }
  }

  async updateSite(input: UpdateSiteInput): Promise<StorageResult<WebsiteSite>> {
    try {
      const body: Record<string, any> = {};
      
      // Only include fields that are explicitly provided and not undefined
      // Filter out frontend-only properties that the backend doesn't expect
      if (input.name !== undefined && input.name !== null) body.name = input.name;
      if (input.slug !== undefined && input.slug !== null) body.slug = input.slug;
      if (input.description !== undefined) body.description = input.description || null;
      if (input.favicon !== undefined) body.favicon = input.favicon || null;
      if (input.theme !== undefined && input.theme !== null) {
        // Ensure theme is properly serialized
        body.themeJson = typeof input.theme === 'string' ? input.theme : JSON.stringify(input.theme);
      }
      if (input.published !== undefined) body.published = input.published;
      if (input.defaultLanguage !== undefined) body.defaultLanguage = input.defaultLanguage || 'en';

      // Only send site update if there's something to update
      if (Object.keys(body).length > 0) {
        await wbApi.put<WBSiteDto>(`/api/WBSites/${toBackendId(input.id)}`, body);
      }

      // If pages were updated locally, sync each page
      if (input.pages && input.pages.length > 0) {
        for (const page of input.pages) {
          // Determine if page is a backend page or client-side generated
          // Client-side IDs contain dashes (e.g., "1770636146211-abc1234")
          // Backend IDs are small integers (e.g., "6", "7")
          const isClientSideId = page.id.includes('-') || toBackendId(page.id) > 1_000_000_000;
          const pageId = toBackendId(page.id);
          
          // Build page body with only valid fields
          const pageBody: Record<string, any> = {};
          
          if (page.title !== undefined) pageBody.title = page.title;
          if (page.slug !== undefined) pageBody.slug = page.slug;
          if (page.isHomePage !== undefined) pageBody.isHomePage = page.isHomePage;
          if (page.order !== undefined) pageBody.sortOrder = page.order;
          
          // Only include components if they exist and are an array
          if (page.components !== undefined && Array.isArray(page.components)) {
            pageBody.componentsJson = JSON.stringify(page.components);
          }
          
          // Only include seo if it exists
          if (page.seo !== undefined && page.seo !== null) {
            pageBody.seoJson = JSON.stringify(page.seo);
          }
          
          // Only include translations if they exist
          if (page.translations !== undefined && page.translations !== null) {
            pageBody.translationsJson = JSON.stringify(page.translations);
          }

          // Only send if there's something to update
          if (Object.keys(pageBody).length === 0) continue;
          
          if (!isClientSideId && pageId > 0) {
            // Update existing page (backend ID)
            await wbApi.put(`/api/WBPages/${pageId}`, pageBody);
          } else {
            // Create new page - add siteId for creation
            pageBody.siteId = toBackendId(input.id);
            if (!pageBody.title) pageBody.title = 'Untitled Page';
            if (pageBody.slug === undefined) pageBody.slug = '';
            if (pageBody.isHomePage === undefined) pageBody.isHomePage = false;
            if (pageBody.sortOrder === undefined) pageBody.sortOrder = input.pages.indexOf(page);
            if (!pageBody.componentsJson) pageBody.componentsJson = '[]';
            if (!pageBody.seoJson) pageBody.seoJson = '{}';
            
            await wbApi.post('/api/WBPages', pageBody);
          }
        }
      }

      // Re-fetch to get the full updated site with any new page IDs
      return this.getSite(input.id);
    } catch (err: any) {
      return fail(err.message || 'Failed to update site', { operation: 'update', entityType: 'site' });
    }
  }

  async deleteSite(siteId: string): Promise<StorageResult<void>> {
    try {
      const backendId = toBackendId(siteId);
      if (backendId <= 0) {
        return fail(`Cannot delete site: invalid ID "${siteId}"`, { operation: 'delete', entityType: 'site' });
      }
      await wbApi.delete(`/api/WBSites/${backendId}`);
      return ok(undefined as any);
    } catch (err: any) {
      return fail(err.message || 'Failed to delete site', { operation: 'delete', entityType: 'site' });
    }
  }

  async duplicateSite(siteId: string): Promise<StorageResult<WebsiteSite>> {
    try {
      const { data } = await wbApi.post<WBSiteDto>(`/api/WBSites/${toBackendId(siteId)}/duplicate`);
      return ok(mapSiteDtoToFrontend(data));
    } catch (err: any) {
      return fail(err.message || 'Failed to duplicate site', { operation: 'duplicate', entityType: 'site' });
    }
  }

  // ── Page Operations ──

  async addPage(siteId: string, page: Omit<SitePage, 'id'>): Promise<StorageResult<SitePage>> {
    try {
      const { data } = await wbApi.post<WBPageDto>('/api/WBPages', {
        siteId: toBackendId(siteId),
        title: page.title,
        slug: page.slug,
        componentsJson: JSON.stringify(page.components || []),
        seoJson: JSON.stringify(page.seo || { title: page.title }),
        isHomePage: page.isHomePage ?? false,
        sortOrder: page.order ?? 0,
      });
      return ok(mapPageDtoToFrontend(data));
    } catch (err: any) {
      return fail(err.message || 'Failed to add page', { operation: 'create', entityType: 'page' });
    }
  }

  async updatePage(siteId: string, pageId: string, updates: Partial<SitePage>): Promise<StorageResult<SitePage>> {
    try {
      const body: Record<string, any> = {};
      
      // Only include fields that are explicitly provided
      if (updates.title !== undefined) body.title = updates.title;
      if (updates.slug !== undefined) body.slug = updates.slug;
      if (updates.components !== undefined) {
        body.componentsJson = JSON.stringify(updates.components || []);
      }
      if (updates.seo !== undefined) {
        body.seoJson = JSON.stringify(updates.seo || {});
      }
      if (updates.translations !== undefined) {
        body.translationsJson = JSON.stringify(updates.translations || {});
      }
      if (updates.isHomePage !== undefined) body.isHomePage = updates.isHomePage;
      if (updates.order !== undefined) body.sortOrder = updates.order;

      // Only send update if there's something to update
      if (Object.keys(body).length === 0) {
        // Nothing to update, just return current page
        const site = await this.getSite(siteId);
        if (site.success && site.data) {
          const page = site.data.pages.find(p => p.id === pageId);
          if (page) return ok(page);
        }
        return fail('Page not found', { operation: 'load', entityType: 'page' });
      }

      const { data } = await wbApi.put<WBPageDto>(`/api/WBPages/${toBackendId(pageId)}`, body);
      return ok(mapPageDtoToFrontend(data));
    } catch (err: any) {
      return fail(err.message || 'Failed to update page', { operation: 'update', entityType: 'page' });
    }
  }

  async deletePage(siteId: string, pageId: string): Promise<StorageResult<void>> {
    try {
      await wbApi.delete(`/api/WBPages/${toBackendId(pageId)}`);
      return ok(undefined as any);
    } catch (err: any) {
      return fail(err.message || 'Failed to delete page', { operation: 'delete', entityType: 'page' });
    }
  }

  async reorderPages(siteId: string, pageIds: string[]): Promise<StorageResult<void>> {
    try {
      await wbApi.put('/api/WBPages/reorder', {
        siteId: toBackendId(siteId),
        pageIds: pageIds.map(id => toBackendId(id)),
      });
      return ok(undefined as any);
    } catch (err: any) {
      return fail(err.message || 'Failed to reorder pages', { operation: 'reorder', entityType: 'page' });
    }
  }

  // ── Component Operations ──

  async updatePageComponents(
    siteId: string,
    pageId: string,
    components: BuilderComponent[],
    language?: string
  ): Promise<StorageResult<void>> {
    try {
      await wbApi.put(`/api/WBPages/${toBackendId(pageId)}/components`, {
        componentsJson: JSON.stringify(components),
        language: language || null,
      });
      return ok(undefined as any);
    } catch (err: any) {
      return fail(err.message || 'Failed to save components', { operation: 'save', entityType: 'page' });
    }
  }

  // ── Publishing ──

  async publishSite(siteId: string): Promise<StorageResult<{ url: string; publishedAt: string }>> {
    try {
      const { data } = await wbApi.post<WBSiteDto>(`/api/WBSites/${toBackendId(siteId)}/publish`);
      const site = mapSiteDtoToFrontend(data);
      return ok({
        url: site.publishedUrl || `/public/sites/${site.slug}`,
        publishedAt: site.publishedAt || new Date().toISOString(),
      });
    } catch (err: any) {
      return fail(err.message || 'Failed to publish site', { operation: 'publish', entityType: 'site' });
    }
  }

  async unpublishSite(siteId: string): Promise<StorageResult<void>> {
    try {
      await wbApi.post(`/api/WBSites/${toBackendId(siteId)}/unpublish`);
      return ok(undefined as any);
    } catch (err: any) {
      return fail(err.message || 'Failed to unpublish site', { operation: 'unpublish', entityType: 'site' });
    }
  }

  // ── Sharing ──

  async getShareUrl(siteId: string): Promise<StorageResult<{ url: string; embedCode: string }>> {
    try {
      const result = await this.getSite(siteId);
      if (!result.success || !result.data) return fail('Site not found', { operation: 'load', entityType: 'site' });

      const site = result.data;
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/public/sites/${site.slug}`;
      const embedCode = `<iframe src="${url}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;

      return ok({ url, embedCode });
    } catch (err: any) {
      return fail(err.message || 'Failed to generate share URL', { operation: 'share', entityType: 'site' });
    }
  }
}
